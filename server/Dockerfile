FROM node:20-slim AS builder

WORKDIR /app

# Copy shared source files that the server imports
COPY src/types/ src/types/
COPY src/engine/ src/engine/
COPY src/utils/ src/utils/

# Copy server files
COPY server/package.json server/package-lock.json* server/
COPY server/tsconfig.json server/
COPY server/src/ server/src/

# Install dependencies and build
WORKDIR /app/server
RUN npm install
RUN npx tsc

# Production stage
FROM node:20-slim

WORKDIR /app/server

COPY --from=builder /app/server/package.json /app/server/package-lock.json* ./
RUN npm install --omit=dev

COPY --from=builder /app/server/dist/ /app/server/dist/

EXPOSE 3001

CMD ["node", "dist/server/src/index.js"]
