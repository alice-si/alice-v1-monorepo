module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
    },
    gas: 20000
  },
  compilers: {
    solc: {
      version: "0.5.2"  // ex:  "0.4.20". (Default: Truffle's installed solc)
    }
  }
};
