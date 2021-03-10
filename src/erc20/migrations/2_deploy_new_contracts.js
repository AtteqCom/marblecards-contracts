const MarbleCoin = artifacts.require("./MarbleCoinMatic.sol");

module.exports = async function(deployer) {

  const childChainManagerProxy = "0x0000000000000000000000000000000000000000";

  await deployer.deploy(MarbleCoin, childChainManagerProxy);

  const mbcMatic = await MarbleCoin.deployed();
};
