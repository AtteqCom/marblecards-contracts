var MarbleNFTCandidate = artifacts.require("./MarbleNFTCandidate.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");

module.exports = async function(deployer) {
  var candidateMinimalPrice = 10000000000000000; // 0.01 eth

  // Deploy candidate contract
  await deployer.deploy(MarbleNFTCandidate);

  var _marbleNFTCandidate = await MarbleNFTCandidate.deployed();


  await _marbleNFTCandidate.setMinimalPrice(candidateMinimalPrice);
  await _marbleNFTCandidate.addAdmin(MarbleNFTFactory.address);

  var _marbleNFTFactory = await MarbleNFTFactory.deployed();
  await _marbleNFTFactory.setCandidateContract(_marbleNFTCandidate.address);

};
