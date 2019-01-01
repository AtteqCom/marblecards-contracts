var MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");
var MarbleNFT = artifacts.require("./MarbleNFT.sol");

module.exports = function(deployer) {
  var cut = 300; // %3 0 - 10,000
  var delayedCancelCut = 5000;

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
