var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");

module.exports = async function(deployer) {
  // Deploy factory contract and set sub contracts references
  await deployer.deploy(MarbleNFTFactory, 0);
};
