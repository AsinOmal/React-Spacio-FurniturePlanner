FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend source code
COPY . .

# Expose backend API port used by Choreo scale-to-zero.
EXPOSE 5000

# Start the Express server
CMD ["node", "index.js"]
