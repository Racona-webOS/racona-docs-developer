# Build stage
FROM oven/bun:latest AS builder

ARG UMAMI_WEBSITE_ID_DOCS
ENV UMAMI_WEBSITE_ID_DOCS=$UMAMI_WEBSITE_ID_DOCS

ARG GITHUB_URL
ENV GITHUB_URL=$GITHUB_URL

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY src ./src
COPY public ./public
COPY astro.config.mjs tsconfig.json ./

RUN bun run build

# Production stage
FROM nginx:alpine AS production

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
