var MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");
var MarbleNFT = artifacts.require("./MarbleNFT.sol");

module.exports = function(deployer) {
  var cut = 300; // %3 0 - 10,000
  var delayedCancelCut = 5000;

  deployer.deploy(MarbleDutchAuction)
  .then(() => MarbleDutchAuction.deployed())
  .then(_marbleAuction => {
    _marbleAuction.setAuctioneerCut(cut);
    _marbleAuction.setAuctioneerDelayedCancelCut(delayedCancelCut);

    MarbleNFTFactory.deployed().then(_factory => {
      _marbleAuction.addAdmin(_factory.address);
      _factory.setMarbleDutchAuctionContract(_marbleAuction.address);

    });
    MarbleNFT.deployed().then(_marbleNFT => {
      _marbleNFT.addAdmin(_marbleAuction.address);
      _marbleAuction.setNFTContract(_marbleNFT.address);
    });
  });
};
