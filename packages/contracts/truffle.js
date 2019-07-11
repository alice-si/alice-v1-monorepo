module.exports = {
	networks: {
		development: {
			host: 'localhost',
			port: 8545,
			network_id: '3' // Match any network id
		}
	},
	compilers: {
    solc: {
      version: '^0.4.24'
    }
  }
};
