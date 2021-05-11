const MarbleMetaTXs = artifacts.require("./MarbleMetatransactions.sol");

const config = require('../config');

module.exports = async function(deployer) {
  const trustedForwarder = "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8"; // matic mumbai
  const factoryAddress = "0xF1EEa613CC855e663ec860fBc5bAe55747421300";
  await deployer.deploy(MarbleMetaTXs, trustedForwarder, factoryAddress);
};
