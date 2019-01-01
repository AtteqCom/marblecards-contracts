const MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
const MarbleNFT = artifacts.require("./MarbleNFT.sol");

const logger = require('../utils/logger');
const assertRevert = require('../utils/assertRevert');

const [rick, morty, summer, beth, jerry] = require("../utils/actors.js");

const duration = 62; // seconds
const nonExistingToken = 999;
const cut = 300; // %3 0 - 10,000
const delayedCancelCut = 5000;

function delay(msec) {
  return new Promise((resolve, _) => {
    setTimeout(() => resolve(), msec);
  });
}

contract("MarbleAuctionTest", accounts => {
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

  it("checks auctionieer cuts", async () => {
    assert.equal(await auctionContract.auctioneerCut(), cut);
    assert.equal(await auctionContract.auctioneerDelayedCancelCut(), delayedCancelCut);
  });

  it("returns correct count of Auctions after creation", async () => {
    // ini NFTs
    await nftContract.mint(rick.token, rick.account, rick.account, rick.uri, rick.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(beth.token, beth.account, beth.account, beth.uri, beth.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(summer.token, summer.account, summer.account, summer.uri, summer.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(morty.token, morty.account, morty.account, morty.uri, morty.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(jerry.token, jerry.account, jerry.account, jerry.uri, jerry.tokenUri, Date.now(), {from: owner});

    await auctionContract.createAuction(rick.token, 2*rick.payment, rick.payment, duration*10, {from: rick.account});
    await auctionContract.createAuction(beth.token, 2*beth.payment, beth.payment, duration*10, {from: beth.account});
    await auctionContract.createAuction(summer.token, 2*summer.payment, summer.payment, duration*10, {from: summer.account});
    await auctionContract.createAuction(morty.token, 2*morty.payment, morty.payment, duration*10, {from: morty.account});
    await auctionContract.createAuction(jerry.token, 2*jerry.payment, jerry.payment, duration, {from: jerry.account});

    assert.equal(await auctionContract.totalAuctions(), 5);
  });

  it("throws trying to create auction with not owned NFT", async () => {
    await assertRevert(auctionContract.createAuction(beth.token, 2*rick.payment, rick.payment, duration, {from: rick.account}));
  });

  it("throws trying to create auction with not existing NFT", async () => {
    await assertRevert(auctionContract.createAuction(nonExistingToken, 2*rick.payment, rick.payment, duration, {from: rick.account}));
  });

  it("throws trying to create auction with minimal price higher than starting price", async () => {
    await assertRevert(auctionContract.createAuction(jerry.token, jerry.payment, 2*jerry.payment, duration, {from: jerry.account}));
  });

  it("throws trying to cancel not owned auction", async () => {
    await assertRevert(auctionContract.cancelAuction(beth.token, {from: rick.account}));
  });

  it("checks auction existence", async () => {
    assert(await auctionContract.isOnAuction(beth.token));
  });

  it("checks auction non-existence", async () => {
    let exist = await auctionContract.isOnAuction(nonExistingToken);
    assert(!exist);
  });

  it("cancel auction", async () => {
    await auctionContract.cancelAuction(rick.token, {from: rick.account});
    assert.equal(await nftContract.ownerOf(rick.token), rick.account);
  });

  it("throws after underprice bid", async () => {
    await assertRevert(auctionContract.bid(summer.token, {from: morty.account, value: summer.payment - 1}));
  });

  it("throws after bid on non-existing auction", async () => {
    await assertRevert(auctionContract.bid(nonExistingToken, {from: morty.account, value: morty.payment}));
  });

  it("bid on classic auction", async () => {
    let summersBalance = await web3.eth.getBalance(summer.account);
    let auctioneerBalance = await web3.eth.getBalance(auctionContract.address);

    await auctionContract.bid(summer.token, { from: morty.account, value: await auctionContract.getCurrentPrice(summer.token) });

    let events = await auctionContract.getPastEvents();

    assert(events.length > 0 , "there has to be at least one event!");
    assert.equal(events[0].event, "AuctionSuccessful");
    assert.equal(events[0].args.tokenId, summer.token);
    assert(auctioneerBalance < await web3.eth.getBalance(auctionContract.address), "auction contract has to gain cut :)");
    assert.equal(events[0].args.winner, morty.account);

    assert(summersBalance + summer.payment < await web3.eth.getBalance(summer.account), "seller has to gain his revenue!");
    assert.equal(await nftContract.ownerOf(summer.token), morty.account);
  });

  it("pause contract", async () => {
    await auctionContract.pause({from: owner});
    assert(await auctionContract.paused());
  });

  it("throws trying to cancel by seller", async () => {
    await assertRevert(auctionContract.cancelAuction(morty.token, {from: morty.account}));
  });

  it("cancel auction when paused by admin", async () => {
    await auctionContract.cancelAuctionWhenPaused(morty.token, {from: owner});
    assert.equal(await nftContract.ownerOf(morty.token), morty.account);
  });

  it("throws trying to bid when paused", async () => {
    await assertRevert(auctionContract.bid(beth.token, {from: jerry.account, value: await auctionContract.getCurrentPrice(beth.token)}));
  });

  it("throws trying to remove auction without permision", async () => {
    await assertRevert(auctionContract.removeAuction(beth.token, {from: jerry.account}));
  });

  it("removes auction", async () => {
    assert(await auctionContract.isOnAuction(beth.token));
    await auctionContract.removeAuction(beth.token, {from: owner});
    let isIndeed = await auctionContract.isOnAuction(beth.token);
    assert(!isIndeed);
  });

  it("unpause contract", async () => {
    await auctionContract.unpause({from: owner});
    assert(!(await auctionContract.paused()));
  });

  it("throws trying to remove auction when not paused", async () => {
    await assertRevert(auctionContract.removeAuction(jerry.token, {from: owner}));
  });

  it("check current price when duration is over", async () => {
    console.log("Waiting for end of duration....");

    delay(duration*1000);

    assert.equal(await auctionContract.getCurrentPrice(jerry.token), jerry.payment);

  });

  it("cancel auction when duration is over", async () => {
    console.log("Waiting for end of duration....");

    delay(duration*1000);

    await auctionContract.cancelAuction(jerry.token, {from: jerry.account});
    assert.equal(await nftContract.ownerOf(jerry.token), jerry.account);

  });

  it("throws trying to withdraw balance without permissions", async () => {

    delay(duration*1000);

    assert(await web3.eth.getBalance(auctionContract.address) > 0, "Auction contract should has money!");

    await assertRevert(auctionContract.withdrawBalance({from: jerry.account}));

  });

  it("withdraws auction contract balance", async () => {

    delay(duration*1000);

    assert(await web3.eth.getBalance(auctionContract.address) > 0, "Auction contract should has money!");

    let ownersBalance = await web3.eth.getBalance(owner);
    await auctionContract.withdrawBalance({from: owner});

    assert.notEqual(ownersBalance, await web3.eth.getBalance(owner));
    assert.equal(await web3.eth.getBalance(auctionContract.address),0);

  });

});
