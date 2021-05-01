const RmbcSeller = artifacts.require('./RmbcSeller.sol');

module.exports = async function(deployer) {
  await deployer.deploy(RmbcSeller);
};
