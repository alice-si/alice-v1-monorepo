#!/bin/bash

set -e
set -x

function test() {
  CONTRACTS_DIR=$(node -e "console.log(path.dirname(require.resolve('@alice-si/contracts/package.json')));")/contracts
  npx truffle test --contracts_directory=$CONTRACTS_DIR $1
}

npx ganache-cli --networkId=3 --seed=123 --accounts=100 >/dev/null &
GANACHE_PID=$!
trap "kill $GANACHE_PID" EXIT
npx wait-port 8545

echo "Started Ganache, PID: $GANACHE_PID"

# if [ $# -eq 0 ]
# then
#   for testFile in `find ./test/* -maxdepth 0 -type f`
#   do
#     test $testFile
#   done
# else
#   test $1
# fi

test $1
echo "Tests ran"

