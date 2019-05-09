#!/bin/bash

set -e

npx ganache-cli -a 150 -i 3 -s 123 >/dev/null &
GANACHE_PID=$!
trap "kill $GANACHE_PID" EXIT

echo "Started Ganache, PID: $GANACHE_PID"

npx truffle test \
  --contracts_directory=./node_modules/@alice-si/contracts/contracts "$@"

echo "Tests ran"
