FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY src/ ./src/
COPY tsconfig.json ./

# Build
RUN pnpm build

EXPOSE 8787

CMD ["pnpm", "start"]
