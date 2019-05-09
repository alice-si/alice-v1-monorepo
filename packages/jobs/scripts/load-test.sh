#! /bin/bash

scripts_dir=`dirname ${BASH_SOURCE[0]}`
bash $scripts_dir/run-ganache.sh
# TRAP SETTING
function finish {
  GANACHE_EXECUTABLE="./node_modules/.bin/ganache-cli"
  echo " RECEIVED EXIT SIGNAL!!! Disabling ganache instance"
  pkill $GANACHE_EXECUTABLE
}
trap finish EXIT

# gulp deploy --useDefault && # currently we deploy contracts in JS code
node ./tools/load-test.js