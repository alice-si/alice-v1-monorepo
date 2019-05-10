# This is a root Dockerfile that builds the whole monorepo.
# App-specific Dockerfiles should start with "FROM" with this image.

FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . ./

# Install dependencies.
RUN npm install
RUN npx lerna bootstrap

ENV NODE_ENV=production
