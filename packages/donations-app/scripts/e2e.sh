#!/bin/bash

# set -e
set -x

runWebdriver() {
  npx webdriver-manager update
  npx webdriver-manager start >/dev/null &
  WEBDRIVER_PID=$!
  npx wait-port 4444
}

runDonationsApp() {
  yarn dev >/dev/null &
  DONATIONS_APP_PID=$!
  npx wait-port 8080 # app port
  npx wait-port 35729 # livereload port
  npx wait-port 9229 # port for debugging
}

# Currently unused
killProcessThatUsesPort() {
  PID_TO_KILL=`lsof -i tcp:$1 | sed -n 2P | awk '{print $2}'`
  safeKill $PID_TO_KILL
}

safeKill() {
  if [ ! -z $1 ]; then
    kill -9 $1
  fi
}

trapHandler() {
  echo "Trying to kill donations-app $DONATIONS_APP_PID"
  safeKill $DONATIONS_APP_PID
  echo "Trying to kill webdriver $WEBDRIVER_PID"
  safeKill $WEBDRIVER_PID

  killProcessThatUsesPort 4444
  killProcessThatUsesPort 35729
  killProcessThatUsesPort 9229
 
  pkill node
  pkill -f gulp
  pkill -f webdriver-manager
}

runTests() {
  TEST_FILE=$1
  npx protractor $TEST_FILE
}


runWebdriver
if [ "$2" == "--run-donations-app" ]; then
  runDonationsApp
fi
trap trapHandler EXIT
runTests $1