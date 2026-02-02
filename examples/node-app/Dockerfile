# DevSecOps Demo - Node.js Application Dockerfile
# Multi-stage build with security best practices

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:20-alpine AS deps

# Check https://github.com/nodejs/docker-node#nodealpine for why libc6-compat might be needed
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean cache
RUN npm ci --only=production && \
    npm cache clean --force

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM node:20-alpine AS production

# Labels
LABEL maintainer="DevSecOps Team" \
      version="1.0.0" \
      description="DevSecOps Demo Node.js Application" \
      org.opencontainers.image.source="https://github.com/your-org/devsecops-pipe"

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080 \
    # Disable npm update check
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    # Enable Node.js security features
    NODE_OPTIONS="--no-experimental-fetch"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

# Install security updates and curl for health checks
RUN apk update && \
    apk upgrade && \
    apk add --no-cache curl dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodeuser:nodejs index.js ./

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use dumb-init as PID 1 to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run the application
CMD ["node", "index.js"]
