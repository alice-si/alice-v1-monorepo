#! /bin/bash

SCRIPTS_DIR=`dirname ${BASH_SOURCE[0]}`
PROTRACTOR_EXECUTABLE="yarn run protractor"

bash $SCRIPTS_DIR/prepare-webdriver.sh

# TEST EXECUTING
if [ $# -eq 0 ]
  then
    $PROTRACTOR_EXECUTABLE ./test/e2e/regression-stage.js
else
    $PROTRACTOR_EXECUTABLE $1
fi
