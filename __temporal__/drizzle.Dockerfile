FROM node:23-alpine3.20

WORKDIR /app

COPY drizzle.package.json package.json

RUN npm install

ENTRYPOINT [ "npx", "drizzle-kit", "studio", "--port", "5000", "--host", "0.0.0.0" ]
