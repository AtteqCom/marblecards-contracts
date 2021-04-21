const MemeToken = artifacts.require("./MemeToken.sol");

const config = require('../config');

module.exports = async function(deployer) {
  // const factoryContractAddress = config.MARBLE_FACTORY_CONTRACT_ADDRESS;
  const marbleCoinContractAddress = "0x23acFDaf6f89B535147cdCb616c602fcc368CEB6";

  await deployer.deploy(MemeToken, marbleCoinContractAddress, "Doge-name", "Doge-symbol");
};
