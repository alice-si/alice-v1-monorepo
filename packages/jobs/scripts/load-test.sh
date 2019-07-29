#! /bin/bash
set -e
set -x

npx ganache-cli -a 100 -i 3 -s 123 >/dev/null &
GANACHE_PID=$!
trap "kill $GANACHE_PID" EXIT
npx wait-port 8545

# Load tests running
node ./tools/load-test.js