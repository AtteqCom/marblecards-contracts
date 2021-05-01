const MarbleBankAuthorization = artifacts.require("./MarbleBankWithdrawAuthorization.sol");

module.exports = async function(deployer) {
  await deployer.deploy(MarbleBankAuthorization);
};
