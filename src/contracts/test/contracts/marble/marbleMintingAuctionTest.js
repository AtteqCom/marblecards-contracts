const MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
const MarbleNFT = artifacts.require("./MarbleNFT.sol");

const assertRevert = require('../utils/assertRevert');
const logger = require('../utils/logger');

const [rick, morty, summer, beth, jerry] = require("../utils/actors.js");

const duration = 62; // seconds

async function delay(msec) {
  logger.log(`Delay test execution by ${msec}msec`);

  return new Promise((resolve, _) => {
    setTimeout(() => resolve(), msec);
  });
}

contract("MarbleMintingAuctionTest", accounts => {
  let nftContract;
  let auctionContract;
  const owner = accounts[0];
  summer.account = accounts[1];
  beth.account = accounts[2];
  jerry.account = accounts[3];
  rick.account = accounts[4];
  morty.account = accounts[5];

  beforeEach(async () => {
   nftContract = await MarbleNFT.deployed();
   auctionContract = await MarbleDutchAuction.deployed();
  });

  it("returns correct count of Minting Auctions after creation", async () => {
    // ini NFTs
    logger.log("Minintg test NFTs..");
    await nftContract.mint(summer.token, summer.account, summer.account, summer.uri, summer.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(beth.token, beth.account, beth.account, beth.uri, beth.tokenUri, Date.now(), {from: owner});

    logger.log("Creating test Auctions..");
    // summers auction will be on auction for llonger time
    await auctionContract.createMintingAuction(summer.token, "" + 2*summer.payment, "" + summer.payment, duration*10, summer.account, {from: owner});
    // beth will have auction with short duration
    await auctionContract.createMintingAuction(beth.token, "" + 2*beth.payment, "" + beth.payment, duration, beth.account, {from: owner});

    assert.equal(await auctionContract.totalAuctions(), 2);
  });

  it("throws trying to place underpiced bid, but higher then endingPrice", async () => {
    await assertRevert(auctionContract.bid(beth.token, { from: jerry.account, value: beth.payment + 1 }));
  });

  it("throws trying to place underpiced bid, but lower then endingPrice", async () => {
    var auction = await auctionContract.getAuction(summer.token);
    logger.log(auction);

    var currentPrice = await auctionContract.getCurrentPrice(summer.token) + "";
    logger.log(`Auction started at ${auction.startedAt} and will last "${auction.duration}"seconds and current price is ${currentPrice}`);
    var payment = summer.payment - 10;
    logger.log(`Will be bought by ${jerry.account} at "${Date.now()}" for ${payment}`);

    await assertRevert(auctionContract.bid(summer.token, { from: jerry.account, value: payment }));
    assert(await auctionContract.isOnAuction(summer.token), "Token should be still on auction");
  });

  it("throws trying to cancel auction by seller", async () => {
    await assertRevert(auctionContract.cancelAuction(summer.token, { from: summer.account }));
  });

  it("throws trying to cancel auction by contract owner", async () => {
    await assertRevert(auctionContract.cancelAuction(summer.token, { from: owner }));
  });

  it("throws trying to cancel auction by Jerry", async () => {
    await assertRevert(auctionContract.cancelAuction(summer.token, { from: jerry.account }));
  });

  it("bid and win Minting auction", async () => {
    logger.log("Bids to Summers auction!");
    let auctioneerBalance = await web3.eth.getBalance(auctionContract.address);
    let summersBalance = await web3.eth.getBalance(summer.account);

    logger.log(`Summer balance ${summersBalance}`);

    assert(await auctionContract.isOnAuction(summer.token), "Token should be still on auction");

    var auction = await auctionContract.getAuction(summer.token);
    var auctionEnds = auction.startedAt.add(auction.duration) * 1000;
    logger.log(auction);

    logger.log(`Auction started at ${auction.startedAt} and will last "${auction.duration}"seconds - ends: (${auctionEnds})`);
    logger.log(`Will be bought by ${jerry.account} at "${Date.now()}" and before ${auctionEnds}`);

    assert(Date.now() < auctionEnds, "Bid has to come before the end of auction!");

    let currentPrice = await auctionContract.getCurrentPrice(summer.token);
    logger.log(`Current price ${currentPrice}`);
    await auctionContract.bid(summer.token, { from: jerry.account, value: currentPrice });
    let events = await auctionContract.getPastEvents();

    assert(events.length > 0 , "there has to be at least one event!");
    assert.equal(events[0].event, "AuctionSuccessful");
    assert.equal(events[0].args.tokenId, summer.token);

    assert(auctioneerBalance < await web3.eth.getBalance(auctionContract.address), "auction contract has to gain cut :)");
    assert.equal(events[0].args.winner, jerry.account);

    let summersBalanceNow = (await web3.eth.getBalance(summer.account));

    logger.log(`Summer balance now ${summersBalanceNow}`);
    assert(summersBalance < summersBalanceNow, "seller has to gain his Minting revenue!");
    assert.equal(await nftContract.ownerOf(summer.token), jerry.account);
  });

  it("throws trying to bid on Minting auction after duration", async () => {
    logger.log("Bid after duration - " + (new Date()).getMinutes());
    await delay(duration*1000);

    await assertRevert(auctionContract.bid(beth.token, { from: jerry.account, value: await auctionContract.getCurrentPrice(beth.token)}));

    logger.log("Start - " + (new Date()).getMinutes());

  });

  it("throws trying to steal NFT of other owner", async () => {
    // delay in prev test should be enough, await delay(duration*1000);
    await assertRevert(auctionContract.cancelAuction(beth.token, { from: jerry.account }));
  });

  it("returns NFT to creator after end of duration", async () => {
    // delay in prev test should be enough, await delay(duration*1000);
    await auctionContract.cancelAuction(beth.token, { from: beth.account });
    assert.equal(await nftContract.ownerOf(beth.token), beth.account, "Owner of NFT should be again seller!");
    assert(!(await auctionContract.isOnAuction(beth.token)), "NFT should be NOT on auction!");
  });
});
