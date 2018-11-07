const MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");
const MarbleNFTCandidate = artifacts.require("./MarbleNFTCandidate.sol");
const MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
const MarbleNFT = artifacts.require("./MarbleNFT.sol");

const assertRevert = require('../utils/assertRevert');
const [rick, morty, summer, beth, jerry] = require("../utils/actors.js");

const duration = 62; // seconds
const nonExistingURI = "hi.i.am.non-existing.uri";

contract("MarbleNFTFactoryTest", accounts => {
  let nftContract;
  let auctionContract;
  let factoryContract;
  let candidateContract;

  const owner = accounts[0];

  summer.account = accounts[1];
  beth.account = accounts[2];
  jerry.account = accounts[3];
  rick.account = accounts[4];
  morty.account = accounts[5];

  before(async () => {
    candidateContract = await MarbleNFTCandidate.deployed();
    factoryContract = await MarbleNFTFactory.deployed();
    nftContract = await MarbleNFT.deployed();
    auctionContract = await MarbleDutchAuction.deployed();

    // ini few candidates
    await candidateContract.createCandidate(rick.uri, {from: rick.account, value: rick.payment});
    await candidateContract.createCandidate(morty.uri, {from: morty.account, value: morty.payment});
    await candidateContract.createCandidate(summer.uri, {from: summer.account, value: summer.payment});
  });

  it("mints Marble NFT and place it to Minting auction", async() => {
    await factoryContract.mint(
      rick.uri,
      rick.tokenUri,
      rick.uri,
      rick.payment*2,
      rick.payment,
      duration,
      {from: owner}
    );

    assert.equal(await nftContract.tokenBySourceUri(rick.uri), rick.token);
    assert(await auctionContract.isOnAuction(rick.token));
  });

  it("mints Marble NFT and bid on Minting auction", async() => {
    await factoryContract.mint(
      morty.uri,
      morty.tokenUri,
      morty.uri,
      morty.payment*2,
      morty.payment,
      duration,
      {from: owner}
    );

    assert.equal(await nftContract.tokenBySourceUri(morty.uri), morty.token);
    assert(await auctionContract.isOnAuction(morty.token));

    await auctionContract.bid(morty.token, {from:morty.account, value: await auctionContract.getCurrentPrice(morty.token)});
    assert(!(await auctionContract.isOnAuction(morty.token)));
    assert.equal(await nftContract.ownerOf(morty.token), morty.account);
  });


  it("throws trying to mint NFT without permission", async () => {
    await assertRevert(factoryContract.mint(
      summer.uri,
      summer.tokenUri,
      summer.uri,
      summer.payment*2,
      summer.payment,
      duration,
      {from: jerry.account}));
  });

  it("throws trying to burn NFT without permission", async () => {
    await assertRevert(factoryContract.burn(morty.token, {from: jerry.account}));
  });

  it("throws trying to mint NFT with duplicate URI", async () => {
    await assertRevert(factoryContract.mint(
      rick.uri,
      summer.tokenUri,
      summer.uri,
      summer.payment*2,
      summer.payment,
      duration,
      {from: owner}));
  });

  it("throws trying to mint NFT without candidate", async () => {
    await assertRevert(factoryContract.mint(
      summer.uri,
      summer.tokenUri,
      nonExistingURI,
      summer.payment*2,
      summer.payment,
      duration,
      {from: owner}));
  });

  it("throws trying to mint NFT with auction minimal price lower than candidates minting price", async () => {
    await assertRevert(factoryContract.mint(
      summer.uri,
      summer.tokenUri,
      summer.uri,
      summer.payment*2,
      summer.payment-1000,
      duration,
      {from: jerry.account}));
  });

  it("burns Marble NFT and removes it from auction", async () => {
    await auctionContract.pause({from: owner});

    await factoryContract.burn(rick.token, {from: owner});

    await auctionContract.unpause({from: owner});

    assert.equal(await nftContract.tokenBySourceUri(rick.uri), 0);
    assert(!(await auctionContract.isOnAuction(rick.token)));
  });

  it("burns Marble NFT what is not on auction", async () => {

    await factoryContract.burn(morty.token);

    assert.equal(await nftContract.tokenBySourceUri(morty.uri), 0);
  });
});
