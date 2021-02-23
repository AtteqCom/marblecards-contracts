var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");

module.exports = function(deployer) {
  // Deploy factory contract and set sub contracts references
  deployer.deploy(MarbleNFTFactory, 0);
};
