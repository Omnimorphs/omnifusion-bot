const {ethers} = require('ethers');

const abi = ['event Fused(address sender, uint fusedId, uint burnedId, bytes32 fusionReceiptIPFSHash)'];

const address = '0x6c5c4090642F1Be0182B14A1BCc9b1BECfE44dE1';

const provider = ethers.getDefaultProvider('rinkeby');

const contract = new ethers.Contract(address, abi, provider);

contract.on('Fused', (sender, fusedId, burnedId, fusionReceiptIPFSHash) => {
  console.log(sender);
  console.log(fusedId);
  console.log(burnedId);
  console.log(fusionReceiptIPFSHash);
});

