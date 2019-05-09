GANACHE_EXECUTABLE="npx ganache-cli"

# PREPARING BLOCKCHAIN
output=$(nc -z localhost 8545; echo $?)
[ $output -eq "0" ] && trpc_running=true
if [ ! $trpc_running ]; then
  echo "Starting our own ganache node instance"
  # create 100 accounts for load tests
  $GANACHE_EXECUTABLE -a 150 -i 3 -s 123 > /dev/null &
  sleep 2 # we need to wait for some time when ganache will be ready
fi
