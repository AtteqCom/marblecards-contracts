var MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");
var MarbleNFT = artifacts.require("./MarbleNFT.sol");

const config = require('../config');

module.exports = async function(deployer) {
  var cut = config.AUCTIONEER_CUT; // %3 0 - 10,000
  var delayedCancelCut = config.AUCTIONEER_MINTING_CUT; // %70

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
