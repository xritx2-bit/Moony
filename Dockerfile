FROM node:20-alpine

# Install system dependencies (ffmpeg for discord voice & music)
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

WORKDIR /usr/src/app

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose Keep-Alive & Dashboard Web Port
EXPOSE 3000

# Run as non-root node user
USER node

# Start Moony
CMD ["node", "src/index.js"]
