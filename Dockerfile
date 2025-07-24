# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S taskapi -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=builder --chown=taskapi:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=taskapi:nodejs /app/dist ./dist

# Copy package.json for metadata
COPY --chown=taskapi:nodejs package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Switch to non-root user
USER taskapi

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
    res.statusCode === 200 ? process.exit(0) : process.exit(1) \
  }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "dist/app.js"] 