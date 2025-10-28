FROM node:18-slim

WORKDIR /app

# Install Python for http.server
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Install API proxy dependencies
RUN npm install

# Copy all files
COPY . .

# Expose ports 8080 (HTTP server) and 3000 (API proxy)
EXPOSE 8080 3000

# Run both Python HTTP server and API proxy
CMD ["sh", "-c", "python3 -m http.server 8080 & node api-proxy.js"]

