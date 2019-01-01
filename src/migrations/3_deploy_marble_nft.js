var MarbleNFT = artifacts.require("./MarbleNFT.sol");
var MarbleNFTLib = artifacts.require("./MarbleNFTLib.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");

module.exports = function(deployer) {
  var nftAddress;
  var candidateAddress;

  deployer.deploy(MarbleNFT)
  .then(() => MarbleNFT.deployed())
  .then(_marbleNFT => {
    MarbleNFTFactory.deployed()
    .then(_marbleNFTFactory => {
      // Deploy NFT contract
      return _marbleNFTFactory.setNFTContract(_marbleNFT.address)
      .then(()=>{
        return _marbleNFT.addAdmin(_marbleNFTFactory.address);
      });
    });
  });
};
