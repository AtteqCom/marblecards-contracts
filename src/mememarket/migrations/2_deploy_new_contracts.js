const MemeToken = artifacts.require("./MemeToken.sol");

const config = require('../config');

module.exports = async function(deployer) {
  // const factoryContractAddress = config.MARBLE_FACTORY_CONTRACT_ADDRESS;
  const marbleCoinContractAddress = "0x429509F31DE450104e96519e44ad1e7E2fa622B6";

  await deployer.deploy(MemeToken, marbleCoinContractAddress, "doge meme", "dgMM");
};
