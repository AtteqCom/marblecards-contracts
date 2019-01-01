// npx truffle test --network infuraRopstenTest ./test/contracts/tempTest.js

const MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
const MarbleNFT = artifacts.require("./MarbleNFT.sol");

const logger = require('../utils/logger');

const assertRevert = require('../utils/assertRevert');
const [rick, morty, summer, beth, jerry] = require("../utils/actors.js");

const duration = 62; // seconds

async function delay(msec) {
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
/*
  it("returns correct count of Minting Auctions after creation", async () => {
    // ini NFTs
    console.log("Minintg test NFTs..");
    await nftContract.mint(rick.token, rick.account, rick.account, rick.uri, rick.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(summer.token, summer.account, summer.account, summer.uri, summer.tokenUri, Date.now(), {from: owner});

    console.log("Creating test Auctions..");
    await auctionContract.createMintingAuction(rick.token, 2*rick.payment, rick.payment, duration, rick.account, {from: owner});
    await auctionContract.createMintingAuction(summer.token, 2*summer.payment, summer.payment, duration, summer.account, {from: owner});

    assert.equal(await auctionContract.totalAuctions(), 2);
  });

  it("bid and win Minting auction", async () => {

    console.log("Bids to Summers auction!");
    let auctioneerBalance = await web3.eth.getBalance(auctionContract.address);
    let summersBalance = await web3.eth.getBalance(summer.account);

    var auction = await auctionContract.getAuction(summer.token);
    var auctionEnds = auction.startedAt.add(auction.duration) * 1000;
    console.log(auction);

    console.log(`Auction started at ${auction.startedAt} and will last "${auction.duration}"seconds - ends: (${auctionEnds})`);
    console.log(`Will be bought by ${jerry.account} at "${Date.now()}" and before ${auctionEnds}`);

    assert(Date.now() < auctionEnds, "Bid has to come before the end of auction!");

    await auctionContract.bid(summer.token, { from: jerry.account, value: await auctionContract.getCurrentPrice(summer.token) });
    let events = await auctionContract.getPastEvents();

    assert(events.length > 0 , "there has to be at least one event!");
    assert.equal(events[0].event, "AuctionSuccessful");
    assert.equal(events[0].args.tokenId, summer.token);

    assert(auctioneerBalance < await web3.eth.getBalance(auctionContract.address), "auction contract has to gain cut :)");
    assert.equal(events[0].args.winner, jerry.account);

    let summersBalanceNow = (await web3.eth.getBalance(summer.account));

    assert(summersBalance < summersBalanceNow, "seller has to gain his Minting revenue!");
    assert.equal(await nftContract.ownerOf(summer.token), jerry.account);
  });

  it("returns NFT to creator after end of duration", async () => {
    console.log("Waiting for end of duration....");

    await delay(duration*1000);

    await auctionContract.cancelAuction(rick.token, { from: rick.account });
    assert.equal(await nftContract.ownerOf(rick.token), rick.account);

  });*/
});
