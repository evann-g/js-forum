FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# SQLite data directory
RUN mkdir -p /app/database

EXPOSE 8000

CMD ["node", "src/server.js"]