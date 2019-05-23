#!/bin/bash

set -e
set -x

npx ganache-cli -a 150 -i 3 -s 123 >/dev/null &
GANACHE_PID=$!
trap "kill $GANACHE_PID && echo KilledOK && ps --forest -o pid=,tty=,stat=,time=,cmd= && ps ax" EXIT

echo "Started Ganache, PID: $GANACHE_PID"

CONTRACTS_DIR=$(node -e "console.log(path.dirname(require.resolve('@alice-si/contracts/package.json')));")/contracts
npx truffle test --contracts_directory=$CONTRACTS_DIR "$@"

echo "Tests ran"
