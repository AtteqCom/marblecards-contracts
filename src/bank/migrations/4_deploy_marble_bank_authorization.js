const MarbleBankAuthorization = artifacts.require("./MarbleBankWithdrawAuthorization.sol");

module.exports = function(deployer) {
  deployer.deploy(MarbleBankAuthorization);
};
