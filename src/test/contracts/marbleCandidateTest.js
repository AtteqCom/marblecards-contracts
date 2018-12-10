const MarbleNFTCandidate = artifacts.require("./MarbleNFTCandidate.sol");

const assertRevert = require('../utils/assertRevert');
const [rick, morty, summer, beth, jerry] = require("../utils/actors.js");

const defaultMinimalPrice = 20000000000; // 20 gwei
const newMinimalPrice = 30000000000; // 30 gwei

contract("MarbleCandidateTest", accounts => {
  let candidateContract;

  console.log(accounts);

  const owner = accounts[0];

  summer.account = accounts[1];
  beth.account = accounts[2];
  jerry.account = accounts[3];
  rick.account = accounts[4];
  morty.account = accounts[5];

  before(async () => {
    candidateContract = await MarbleNFTCandidate.deployed();
  });

  it("returns correct count of NFT candidates after creation", async () => {
    await candidateContract.createCandidate(rick.uri, {from: rick.account, value: rick.payment});
    console.log("Creates Ricks candidate...");
    await candidateContract.createCandidate(morty.uri, {from: morty.account, value: morty.payment});
    console.log("Creates Mortys candidate...");
    let count = await candidateContract.getCandidatesCount();
    console.log(count + " ----- -");

    assert.equal(count, 2);
  });

  it("throws trying to create candidate with same URI", async () => {
    await assertRevert(candidateContract.createCandidate(rick.uri, {from: beth.account, value: rick.payment}));
  });

  it("throws trying to create candidate with empty URI", async () => {
    await assertRevert(candidateContract.createCandidate("", {from: jerry.account, value: jerry.payment}));
  });

  it("sets new minimal price", async () => {
    await candidateContract.setMinimalPrice(newMinimalPrice, {from: owner});
    assert.equal(await candidateContract.minimalMintingPrice(), newMinimalPrice);
  });

  it("throws trying to create underprice candidate", async () => {
    await assertRevert(candidateContract.createCandidate("under.price.uri", {from: rick.account, value: rick.payment}));
  });

  it("gets candidate by URI", async () => {
    // var candidate = {index: null, owner: null, mintingPrice: null, uri: null, created: null};
    var candidate = await candidateContract.getCandidate(rick.uri);

    // [candidate.index, candidate.owner, candidate.mintingPrice, candidate.uri, candidate.created] = await candidateContract.getCandidate(rick.uri);
    assert.equal(candidate.uri, rick.uri, "It's not Ricks URI!");
  });

  it("checks existance of candidate", async () => {
    var exists = await candidateContract.isCandidate(morty.uri);
    assert.equal(exists, true);
  });

  it("check nonexisting candidate", async () => {
    var exists = await candidateContract.isCandidate(jerry.uri);
    assert.equal(exists, false);
  });

  it("removes candidate", async () => {
    var count = await candidateContract.getCandidatesCount();
    await candidateContract.removeCandidate(morty.uri, {from: owner});
    assert.equal(await candidateContract.getCandidatesCount(), count - 1);
  });

  it("throws trying to remove candidate without permissions", async () => {
    await assertRevert(candidateContract.createCandidate(rick.uri, {from: beth.account}));
  });

  it("withdraws candidate contract balance", async () => {
    let ownersBalance = await web3.eth.getBalance(owner);
    await candidateContract.withdrawBalance({from: owner});
    assert.notEqual(ownersBalance, await web3.eth.getBalance(owner));
    assert.equal(await web3.eth.getBalance(candidateContract.address),0);
  });

  it("throws trying to withdraw balance without permissions", async () => {
    await assertRevert(candidateContract.withdrawBalance({from: jerry.account}));
  });

});
