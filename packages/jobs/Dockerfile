ARG VERSION
FROM alice-monorepo:${VERSION}

# Move to jobs package.
WORKDIR /usr/src/app/packages/demo-app

# Build contracts.
RUN npm run compile
