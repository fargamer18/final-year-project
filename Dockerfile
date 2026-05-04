FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# The backend serves static files and provides the API
EXPOSE 3001

CMD ["node", "server.mjs"]
