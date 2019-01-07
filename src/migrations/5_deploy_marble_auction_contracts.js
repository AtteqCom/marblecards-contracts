var MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");
var MarbleNFT = artifacts.require("./MarbleNFT.sol");

module.exports = async function(deployer) {
  var cut = 300; // %3 0 - 10,000
  var delayedCancelCut = 5000;

  await deployer.deploy(MarbleDutchAuction);

  var _marbleAuction = await MarbleDutchAuction.deployed();
  await _marbleAuction.setAuctioneerCut(cut);
  await _marbleAuction.setAuctioneerDelayedCancelCut(delayedCancelCut);

  var _factory = await MarbleNFTFactory.deployed();
  await _marbleAuction.addAdmin(_factory.address);
  await _factory.setMarbleDutchAuctionContract(_marbleAuction.address);

  var _marbleNFT = await MarbleNFT.deployed();
  
  await _marbleNFT.addAdmin(_marbleAuction.address);
  await _marbleAuction.setNFTContract(_marbleNFT.address);

};
