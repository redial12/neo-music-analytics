# Use official Confluent Kafka image as base, then add Node.js
FROM confluentinc/cp-kafka:7.5.0

USER root

# Install Node.js and npm
RUN yum update -y && \
    yum install -y nodejs npm wget && \
    yum clean all

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY server/ .

# Create volume mount point and set permissions
RUN mkdir -p /var/lib/kafka/data && \
    chown -R appuser:appuser /var/lib/kafka

# Expose ports
EXPOSE 3001 9092

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Copy and setup startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]