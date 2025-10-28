# syntax = docker/dockerfile:1

# Adjustable Node.js version
ARG NODE_VERSION=20.12.2

# Base image
FROM node:${NODE_VERSION}-slim AS base
LABEL fly_launch_runtime="Node.js"
WORKDIR /app

# Install build tooling once (used by subsequent stages)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Install only production deps
FROM base AS deps
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Build with dev deps
FROM base AS build
ENV NODE_ENV=development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Final runnable image
FROM node:${NODE_VERSION}-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy production node_modules and built artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Fly will route traffic to this container port
EXPOSE 8081

# Start the compiled server
CMD [ "node", "dist/index.js" ]
