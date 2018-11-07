var MarbleNFTCandidate = artifacts.require("./MarbleNFTCandidate.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");

module.exports = function(deployer) {
  var candidateMinimalPrice = 20000000000; // 20 gwei

  // Deploy candidate contract
  deployer.deploy(MarbleNFTCandidate)
  .then(() => MarbleNFTCandidate.deployed())
  .then(_marbleNFTCandidate => {
    _marbleNFTCandidate.setMinimalPrice(candidateMinimalPrice);
    _marbleNFTCandidate.addAdmin(MarbleNFTFactory.address);

    MarbleNFTFactory.deployed()
    .then(_marbleNFTFactory => {
      _marbleNFTFactory.setCandidateContract(_marbleNFTCandidate.address);
    });
  });
};
