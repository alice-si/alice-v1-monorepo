module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    }
  },
  mocha: {
    enableTimeouts: false 
  },
  compilers: {
    solc: {
      version: '^0.4.24'
    }
  }
};
