const MarbleMetatransactions = artifacts.require("./MarbleMetatransactions.sol");

module.exports = function(deployer) {
  deployer.deploy(MarbleMetatransactions, "0xa9f618C5D67Ae221EfF918538a0F811E4fFdDB69");
  // deployer.deploy(MarbleMetatransactions);
};
