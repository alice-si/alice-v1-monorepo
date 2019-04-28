FROM node:10

# Create directory for monorepo.
WORKDIR /usr/src/app

# Bundle monorepo sources
COPY . .

# Install dependencies
RUN npm install
RUN npx lerna bootstrap

# Move to demo-app package.
WORKDIR /usr/src/app/packages/demo-app

ENV NODE_ENV=production

# Compile contracts & build app.
RUN npm run compile
RUN npm run build

# Serve static files with nginx.
FROM nginx:1.15
COPY --from=0 /usr/src/app/packages/demo-app/build /usr/share/nginx/html
