var MarbleNFTCandidate = artifacts.require("./MarbleNFTCandidate.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");

module.exports = function(deployer) {
  var candidateMinimalPrice = 20000000000; // 20 gwei

  // Deploy candidate contract
  deployer.deploy(MarbleNFTCandidate)
  .then(() => MarbleNFTCandidate.deployed())
  .then(_marbleNFTCandidate => {
    return _marbleNFTCandidate.setMinimalPrice(candidateMinimalPrice)
    .then(()=>{
      _marbleNFTCandidate.addAdmin(MarbleNFTFactory.address)
      .then(()=>{
        return MarbleNFTFactory.deployed()
        .then(_marbleNFTFactory => {
          return _marbleNFTFactory.setCandidateContract(_marbleNFTCandidate.address);
        });
      });
    });
  });
};
