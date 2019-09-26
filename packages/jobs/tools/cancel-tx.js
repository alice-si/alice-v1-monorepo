/*
 * Manually cancels tx sent from main account with given nonce.
 *
 * Usage: node tools/cancel-tx.js [NONCE_HEX] [PRIVATE_KEY]
 * Example usage: node tools/cancel-tx.js 3 0x.....
 * 
 */

const argv = require('yargs').argv;
const ContractUtils = require('../utils/contract-utils');

async function main() {
  let [nonce, privateKey] = argv._;
  console.log('Cancelling tx with the nonce: ' + nonce);
  let wallet = ContractUtils.getWalletFromPrivateKey(privateKey);
  let tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0,
    gasPrice: 20000000000, // 20 gwei
    nonce: '0x' + nonce.toString(16)
  });
  console.log(tx);
}

main().then(() => {
  console.log('Finished successfully');
  process.exit();
}).catch(err => {
  console.error(`Error occured: ${err}`);
  process.exit();
});