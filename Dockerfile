# Opcional (Railway recomienda NIXPACKS + railway.toml). Imagen monolítica para pruebas locales.
FROM node:20-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10 --activate

# Prisma necesita libssl en tiempo de ejecución.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec prisma generate && pnpm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["pnpm", "run", "start:railway"]
