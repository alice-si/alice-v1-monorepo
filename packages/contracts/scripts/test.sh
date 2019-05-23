#!/bin/bash

set -e

yarn ganache-cli -a 100 -i 3  >/dev/null &
GANACHE_PID=$!
trap "kill $GANACHE_PID" EXIT

echo "Started Ganache, PID: $GANACHE_PID"

yarn truffle test "$@"

echo "Tests ran"
