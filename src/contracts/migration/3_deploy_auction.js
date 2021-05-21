const MarbleDutchAuction = artifacts.require("./auction/MarbleDutchAuction.sol");
const MarbleNFTFactory = artifacts.require("./marble/MarbleNFTFactory.sol");
const MarbleNFT = artifacts.require("./marble/MarbleNFT.sol");

const config = require('../../config');

module.exports = async function(deployer) {
  let cut = config.AUCTIONEER_CUT; // %3 0 - 10,000
  let delayedCancelCut = config.AUCTIONEER_MINTING_CUT; // %70

  await deployer.deploy(MarbleDutchAuction);

  let marbleDutchAuction = await MarbleDutchAuction.deployed();
  let marbleNFT = await MarbleNFT.deployed();
  let marbleNFTFactory = await MarbleNFTFactory.deployed();

  await marbleDutchAuction.setNFTContract(marbleNft.address);
  await marbleNFTFactory.setMarbleDutchAuctionContract(marbleDutchAuction.address);

  await marbleDutchAuction.setAuctioneerCut(cut);
  await marbleDutchAuction.setAuctioneerDelayedCancelCut(delayedCancelCut);
  
  await marbleNFT.addAdmin(marbleDutchAuction.address);
  await marbleDutchAuction.addAdmin(marbleNFTFactory.address);
};