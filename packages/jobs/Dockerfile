FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . ./

# Install dependencies.
RUN npm install --only=prod

# Build contracts.
RUN npm compile
