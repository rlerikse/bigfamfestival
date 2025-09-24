# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app


# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Set environment variables
ENV NODE_ENV=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 8080

# Run application (tsconfig outputs compiled files under dist/src)
CMD ["node", "dist/src/main.js"]
