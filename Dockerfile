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
# SECURITY: Only replace the variable assignment, NOT the check logic
# Use word boundaries and line-specific patterns to avoid replacing check comparisons
RUN sed -i "s/\\(let TMDB_API_KEY = \\)'YOUR_TMDB_API_KEY'/\\1'${TMDB_API_KEY}'/g" script.js && \
    sed -i "s/\\(let GOOGLE_BOOKS_API_KEY = \\)'YOUR_GOOGLE_BOOKS_API_KEY'/\\1'${GOOGLE_BOOKS_API_KEY}'/g" script.js && \
    sed -i "s/\\(let DOESTHEDOGDIE_API_KEY = \\)'YOUR_DTDD_API_KEY'/\\1'${DOESTHEDOGDIE_API_KEY}'/g" script.js

# Expose port 8080
EXPOSE 8080

# Run the Node.js server
CMD ["node", "server.js"]

