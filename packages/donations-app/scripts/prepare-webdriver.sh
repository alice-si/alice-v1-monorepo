#! /bin/bash
WEBDRIVER_EXECUTABLE="yarn run webdriver-manager"
WEBDRIVER_MANAGER_PORT=4444
WAIT_PORT_EXECUTABLE="yarn run wait-port"

echo "Checking webdriver"
OUTPUT=$(nc -z localhost $WEBDRIVER_MANAGER_PORT; echo $?)
[ $OUTPUT -eq "0" ] && WEBDRIVER_RUNNING=true
if [ ! $WEBDRIVER_RUNNING ]; then
    echo "Webdriver updating..."
    $WEBDRIVER_EXECUTABLE update &> tests_output/webdriver_update.info &
    echo "Webdriver updating finished."
    echo "Webdriver starting..."
    $WEBDRIVER_EXECUTABLE start &> tests_output/webdriver_start.info &
    echo "Webdriver started."
    $WAIT_PORT_EXECUTABLE $WEBDRIVER_MANAGER_PORT
else
    echo "Webdriver is already running. Skipping..."
fi