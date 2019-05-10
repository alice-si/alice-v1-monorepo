FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . ./

# Install dependencies.
RUN npm install
RUN npx lerna bootstrap

# Move to jobs package.
WORKDIR /usr/src/app/packages/demo-app

ENV NODE_ENV=production

# Build contracts.
RUN npm run compile
