FROM node:18-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose port 8080
EXPOSE 8080

# Run the Node.js server
CMD ["node", "server.js"]

