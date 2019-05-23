#! /bin/bash

SCRIPTS_DIR=`dirname ${BASH_SOURCE[0]}`
WAIT_PORT_EXECUTABLE="yarn run wait-port"
PROTRACTOR_EXECUTABLE="yarn run protractor"
APP_PORT=8080
EXIT_CODE=0

function prepare {
    mkdir -p tests_output

    bash $SCRIPTS_DIR/prepare-webdriver.sh
    prepareWebApp
}

function runTests {
  if [ $# -eq 0 ]; then
    $PROTRACTOR_EXECUTABLE ./test/e2e/regression.js
  else
    $PROTRACTOR_EXECUTABLE $1
  fi
  EXIT_CODE=$?
}

function finish {
  echo "EXIT SIGNAL RECEIVED!"
  clean
  exit $EXIT_CODE
}

function clean {
  pkill node
  pkill gulp
}

function prepareWebApp {
  # checking app
  OUTPUT=$(nc -z localhost $APP_PORT; echo $?)
  [ $OUTPUT -eq "0" ] && APP_RUNNING=true
  if [ $APP_RUNNING ]; then
    echo "App is already running. Skipping..."
  else
    echo "Starting web app... (using gulp watch-local)"
    gulp watch-local &> tests_output/alice-web-app.info &
    $WAIT_PORT_EXECUTABLE $APP_PORT
  fi
}

# Main actions
prepare
runTests

# Exit signal handling
trap finish EXIT