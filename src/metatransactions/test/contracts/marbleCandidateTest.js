const MarbleNFTCandidate = artifacts.require("./MarbleNFTCandidate.sol");
const MarbleBank = artifacts.require("./MarbleBank.sol");
const ERC20Token = artifacts.require("./MetaCoin.sol");

const logger = require('../utils/logger');
const assertRevert = require('../utils/assertRevert');
const [rick, morty, summer, beth, jerry] = require("../utils/actors.js");
const config = require('../../config');
const truffleAssert = require('truffle-assertions');

const zeroAddress = '0x0000000000000000000000000000000000000000';
const defaultMinimalPrice = config.CANDIDATE_MINIMAL_PRICE;
const newHigherMinimalPrice = parseInt(config.CANDIDATE_MINIMAL_PRICE) + 3;

contract("MarbleCandidateTest", accounts => {
  let candidateContract;
  let bankContract;

  logger.log(accounts);

  const owner = accounts[0];

  rick.account = accounts[1];
  morty.account = accounts[2];
  summer.account = accounts[3];
  beth.account = accounts[4];
  jerry.account = accounts[5];

  before(async () => {
    candidateContract = await MarbleNFTCandidate.new();
    bankContract = await MarbleBank.new();
    await candidateContract.setMinimalPrice(config.CANDIDATE_MINIMAL_PRICE);
  });

  it("returns correct count of NFT candidates after creation", async () => {
    logger.log(`Count before - ${await candidateContract.getCandidatesCount()}`);
    logger.log(`Minimal price before - ${await candidateContract.minimalMintingPrice()}`);
    await candidateContract.createCandidate(rick.uri, {from: rick.account, value: rick.payment});
    logger.log(`Creates Ricks candidate....WEI:${rick.payment}`);
    await candidateContract.createCandidate(morty.uri, {from: morty.account, value: morty.payment});
    logger.log(`Creates Mortys candidate...WEI:${morty.payment}`);
    let count = await candidateContract.getCandidatesCount();
    logger.log(`Count after - ${await candidateContract.getCandidatesCount()}`);

    assert.equal(count, 2);
  });

  it("Test candidates", async() => {
    var count_before = await candidateContract.getCandidatesCount();
    logger.log("count_before:" + count_before);

    await candidateContract.createCandidate("url1", {from: morty.account, value: morty.payment});
    await candidateContract.createCandidate("url2", {from: morty.account, value: morty.payment});
    await candidateContract.createCandidate("url3", {from: morty.account, value: morty.payment});

    var count_after = await candidateContract.getCandidatesCount();
    logger.log("count_after:" + count_after);

    var hashForUrl1 = await candidateContract.getCandidate("url1");
    var hashForUrl2 = await candidateContract.getCandidate("url2");
    var hashForUrl3 = await candidateContract.getCandidate("url3");
    var url1_index_before = hashForUrl1[0]; //index
    var url1_uri_before = hashForUrl1[3]; //uri
    var url2_index_before = hashForUrl2[0]; //index
    var url2_uri_before = hashForUrl2[3]; //uri
    var url3_index_before = hashForUrl3[0]; //index
    var url3_uri_before = hashForUrl3[3]; //uri


    logger.log("url1_index_before:" + url1_index_before);
    logger.log("url1_uri_before:" + url1_uri_before);
    logger.log("url2_index_before:" + url2_index_before);
    logger.log("url2_uri_before:" + url2_uri_before);
    logger.log("url3_index_before:" + url3_index_before);
    logger.log("url3_uri_before:" + url3_uri_before);

    logger.log(" ");
    logger.log("remove url1");
    logger.log(" ");
    var wait = await candidateContract.getCandidatesCount();
    logger.log(" #" + wait);
    await candidateContract.removeCandidate("url1", {from: owner});

    logger.log(" wait ");
    wait = await candidateContract.getCandidatesCount();
    logger.log(" #" + wait);

    var hashForUrl1_after = await candidateContract.getCandidate("url1");
    var hashForUrl2_after = await candidateContract.getCandidate("url2");
    var hashForUrl3_after = await candidateContract.getCandidate("url3");
    var url1_index_after = hashForUrl1_after[0]; //index
    var url1_uri_after = hashForUrl1_after[3]; //uri
    var url2_index_after = hashForUrl2_after[0]; //index
    var url2_uri_after= hashForUrl2_after[3]; //uri
    var url3_index_after = hashForUrl3_after[0]; //index
    var url3_uri_after = hashForUrl3_after[3]; //uri

    logger.log("url1_index_after:" + url1_index_after);
    logger.log("url1_uri_after:" + url1_uri_after);
    logger.log("url2_index_after:" + url2_index_after);
    logger.log("url2_uri_after:" + url2_uri_after);
    logger.log("url3_index_after:" + url3_index_after);
    logger.log("url3_uri_after:" + url3_uri_after);

    logger.log(" ");
    logger.log("add url4");
    logger.log(" ");
    await candidateContract.createCandidate("url4", {from: morty.account, value: morty.payment});

    logger.log(" wait ");
    wait = await candidateContract.getCandidatesCount();
    logger.log(" #" + wait);

    var hashForUrl4 = await candidateContract.getCandidate("url4");
    var url4_index_new = hashForUrl4[0]; //index
    var url4_uri_new = hashForUrl4[3]; //uri

    logger.log("url1_index_after:" + url1_index_after);
    logger.log("url1_uri_after:" + url1_uri_after);
    logger.log("url2_index_after:" + url2_index_after);
    logger.log("url2_uri_after:" + url2_uri_after);
    logger.log("url3_index_after:" + url3_index_after);
    logger.log("url3_uri_after:" + url3_uri_after);
    logger.log("url4_index_new:" + url4_index_new);
    logger.log("url4_uri_new:" + url4_uri_new);

    const response = await candidateContract.createCandidate("url5", {from: morty.account, value: morty.payment});
    truffleAssert.eventEmitted(response, 'CandidateCreated', 
      { index: web3.utils.toBN(5), owner: morty.account, mintingPrice: web3.utils.toBN(morty.payment), paidInToken: zeroAddress, uri: 'url5' }
    );
  });

  it("throws trying to create candidate with same URI", async () => {
    await assertRevert(candidateContract.createCandidate(rick.uri, {from: beth.account, value: rick.payment}));
  });

  it("throws trying to create candidate with empty URI", async () => {
    await assertRevert(candidateContract.createCandidate("", {from: jerry.account, value: jerry.payment}));
  });

  it("sets new minimal price", async () => {
    logger.log(`Minimal price before - ${await candidateContract.minimalMintingPrice()}`);
    await candidateContract.setMinimalPrice(newHigherMinimalPrice + "", {from: owner});
    var minimalPrice = await candidateContract.minimalMintingPrice();
    logger.log(`Minimal price after  - ${minimalPrice}`);
    assert.equal(minimalPrice, newHigherMinimalPrice);
  });

  it("throws trying to create underprice candidate", async () => {
    logger.log(`Minimal price before - ${await candidateContract.minimalMintingPrice()}`);
    logger.log(`Ricks payment        - ${rick.payment}`);
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
    logger.log();
    await candidateContract.removeCandidate(morty.uri, {from: owner});
    assert.equal(await candidateContract.getCandidatesCount(), count - 1);
  });

  it("throws trying to remove candidate without permissions", async () => {
    await assertRevert(candidateContract.createCandidate(rick.uri, {from: beth.account}));
  });

  it("throws trying to withdraw balance without permissions", async () => {
    await assertRevert(candidateContract.withdrawBalance({from: jerry.account}));
  });

  it("withdraws candidate contract balance", async () => {
    let ownersBalance = await web3.eth.getBalance(owner);
    assert(await web3.eth.getBalance(candidateContract.address) > 0, "Candidate contract should have money!");
    await candidateContract.withdrawBalance({from: owner});
    assert.notEqual(ownersBalance, await web3.eth.getBalance(owner));
    assert.equal(await web3.eth.getBalance(candidateContract.address),0);
  });

  describe("creating candidate for user", () => {
    beforeEach(async () => {
      candidateContract = await MarbleNFTCandidate.new();
      await candidateContract.setMinimalPrice(config.CANDIDATE_MINIMAL_PRICE);
    })    

    it('creates the candidate correctly', async () => {
      const uri = "https://solarsystem.nasa.gov/planets/mercury/overview";

      await candidateContract.createCandidateForUser(uri, morty.account, { from: rick.account, value: rick.payment });
      const createdCandidate = await candidateContract.getCandidate(uri);

      assert.equal(createdCandidate.owner, morty.account, "Incorrect owner of the newly created candidate")
      assert.equal(createdCandidate.uri, uri, "Incorrect uri of the candidate");
    })

    it('emits correct event when candidate is created', async () => {
      const uri = "https://solarsystem.nasa.gov/planets/venus/overview";

      const result = await candidateContract.createCandidateForUser(uri, morty.account, { from: rick.account, value: rick.payment });
      
      truffleAssert.eventEmitted(result, 'CandidateCreated', 
        { index: web3.utils.toBN(0), owner: morty.account, mintingPrice: web3.utils.toBN(rick.payment), paidInToken: zeroAddress, uri: uri }
      );
    })
  })

  describe("paying with tokens", async () => {

    let erc20Token;
    const candidatePriceInToken = 50;

    beforeEach(async () => {
      candidateContract = await MarbleNFTCandidate.new();
      await candidateContract.setBankContract(bankContract.address);
      await bankContract.addAffiliate(candidateContract.address);

      erc20Token = await ERC20Token.new();
      candidateContract.setMinimalMintingPriceInToken(erc20Token.address, candidatePriceInToken);
      await erc20Token.approve(bankContract.address, 10000000000000);
    })

    it('creates candidate when payed with tokens', async () => {
      const uri = "https://solarsystem.nasa.gov/planets/earth/overview";

      await bankContract.deposit(erc20Token.address, candidatePriceInToken + 10, owner, "initial deposit")
      await candidateContract.createCandidateWithERC20(uri, erc20Token.address, { from: owner });
      const createdCandidate = await candidateContract.getCandidate(uri);

      assert.equal(createdCandidate.owner, owner, "Incorrect owner of the newly created candidate")
      assert.equal(createdCandidate.mintingPrice, candidatePriceInToken, "Incorrect price on the candidate")
      assert.equal(createdCandidate.uri, uri, "Incorrect uri of the candidate");
      assert.equal(await bankContract.userBalance(erc20Token.address, owner, { from: owner }), 10, "Incorrect balance on rick's bank account")
      assert.equal(await erc20Token.balanceOf(candidateContract.address), candidatePriceInToken, "The paid tokens should be on candidate contract")
    })

    it('emits correct event when candidate is created', async () => {
      const uri = "https://solarsystem.nasa.gov/planets/mars/overview";

      await bankContract.deposit(erc20Token.address, candidatePriceInToken * 3, owner, "initial deposit")
      await candidateContract.createCandidateWithERC20(uri + "///", erc20Token.address);
      await candidateContract.createCandidateWithERC20(uri + "//", erc20Token.address);
      const result = await candidateContract.createCandidateWithERC20(uri, erc20Token.address);
      
      assert.equal(await erc20Token.balanceOf(candidateContract.address), candidatePriceInToken * 3, "The paid tokens should be on candidate contract")
      truffleAssert.eventEmitted(result, 'CandidateCreated', 
        { index: web3.utils.toBN(2), owner: owner, mintingPrice: web3.utils.toBN(candidatePriceInToken), paidInToken: erc20Token.address, uri: uri }
      );
    })

    it("reverts when not enough funds in the bank", async () => {
      const uri = "https://solarsystem.nasa.gov/planets/jupiter/overview";

      await bankContract.deposit(erc20Token.address, candidatePriceInToken - 1, owner, "initial deposit")
      await truffleAssert.reverts(
        candidateContract.createCandidateWithERC20(uri, erc20Token.address),
        "Not enough tokens in the bank"
      )
    })
  })

  describe('paying with tokens for user', () => {
    let erc20Token;
    const candidatePriceInToken = 50;

    beforeEach(async () => {
      candidateContract = await MarbleNFTCandidate.new();
      await candidateContract.setBankContract(bankContract.address);
      await bankContract.addAffiliate(candidateContract.address);

      erc20Token = await ERC20Token.new();
      candidateContract.setMinimalMintingPriceInToken(erc20Token.address, candidatePriceInToken);
      await erc20Token.approve(bankContract.address, 10000000000000);
      await erc20Token.approve(bankContract.address, 10000000000000, { from: rick.account });
    })

    it('creates the candidate', async () => {
      const uri = "https://solarsystem.nasa.gov/planets/saturn/overview";

      await erc20Token.transfer(rick.account, 200, { from: owner })
      await bankContract.deposit(erc20Token.address, candidatePriceInToken + 20, rick.account, "initial deposit", { from: rick.account })
      await candidateContract.setMetatransactionsContract(owner)
      await candidateContract.createCandidateWithERC20ForUser(uri, erc20Token.address, rick.account, { from: owner });
      const createdCandidate = await candidateContract.getCandidate(uri);

      assert.equal(createdCandidate.owner, rick.account, "Incorrect owner of the newly created candidate")
      assert.equal(createdCandidate.mintingPrice, candidatePriceInToken, "Incorrect price on the candidate")
      assert.equal(createdCandidate.uri, uri, "Incorrect uri of the candidate");
      assert.equal(await bankContract.userBalance(erc20Token.address, rick.account, { from: rick.account }), 20, "Incorrect balance on rick's bank account")
      assert.equal(await erc20Token.balanceOf(candidateContract.address), candidatePriceInToken, "The paid tokens should be on candidate contract")
    })

    it('emits correct event', async () => {
      const uri = "https://solarsystem.nasa.gov/planets/uranus/overview";

      await erc20Token.transfer(rick.account, 200, { from: owner })
      await bankContract.deposit(erc20Token.address, candidatePriceInToken + 20, rick.account, "initial deposit", { from: rick.account })
      await candidateContract.setMetatransactionsContract(owner)
      const result = await candidateContract.createCandidateWithERC20ForUser(uri, erc20Token.address, rick.account, { from: owner });

      truffleAssert.eventEmitted(result, 'CandidateCreated',
        { index: web3.utils.toBN(0), owner: rick.account, mintingPrice: web3.utils.toBN(candidatePriceInToken), paidInToken: erc20Token.address, uri: uri }
      )
    })

    it('reverts when not called from metatransactions contract', async () => {
      const uri = "https://solarsystem.nasa.gov/planets/neptune/overview";
      await truffleAssert.reverts(
        candidateContract.createCandidateWithERC20ForUser(uri, erc20Token.address, rick.account, { from: owner }),
        "Can be called only by metatransactions contract"
      );
    });

    it('reverts when the user does not have enough tokens', async () => {
      const uri = "https://solarsystem.nasa.gov/planets/planetX/overview";

      await erc20Token.transfer(rick.account, 200, { from: owner })
      await bankContract.deposit(erc20Token.address, candidatePriceInToken - 1, rick.account, "initial deposit", { from: rick.account })
      await candidateContract.setMetatransactionsContract(owner)
      await truffleAssert.reverts(
        candidateContract.createCandidateWithERC20ForUser(uri, erc20Token.address, rick.account, { from: owner }),
        "Not enough tokens in the bank."
      );
    });

  })

  describe('tokens withdrawal', () => {
    
    beforeEach(async () => {
      candidateContract = await MarbleNFTCandidate.new();
      erc20Token = await ERC20Token.new();
    })

    it('adds tokens to the owner when withdrawn', async () => {
      const tokensAmount = 213;
      await erc20Token.transfer(candidateContract.address, tokensAmount);
      
      const ownerTokensBefore = await erc20Token.balanceOf(owner);
      await candidateContract.withdrawTokens(erc20Token.address, { from: owner });
      const ownerTokensAfter = await erc20Token.balanceOf(owner);

      assert.equal(ownerTokensAfter - ownerTokensBefore, tokensAmount, "All tokens from the candidate contract should be transfered to the owner.")
    })

    it('reverts when not owner is trying to withdraw', async () => {
      const tokensAmount = 125;
      await erc20Token.transfer(candidateContract.address, tokensAmount);
      
      await truffleAssert.reverts(
        candidateContract.withdrawTokens(erc20Token.address, { from: morty.account })
      )
    })
  })

});
