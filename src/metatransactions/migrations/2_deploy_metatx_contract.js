const MarbleMetaTXs = artifacts.require("./MarbleMetatransactions.sol");

const config = require('../config');

module.exports = async function(deployer) {
  const trustedForwarder = "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b"; // matic mumbai
  const factoryAddress = "0x6BD0b0dfF2CF41C67E26e5B5411A3808f6F62e27";
  await deployer.deploy(MarbleMetaTXs, trustedForwarder, factoryAddress);
};
