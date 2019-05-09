#! /bin/bash

EXIT_CODE=0

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

SCRIPTS_DIR=`dirname ${BASH_SOURCE[0]}`
bash $SCRIPTS_DIR/run-ganache.sh

# TRAP SETTING
function finish {
  GANACHE_EXECUTABLE="npx ganache-cli"
  echo " RECEIVED EXIT SIGNAL!!! Disabling ganache instance"
  pkill $GANACHE_EXECUTABLE
}
trap finish EXIT

mkdir -p tests_output

# args:
# $1 - testfile
# $2 - output_file_for_tests
# $3 - error message
function printFailure() {
    printf "${RED}FAIL!${NC}\n"
    echo $3
    echo "Please check output with \"cat $2\""
    echo "Or run this test with \"npm run test-normal $1\""
    EXIT_CODE=1
}

# SILENT TESTS RUNNING
function silentTest() {
    filename=`basename $1`
    # gulp deploy --useDefault &> tests_output/deploy.info &&
    output_for_test=tests_output/$filename.info
    echo "TESTING(silent): "$filename
    truffle test --contracts_directory=./node_modules/@alice-si/contracts/contracts $1 &> $output_for_test

    if grep -q "failing" "$output_for_test"; then
        printFailure $1 $output_for_test "Test was failed."
    elif grep -q "Could not connect to your Ethereum client" "$output_for_test"; then
        printFailure $1 $output_for_test "Could not connect to Ethereum client."
    elif grep -q "Error:" "$output_for_test"; then
        printFailure $1 $output_for_test "Test running error."
    elif grep -q "passing" $output_for_test; then
        printf "${GREEN}OK!${NC}\n"
    else
        printFailure $1 $output_for_test "No test passed."
    fi
}

# USUAL TEST RUNNING
function test() {
    filename=`basename $1`
    # gulp deploy --useDefault
    echo "TESTING: "$filename
    truffle test --contracts_directory=./node_modules/@alice-si/contracts/contracts $1
}

if [ $# -eq 1 ]
then
    for testFile in `find ./test/* -maxdepth 0 -type f`
    do
        if [ $1 == "silent-mode" ]
        then
            silentTest $testFile
        else
            test $testFile 
        fi
    done
else
    if [ $1 == "silent-mode" ]
    then
        silentTest $2
    else
        test $2
    fi 
fi

exit $EXIT_CODE
