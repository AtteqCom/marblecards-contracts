const MarbleMetaTXs = artifacts.require("./MarbleMetatransactions.sol");

const config = require('../config');

module.exports = async function(deployer) {
  const trustedForwarder = "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b"; // matic mumbai
  const factoryAddress = "0xc7Bf475a8bE8c70746DC5A241B7dD3C92A1a42E1";
  
  await deployer.deploy(MarbleMetaTXs, trustedForwarder, factoryAddress);
};
