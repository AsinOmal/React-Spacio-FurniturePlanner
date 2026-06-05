# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies and build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Nginx config as a TEMPLATE — the entrypoint runs envsubst to inject ${BACKEND_URL}
# at container start, writing the result to /etc/nginx/conf.d/default.conf.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy production build files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
