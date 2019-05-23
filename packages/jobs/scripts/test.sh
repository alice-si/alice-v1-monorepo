#!/bin/bash

set -e

yarn ganache-cli -a 150 -i 3 -s 123 >/dev/null &
GANACHE_PID=$!
trap "kill $GANACHE_PID" EXIT

echo "Started Ganache, PID: $GANACHE_PID"

source ./scripts/find-contracts.sh
yarn truffle test --contracts_directory=$CONTRACTS_DIR "$@"

echo "Tests ran"
