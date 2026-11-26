FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci --workspace=frontend --include-workspace-root


FROM deps AS dev

COPY backend/src ./backend/src
COPY frontend ./frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace", "frontend", "--", "--host", "0.0.0.0", "--port", "5173"]


FROM deps AS builder

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

COPY backend/src ./backend/src
COPY frontend ./frontend

RUN npm run build --workspace=frontend


FROM nginx:1.27-alpine AS runner

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
