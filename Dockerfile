FROM node:16-alpine as development

ARG DB_TOKEN_KEY
RUN test -n "$DB_TOKEN_KEY"

RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
COPY decorate-angular-cli.js ./

RUN yarn install --frozen-lockfile --ignore-engines

COPY . /usr/src/app/

RUN yarn build --prod
RUN yarn gen-doc

FROM node:16-alpine as production

ARG DB_TOKEN_KEY
ARG NODE_ENV=production

ENV COUCHDB_TOKEN_KEY=${DB_TOKEN_KEY}
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
COPY decorate-angular-cli.js ./

ENV IGNORE_POSTINSTALL=1
RUN yarn install --production=true --frozen-lockfile --ignore-engines && yarn cache clean --all

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/apps/api/main.js"]
