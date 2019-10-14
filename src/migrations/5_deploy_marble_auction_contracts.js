var MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");
var MarbleNFT = artifacts.require("./MarbleNFT.sol");

const config = require('../config');

module.exports = function(deployer) {
  var cut = config.AUCTIONEER_CUT; // %3 0 - 10,000
  var delayedCancelCut = config.AUCTIONEER_MINTING_CUT; // %70

  deployer.deploy(MarbleDutchAuction)
    .then(() => MarbleDutchAuction.deployed())
    .then(_marbleAuction => {
      return _marbleAuction.setAuctioneerCut(cut)
      .then(()=>{
        return _marbleAuction.setAuctioneerDelayedCancelCut(delayedCancelCut)
        .then(()=>{
          return MarbleNFTFactory.deployed()
          .then(_factory => {
            return _marbleAuction.addAdmin(_factory.address)
            .then(()=>{
              return _factory.setMarbleDutchAuctionContract(_marbleAuction.address)
              .then(()=>{
                return MarbleNFT.deployed()
                .then(_marbleNFT => {
                  return _marbleNFT.addAdmin(_marbleAuction.address)
                  .then(()=>{
                     return _marbleAuction.setNFTContract(_marbleNFT.address);
                  });
                });
              });
            });
          });
        });
      });
    });
};
