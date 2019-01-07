// https://github.com/axieinfinity/truffle-deploy/
const web3 = require("web3")
const assert = require('assert');

async function getCall(method) {
  return method.call();
}

const startCopyFrom = 2944;

module.exports = async ({ accounts, artifacts, deployer, logger, network, web3 }) => {

  var MarbleNFT = artifacts.require("./MarbleNFT.sol");
  var oldNFTAbi = require("../externalABI/betaMarbleNFT.abi.1.0.js");
  var oldFactoryAbi = require("../externalABI/betaFactory.abi.1.0.js");
  var oldAuctionAbi = require("../externalABI/betaAuction.abi.1.0.js");

  //oringnal contract address
  var originalContract = "0xbafa39ad3c608a426b08571b01caeb93a3d91f44";
  // current contract
  var nftContract = await MarbleNFT.deployed();

  //Address of the contract, obtained from Etherscan
  var oldFactory = new web3.eth.Contract(oldFactoryAbi, originalContract);
  logger.info(`Factory contract loaded...`);

  var nftAddress = await oldFactory.methods.marbleNFTContract().call();
  var oldNFT = new web3.eth.Contract(oldNFTAbi, nftAddress);
  logger.info(`NFT contract "${nftAddress}" loaded...`);

  var auctionAddress = await oldFactory.methods.marbleClockAuctionContract().call();
  var oldAuction = new web3.eth.Contract(oldAuctionAbi, auctionAddress);
  logger.info(`Auction contract "${auctionAddress}" loaded...`);

  var totalNFT = await oldNFT.methods.totalSupply().call();
  logger.info(totalNFT);
  logger.info(`Total NFTs counted ${totalNFT}...`);

  for (index = startCopyFrom; index < totalNFT; index++) {
    var nft = {id: null, metadataUri: null, owner: null};

    nft.id = await oldNFT.methods.tokenByIndex(index).call();

    logger.info(`NFT: "${nft.id}/${totalNFT}" ...`);
    // DEPRECATED  [nft.uri, nft.creator, nft.created] = await oldNFT.methods.tokenSource(nft.id).call();
    let nftSource = await oldNFT.methods.tokenSource(nft.id).call();
    logger.info(`Source:`);
    logger.info(nftSource);

    // set up owner
    nft.owner = await oldNFT.methods.ownerOf(nft.id).call();
    nft.metadataUri = await oldNFT.methods.tokenURI(nft.id).call();

    // check auction
    if (await oldAuction.methods.isOnAuction(nft.id).call()) {
      // DEPRECATED [nft.owner, , , , , , ] = await oldAuction.methods.getAuction(nft.id).call();
      let nftAuction = await oldAuction.methods.getAuction(nft.id).call();
      logger.info(`Auction:`);
      logger.info(nftAuction);
      nft.owner = nftAuction.seller;
    }

    logger.info(`NFT to Mint:`);
    logger.info(nft);
    // create new nft over new contract
    await nftContract.mint(nft.id, nft.owner, nftSource._creator, nftSource._uri, nft.metadataUri, nftSource._created);
    logger.info(`NFT: "${nft.id}" minted on new contract.`);
  }

};
