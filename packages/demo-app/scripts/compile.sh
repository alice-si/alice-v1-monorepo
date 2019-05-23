CONTRACTS_DIR=$(node -e "console.log(path.dirname(require.resolve('@alice-si/contracts/package.json')));")/contracts
yarn truffle compile --contracts_directory=$CONTRACTS_DIR
