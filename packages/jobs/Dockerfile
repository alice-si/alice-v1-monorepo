ARG VERSION
FROM alice-monorepo:${VERSION}

# Move to jobs package.
WORKDIR /usr/src/app/packages/jobs

# Build contracts.
RUN yarn compile
