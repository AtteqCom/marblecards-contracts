const RmbcSeller = artifacts.require('./RmbcSeller.sol');

module.exports = function(deployer) {
  deployer.deploy(RmbcSeller);
};
