const MarbleMetatransactions = artifacts.require("./MarbleMetatransactions.sol");

module.exports = function(deployer) {
  deployer.deploy(MarbleMetatransactions, "0xc7Bf475a8bE8c70746DC5A241B7dD3C92A1a42E1", 3);
  
  // TODO: addAdmin to NFT contract
};
