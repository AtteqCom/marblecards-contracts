const MarbleCoin = artifacts.require("./matic/MarbleCoin.sol");
const MarbleCoinMatic = artifacts.require("./matic/MarbleCoinMatic.sol");

module.exports = async function(deployer) {

  const childChainManagerProxy = "0x0000000000000000000000000000000000000000";

  await deployer.deploy(MarbleCoin);
  await deployer.deploy(MarbleCoinMatic, childChainManagerProxy);

  const mbcMatic = await MarbleCoin.deployed();
};
