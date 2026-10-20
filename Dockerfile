# syntax=docker/dockerfile:1
# Build: docker build --secret id=zen_npm_token,env=ZEN_DS_NPM_TOKEN -t uiux-warmup .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json .npmrc ./
# Token Zen DS được mount như secret, không nằm trong layer nào của image.
RUN --mount=type=secret,id=zen_npm_token \
    echo "//npm.dizai.studio/:_authToken=$(cat /run/secrets/zen_npm_token)" > /root/.npmrc \
    && npm install --no-audit --no-fund \
    && rm /root/.npmrc
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
EXPOSE 3000
CMD ["node", "server/index.js"]
