FROM node:18-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# SECURITY: Inject API keys at build time from build arguments
# These will be provided via docker-compose or docker build --build-arg
ARG TMDB_API_KEY=YOUR_TMDB_API_KEY
ARG GOOGLE_BOOKS_API_KEY=YOUR_GOOGLE_BOOKS_API_KEY
ARG DOESTHEDOGDIE_API_KEY=YOUR_DTDD_API_KEY

# Replace API key placeholders in script.js with actual values
RUN sed -i "s/YOUR_TMDB_API_KEY/${TMDB_API_KEY}/g" script.js && \
    sed -i "s/YOUR_GOOGLE_BOOKS_API_KEY/${GOOGLE_BOOKS_API_KEY}/g" script.js && \
    sed -i "s/YOUR_DTDD_API_KEY/${DOESTHEDOGDIE_API_KEY}/g" script.js

# Expose port 8080
EXPOSE 8080

# Run the Node.js server
CMD ["node", "server.js"]

