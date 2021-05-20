const MarbleAuction = artifacts.require("./MarbleDutchAuction.sol");

module.exports = async function(deployer) {
  await deployer.deploy(MarbleAuction);
};
