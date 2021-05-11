const MarbleCandidate = artifacts.require("./MarbleNFTCandidate.sol");

module.exports = function(deployer) {
  deployer.deploy(MarbleCandidate);
};
