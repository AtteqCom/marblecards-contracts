const MarbleNFT = artifacts.require("./MarbleNFT.sol");

const assertRevert = require('../utils/assertRevert');
const [rick, morty, summer, beth, jerry] = require("../utils/actors.js");

const timeOfCreation = Date.now();

contract("MarbleNFTTest", accounts => {
  let nftContract;
  let nft;
  let nftSource;

  const owner = accounts[0];

  summer.account = accounts[1];
  beth.account = accounts[2];
  jerry.account = accounts[3];
  rick.account = accounts[4];
  morty.account = accounts[5];

  before(async () => {
    nftContract = await MarbleNFT.deployed();
  });

  beforeEach(async () => {
    nft = {id: null, uri: null, metadataUri: null, owner: null, creator: null, created: null};
    nftSource = {uri: null, creator: null, created: null};
  });

  it("returns correct count of NFTs after minting", async () => {

    await nftContract.mint(1, rick.account, rick.uri, rick.tokenUri, timeOfCreation, {from: owner});
    await nftContract.mint(2, beth.account, beth.uri, beth.tokenUri, Date.now(), {from: owner});
    await nftContract.mint(3, summer.account, summer.uri, summer.tokenUri, Date.now(), {from: owner});

    assert.equal(await nftContract.totalSupply(), 3);
  });

  it("throws trying to create NFT with empty URI", async () => {
    await assertRevert(nftContract.mint(4, morty.account, "", morty.tokenUri, Date.now(), {from: owner}));
  });

  it("throws trying to create NFT with duplicate URI", async () => {
    await assertRevert(nftContract.mint(4, morty.account, summer.uri, morty.tokenUri, Date.now(), {from: owner}));
  });

  it("throws trying to mint without admins permissions", async () => {
    await assertRevert(nftContract.mint(4, morty.account, morty.uri, morty.tokenUri, Date.now(), {from: jerry.account}));
  });

  it("force approval over NFT", async () => {
    await nftContract.forceApproval(3, jerry.account, {from: owner});
    let approved = await nftContract.getApproved(3);

    assert.equal(approved, jerry.account);
  });

  it("throws trying to force approval without admins permissions", async () => {
    await assertRevert(nftContract.forceApproval(3, rick.account, {from: rick.account}));
  });

  it("transfer ownership", async () => {
    nftContract.transferFrom(summer.account, jerry.account, 3, {})
    await assertRevert(nftContract.forceApproval(3, rick.account, {from: rick.account}));
  });

  it("gets NFT Source model by token ID", async () => {
    [nftSource.uri, nftSource.creator, nftSource.created] = await nftContract.tokenSource(1);

    assert.equal(nftSource.uri, rick.uri);
    assert.equal(nftSource.creator, rick.account);
    assert.equal(nftSource.created, timeOfCreation);
  });

  it("gets token ID by source URI", async () => {
    let tokeId = await nftContract.tokenBySourceUri(rick.uri);
    assert.equal(tokeId, 1);
  });

  it("gets NFT model by ID", async () => {
    [nft.id, nft.uri, nft.metadataUri, nft.owner, nft.creator, nft.created] = await nftContract.getNFT(1);

    assert.equal(nft.id, 1);
    assert.equal(nft.uri, rick.uri);
    assert.equal(nft.metadataUri, rick.tokenUri);
    assert.equal(nft.owner, rick.account);
    assert.equal(nft.creator, rick.account);
    assert.equal(nft.created, timeOfCreation);
  });

  it("burns NFT", async () => {
    let count = await nftContract.totalSupply();
    await nftContract.burn(1, {from: owner});

    assert.equal(await nftContract.totalSupply(), count - 1);
  });

  it("throws trying to burn without admins permissions", async () => {
    await assertRevert(nftContract.burn(2, {from: beth.account}));
  });

});
