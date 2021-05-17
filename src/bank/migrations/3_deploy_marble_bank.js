const MarbleBank = artifacts.require("./MarbleBank.sol");

module.exports = function(deployer) {
  deployer.deploy(MarbleBank);
};
