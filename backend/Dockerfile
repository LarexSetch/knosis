FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci --workspace=backend --include-workspace-root


FROM deps AS dev

ENV NODE_ENV=development

COPY backend ./backend

EXPOSE 3000

CMD ["npm", "run", "start:dev", "--workspace", "backend"]


FROM deps AS builder

COPY backend ./backend

RUN npm run build --workspace=backend


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci --omit=dev --workspace=backend --include-workspace-root && npm cache clean --force

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/src/database/migrations ./backend/src/database/migrations

EXPOSE 3000

CMD ["node", "backend/dist/main.js"]
