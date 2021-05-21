const MarbleCoin = artifacts.require("./erc20/MarbleCoin.sol");
const MarbleCoinMatic = artifacts.require("./erc20/MarbleCoinMatic.sol");

module.exports = async function(deployer) {

  const childChainManagerProxy = "0x0000000000000000000000000000000000000000";

  await deployer.deploy(MarbleCoin);
  await deployer.deploy(MarbleCoinMatic, childChainManagerProxy);
};
