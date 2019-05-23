ARG VERSION
FROM alice-monorepo:${VERSION}

# Move to demo-app package.
WORKDIR /usr/src/app/packages/demo-app

# Compile contracts & build app.
RUN yarn compile
RUN yarn build

# Serve static files with nginx.
FROM nginx:1.15
COPY --from=0 /usr/src/app/packages/demo-app/build /usr/share/nginx/html
