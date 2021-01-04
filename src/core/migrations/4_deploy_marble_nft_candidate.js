var MarbleNFTCandidate = artifacts.require("./MarbleNFTCandidate.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");

const config = require('../config');

module.exports = function(deployer) {
  var candidateMinimalPrice = "10000000000000000"; // 0.01 eth

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
