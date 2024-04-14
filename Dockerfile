# Base Stage
FROM node:19.2.0-alpine3.15 AS base

WORKDIR /home/node/app

ENV NODE_ENV="development"
ENV CI=true

RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories

RUN apk add -u --no-cache \
	dumb-init \
	fontconfig \
	jq \
	nodejs \
    doppler

COPY --chown=node:node .yarn/ .yarn/
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node package.json .
COPY --chown=node:node yarn.lock .
RUN yarn config set enableGlobalCache false

ENTRYPOINT [ "dumb-init", "--" ]

# Build Stage
FROM base AS builder

WORKDIR /home/node/app

ENV NODE_ENV="development"

RUN yarn install --immutable

COPY --chown=node:node src/ src/
COPY --chown=node:node tsconfig.json tsconfig.json

RUN yarn run build

# Runner Stage
FROM base AS runner

WORKDIR /home/node/app

ENV NODE_ENV="production"

RUN yarn workspaces focus --all --production

COPY --chown=node:node --from=builder /home/node/app/dist dist

RUN chown node:node /home/node/app

USER node
ENV CI=

CMD [ "doppler", "run", "--", "yarn", "start" ]
