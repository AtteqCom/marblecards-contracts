const MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
const MarbleNFT = artifacts.require("./MarbleNFT.sol");

const assertRevert = require('../utils/assertRevert');
const [rick, morty, summer, beth, jerry] = require("../utils/actors.js");

const duration = 62; // seconds

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
    console.log("Minintg test NFTs..");
    await nftContract.mint(rick.token, rick.account, rick.account, rick.uri, rick.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(beth.token, beth.account, beth.account, beth.uri, beth.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(summer.token, summer.account, summer.account, summer.uri, summer.tokenUri, Date.now(), {from: owner});

    console.log("Creating test Auctions..");
    await auctionContract.createMintingAuction(rick.token, 2*rick.payment, rick.payment, duration, rick.account, {from: owner});
    await auctionContract.createMintingAuction(beth.token, 2*beth.payment, beth.payment, duration, beth.account, {from: owner});
    await auctionContract.createMintingAuction(summer.token, 2*summer.payment, summer.payment, duration, summer.account, {from: owner});

    assert.equal(await auctionContract.totalAuctions(), 3);
  });

  it("throws trying to place underpiced bid, but higher then endingPrice", async () => {
    await assertRevert(auctionContract.bid(beth.token, { from: jerry.account, value: beth.payment + 1 }));
  });

  it("throws trying to place underpiced bid, but lower then endingPrice", async () => {
    await assertRevert(auctionContract.bid(summer.token, { from: jerry.account, value: summer.payment - 10 }));
  });

  it("throws trying to cancel auction by seller", async () => {
    await assertRevert(auctionContract.cancelAuction(rick.token, { from: rick.account }));
  });

  it("throws trying to cancel auction by owner", async () => {
    await assertRevert(auctionContract.cancelAuction(rick.token, { from: owner }));
  });

  it("throws trying to cancel auction by Jerry", async () => {
    await assertRevert(auctionContract.cancelAuction(rick.token, { from: jerry.account }));
  });

  it("bid and win Minting auction", async () => {
    let auctioneerBalance = await web3.eth.getBalance(auctionContract.address);
    let summersBalance = await web3.eth.getBalance(summer.account);

    await auctionContract.bid(summer.token, { from: jerry.account, value: await auctionContract.getCurrentPrice(summer.token) });
    let events = await auctionContract.getPastEvents();

    assert(events.length > 0 , "there has to be at least one event!");
    assert.equal(events[0].event, "AuctionSuccessful");
    assert.equal(events[0].args.tokenId, summer.token);

    assert(auctioneerBalance < await web3.eth.getBalance(auctionContract.address), "auction contract has to gain cut :)");
    assert.equal(events[0].args.winner, jerry.account);

    assert(summersBalance + summer.payment < await web3.eth.getBalance(summer.account), "seller has to gain his Minting revenue!");
    assert.equal(await nftContract.ownerOf(summer.token), jerry.account);
  });

  it("throws trying to bid on Minting auction after duration", async () => {
    setTimeout(async () => {
      await assertRevert(auctionContract.bid(beth.token, { from: jerry.account, value: await auctionContract.getCurrentPrice(beth.token)}));
    }, duration*1000);
  });

  it("throws trying to steal NFT of other owner", async () => {
    console.log("Waiting for end of duration....")
    setTimeout(async () => {
      await assertRevert(auctionContract.cancelAuction(rick.token, { from: jerry.account }));
    }, duration*1000);
  });

  it("returns NFT to creator after end of duration", async () => {
    console.log("Waiting for end of duration....")
    setTimeout(async () => {
      await auctionContract.cancelAuction(rick.token, { from: rick.account });
      assert.equal(await nftContract.ownerOf(rick.token), rick.account);
    }, duration*1000);
  });
});
