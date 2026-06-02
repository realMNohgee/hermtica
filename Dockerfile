# ─── Hermtica MCP Server ────────────────────────────────
# Build: docker build -t hermtica-mcp .
# Run:   docker run -p 3000:3000 hermtica-mcp
# Test:  curl -X POST http://localhost:3000/api/mcp \
#          -H 'Content-Type: application/json' \
#          -d '{"method":"tools/list"}'

FROM node:22-alpine

WORKDIR /app

# Install deps (production only keeps image small)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURSO_DATABASE_URL=file:./hermtica.db

RUN npm run build

# Runtime
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- --post-data='{"method":"tools/list"}' \
  --header='Content-Type: application/json' \
  http://localhost:3000/api/mcp || exit 1

CMD ["npm", "start"]
