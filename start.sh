#!/bin/sh
# Start the Python HTTP server in the background
python3 -m http.server 8080 &

# Start the API proxy server in the background
node api-proxy.js &

# Keep the container running
wait

