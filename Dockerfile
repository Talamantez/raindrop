FROM node:18-slim

WORKDIR /app

# Install required system dependencies  
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Use regular npm install
RUN npm install

# Copy source files
COPY . .

# Create mock VSCode workspace directory  
RUN mkdir -p /mock/workspace/src/{models,controllers,views}

# Set environment variables
ENV NODE_ENV=test
ENV MOCK_WORKSPACE_PATH=/mock/workspace

# Create non-root user
RUN useradd -m nodeuser && chown -R nodeuser:nodeuser /app /mock
USER nodeuser

# Command to run tests
CMD ["npm", "test"]