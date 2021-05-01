const MarbleCandidate = artifacts.require("./MarbleNFTCandidate.sol");

module.exports = async function(deployer) {
  await deployer.deploy(MarbleCandidate);
};
