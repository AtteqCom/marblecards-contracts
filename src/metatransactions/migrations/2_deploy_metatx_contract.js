const MarbleMetaTXs = artifacts.require("./MarbleMetatransactions.sol");

const config = require('../config');

module.exports = async function(deployer) {
  const trustedForwarder = "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b"; // matic mumbai
  const factoryAddress = "0x1398c7dcA7e0Cd6696d4f11f091d933493A25bEf";
  
  await deployer.deploy(MarbleMetaTXs, trustedForwarder, factoryAddress);
};
