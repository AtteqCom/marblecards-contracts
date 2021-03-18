const MemeBondingCurveToken = artifacts.require("./MemeBondingCurveToken.sol");

const config = require('../config');

module.exports = async function(deployer) {
  // const factoryContractAddress = config.MARBLE_FACTORY_CONTRACT_ADDRESS;
  const marbleCoinContractAddress = "0x795c253D18fAE582f8642267A44D3b79C62E815A";

  await deployer.deploy(MemeBondingCurveToken, marbleCoinContractAddress, "doge meme", "dgMM");
};
