FROM node:23-alpine3.20

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PATH="./node_modules/.bin:$PATH"


COPY ./pnpm-workspace.yaml .
COPY ./package.json .

RUN corepack enable && corepack install

COPY ./applications/server/package.json ./applications/server/package.json 
COPY ./applications/server/tsconfig.json ./applications/server/tsconfig.json 

# Docker doesn't support * currently, so...
COPY ./services/auth/package.json ./services/auth/package.json
COPY ./services/auth/tsconfig.json ./services/auth/tsconfig.json

COPY ./packages/config/package.json ./packages/config/package.json 
COPY ./packages/config/tsconfig.json ./packages/config/tsconfig.json 
COPY ./packages/config/tsup.config.ts ./packages/config/tsup.config.ts

COPY ./packages/secure/package.json ./packages/secure/package.json 
COPY ./packages/secure/tsconfig.json ./packages/secure/tsconfig.json 
COPY ./packages/secure/tsup.config.ts ./packages/secure/tsup.config.ts

COPY ./packages/contracts/package.json ./packages/contracts/package.json 
COPY ./packages/contracts/tsconfig.json ./packages/contracts/tsconfig.json 
COPY ./packages/contracts/tsup.config.ts ./packages/contracts/tsup.config.ts

COPY ./.npmrc .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

COPY ./applications/server/src ./applications/server/src/
COPY ./services/auth/src  ./services/auth/src

COPY ./packages/secure/src  ./packages/secure/src
COPY ./packages/contracts/src  ./packages/contracts/src
COPY ./packages/config/src  ./packages/config/src

RUN pnpm build

ENTRYPOINT [ "pnpm", "dev" ]
