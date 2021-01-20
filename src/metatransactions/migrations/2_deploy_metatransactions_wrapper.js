const MarbleMetatransactions = artifacts.require("./MarbleMetatransactions.sol");

module.exports = function(deployer) {
  deployer.deploy(MarbleMetatransactions, "0xc7Bf475a8bE8c70746DC5A241B7dD3C92A1a42E1", "0xa9f618C5D67Ae221EfF918538a0F811E4fFdDB69", 3);
  // deployer.deploy(MarbleMetatransactions); 
};
