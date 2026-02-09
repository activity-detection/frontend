ARG NODE_VERSION=24.7.0-alpine
FROM node:${NODE_VERSION} AS dev

WORKDIR /usr/src/app

# Cache deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Bind mount reszty
COPY . .

# Pełne polling env
ENV CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true \
    HOST=0.0.0.0 \
    NG_CLI_POLLING=true

EXPOSE 4200
CMD ["npm", "run", "start"]
