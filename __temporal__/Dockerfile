FROM node:23-alpine3.20

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PATH="./node_modules/.bin:$PATH"

RUN corepack enable

COPY package.json .
COPY pnpm-lock.yaml .

RUN pnpm install --frozen-lockfile

ENTRYPOINT [ "pnpm", "dev" ]
