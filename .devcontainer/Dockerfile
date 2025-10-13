FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

# Install additional system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        postgresql-client \
        curl \
        wget \
        git \
        vim \
        nano \
        jq \
        tree \
        htop \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@latest

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli@latest

# Install useful development tools
RUN npm install -g nodemon ts-node typescript

# Set up workspace
WORKDIR /workspace

# Copy package files for dependency installation
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Set the default user
USER node
