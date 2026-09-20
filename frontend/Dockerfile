
FROM node:20-alpine

WORKDIR /app

# Install deps first so this layer is cached unless package*.json changes
COPY package*.json ./
RUN npm install 

# Rest of the source (will be overridden by the bind mount in dev anyway)
COPY . .

EXPOSE 5173

# --host is required so Vite's dev server is reachable from outside the container
# -- is a separator to pass arguments to the npm script
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]