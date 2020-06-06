export const httpProviders = new Map<string, string>();
httpProviders.set('rinkeby', 'https://rinkeby.infura.io/v3/cbc0dce4b2174caabf7ed0c4865920ff');
httpProviders.set('mainnet', 'https://mainnet.infura.io/v3/cbc0dce4b2174caabf7ed0c4865920ff');

import Web3 = require('web3');
const web3 = new Web3();
web3.setProvider(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/cbc0dce4b2174caabf7ed0c4865920ff'));
const txid = '0x79e039975135bc21408253728db9c147baf9c5b623e0a008d4c40b2c15029a32';
web3.eth.getTransactionReceipt(txid).then(receipt => console.log(receipt));
