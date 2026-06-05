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

# Switch to root only to grant our high UID ownership of the dirs nginx writes
# to at runtime (cache + the envsubst output dir), then drop back to non-root.
USER root
RUN chown -R 10001:0 /var/cache/nginx /etc/nginx/conf.d /tmp

# Nginx config as a TEMPLATE — the entrypoint runs envsubst to inject ${BACKEND_URL}
# at container start, writing the result to /etc/nginx/conf.d/default.conf.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy production build files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the non-privileged HTTP port and run as a UID in Choreo's allowed range.
EXPOSE 8080
USER 10001

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
