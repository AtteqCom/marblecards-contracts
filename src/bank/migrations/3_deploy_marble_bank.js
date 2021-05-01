const MarbleBank = artifacts.require("./MarbleBank.sol");

module.exports = async function(deployer) {
  await deployer.deploy(MarbleBank);
};
