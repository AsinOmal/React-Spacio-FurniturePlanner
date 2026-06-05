# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies and build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with the UNPRIVILEGED Nginx image (runs as non-root user 101
# on port 8080). Container platforms like Choreo reject root containers
# (Checkov CKV_DOCKER_3); a non-root user can't bind :80, hence port 8080.
FROM nginxinc/nginx-unprivileged:alpine

# Nginx config as a TEMPLATE — the entrypoint runs envsubst to inject ${BACKEND_URL}
# at container start, writing the result to /etc/nginx/conf.d/default.conf.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy production build files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the non-privileged HTTP port and run as the non-root user.
EXPOSE 8080
USER 101

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
