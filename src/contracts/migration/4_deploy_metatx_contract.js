const MarbleMetaTXs = artifacts.require("./metatransaction/MarbleMetatransactions.sol");

const config = require('../config');

module.exports = async function(deployer) {
  const trustedForwarder = config.TRUSTED_FORWARDER; // matic mumbai
  const factoryAddress = "0xF1EEa613CC855e663ec860fBc5bAe55747421300";
  await deployer.deploy(MarbleMetaTXs, trustedForwarder, factoryAddress);
};
