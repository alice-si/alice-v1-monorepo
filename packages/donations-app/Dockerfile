FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY yarn.lock ./
COPY bower.json ./

# Install yarn
RUN npm install -g yarn

# Install global gulp
RUN yarn global add gulp

# Install other dependencies
RUN yarn install --prod

# Bundle app source
COPY . .