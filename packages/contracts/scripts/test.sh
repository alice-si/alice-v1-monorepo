#!/bin/bash

npx ganache-cli -a 100 -i 3  >/dev/null &
GANACHE_PID=$!
echo "Started Ganache, PID: $GANACHE_PID"

npx truffle test "$@"

echo "Tests ran"
kill $GANACHE_PID
