# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We must pass the dynamic VITE_API_URL via Compose if needed, or default it.
# Usually, in Docker Compose on the same network, it can route via reverse proxy.
# We will use /api relative paths or inject it from compose.
# Koyeb injects env variables at the container level.
RUN npm run build

# Serve stage
FROM nginx:alpine
# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default Nginx config to support client-side routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
