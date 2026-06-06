# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies and build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with the UNPRIVILEGED Nginx image (non-root, port 8080).
# Container platforms like Choreo reject root containers (CKV_DOCKER_3) and
# additionally require the UID to be in [10000, 20000] (CKV_CHOREO_1). A
# non-root user can't bind :80, hence port 8080.
FROM nginxinc/nginx-unprivileged:alpine

# Backend URL the SPA's /api and /uploads proxy to. Baked in as a default
# because Choreo Web Application components don't expose runtime env vars.
# Overridable per-build with --build-arg BACKEND_URL=... ; docker-compose
# overrides it locally at runtime (BACKEND_URL=http://backend:5005).
ARG BACKEND_URL="https://3cb61e27-89e3-425a-8362-2b938772eb42-dev.e1-us-east-azure.choreoapis.dev/spacio/server/v1.0"

USER root
# Choreo runs the container with a READ-ONLY root filesystem, so nginx can't
# write its config at runtime. Render the final config at BUILD time (envsubst
# on ${BACKEND_URL} only — nginx's own $vars are left intact) and remove the
# entrypoint scripts that would try to write to /etc/nginx at startup.
COPY nginx.conf /tmp/default.conf.template
RUN BACKEND_URL="${BACKEND_URL}" envsubst '${BACKEND_URL}' < /tmp/default.conf.template > /etc/nginx/conf.d/default.conf \
 && rm /tmp/default.conf.template \
 && rm -f /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh \
          /docker-entrypoint.d/20-envsubst-on-templates.sh

# Copy production build files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the non-privileged HTTP port and run as a UID in Choreo's allowed range.
EXPOSE 8080
USER 10001

# Start Nginx (config already rendered; runtime writes go to /tmp)
CMD ["nginx", "-g", "daemon off;"]
