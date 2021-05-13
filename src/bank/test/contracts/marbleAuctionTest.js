const MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");
const MarbleNFT = artifacts.require("./TestMarbleNFT.sol");
const MarbleBank = artifacts.require("./MarbleBank.sol");
const ERC20Coin = artifacts.require("./MetaCoin.sol");

const logger = require('../utils/logger');
const truffleAssert = require('truffle-assertions');
const config = require('../../config');

const [rick, morty, summer, beth, jerry] = require("../utils/actors.js");

const duration = 62; // seconds
const nonExistingToken = 999;

advanceTime = (time) => {
  return new Promise((resolve, reject) => {
      web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [time],
          id: new Date().getTime()
      }, (err, result) => {
          if (err) { return reject(err); }
          return resolve(result);
      });
  });
}

advanceBlock = () => {
  return new Promise((resolve, reject) => {
      web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: new Date().getTime()
      }, (err, result) => {
          if (err) { return reject(err); }
          const newBlockHash = web3.eth.getBlock('latest').hash;

          return resolve(newBlockHash)
      });
  });
}

advanceChainTime = async (time) => {
  await advanceTime(time);
  await advanceBlock();

  return Promise.resolve(web3.eth.getBlock('latest'));
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

  describe("full scenario", () => {
    before(async () => {
      nftContract = await MarbleNFT.new();
      auctionContract = await MarbleDutchAuction.new();
      bankContract = await MarbleBank.new();
      erc20Contract = await ERC20Coin.new();

      await auctionContract.setNFTContract(nftContract.address);
      await auctionContract.setBankContract(bankContract.address);
      await auctionContract.setMarbleCoinContract(erc20Contract.address);
      await nftContract.addAdmin(auctionContract.address);
      await bankContract.addAffiliate(auctionContract.address);
      await erc20Contract.increaseAllowance(bankContract.address, web3.utils.toBN("5000000000000000000"), {from: owner})

      // NOTE: we need to do this here, because force approval does not work on the testing nft contract
      await nftContract.setApprovalForAll(auctionContract.address, true, {from: rick.account});
      await nftContract.setApprovalForAll(auctionContract.address, true, {from: morty.account});
      await nftContract.setApprovalForAll(auctionContract.address, true, {from: summer.account});
      await nftContract.setApprovalForAll(auctionContract.address, true, {from: beth.account});
      await nftContract.setApprovalForAll(auctionContract.address, true, {from: jerry.account});
    });

    it("returns correct count of Auctions after creation", async () => {
      await nftContract.mint(rick.token, rick.account, rick.account, rick.uri, rick.tokenUri, Date.now(), {from: owner});
      await nftContract.mint(beth.token, beth.account, beth.account, beth.uri, beth.tokenUri, Date.now(), {from: owner});
      await nftContract.mint(summer.token, summer.account, summer.account, summer.uri, summer.tokenUri, Date.now(), {from: owner});
      await nftContract.mint(morty.token, morty.account, morty.account, morty.uri, morty.tokenUri, Date.now(), {from: owner});
      await nftContract.mint(jerry.token, jerry.account, jerry.account, jerry.uri, jerry.tokenUri, Date.now(), {from: owner});

      await auctionContract.createAuction(rick.token, web3.utils.toBN(2*rick.payment), web3.utils.toBN(rick.payment), web3.utils.toBN(duration*10), {from: rick.account});
      await auctionContract.createAuction(beth.token, web3.utils.toBN(2*beth.payment), web3.utils.toBN(beth.payment), web3.utils.toBN(duration*10), {from: beth.account});
      await auctionContract.createAuction(summer.token, web3.utils.toBN(2*summer.payment), web3.utils.toBN(summer.payment), web3.utils.toBN(duration*10), {from: summer.account});
      await auctionContract.createAuction(morty.token, web3.utils.toBN(2*morty.payment), web3.utils.toBN(morty.payment), web3.utils.toBN(duration*10), {from: morty.account});
      await auctionContract.createAuction(jerry.token, web3.utils.toBN(2*jerry.payment), web3.utils.toBN(jerry.payment), web3.utils.toBN(duration), {from: jerry.account});

      assert.equal(await auctionContract.totalAuctions(), 5);
    });

    it("throws trying to create auction with not owned NFT", async () => {
      await truffleAssert.reverts(
        auctionContract.createAuction(beth.token, web3.utils.toBN(2*rick.payment), web3.utils.toBN(rick.payment), web3.utils.toBN(duration), {from: rick.account}),
        "Only owner of the token can create auction!"
      )
    });

    it("throws trying to create auction with not existing NFT", async () => {
      await truffleAssert.reverts(
        auctionContract.createAuction(nonExistingToken, web3.utils.toBN(2*rick.payment), web3.utils.toBN(rick.payment), web3.utils.toBN(duration), {from: rick.account}),
        "ERC721: owner query for nonexistent token"
      )
    });

    it("throws trying to create auction with minimal price higher than starting price", async () => {
      await truffleAssert.reverts(
        auctionContract.createAuction(jerry.token, web3.utils.toBN(jerry.payment), web3.utils.toBN(2*jerry.payment), web3.utils.toBN(duration), {from: jerry.account}),
        "Only owner of the token can create auction!"
      );
    });

    it("throws trying to cancel not owned auction", async () => {
      await truffleAssert.reverts(
        auctionContract.cancelAuction(beth.token, {from: rick.account}),
        "You have no rights to cancel this auction!"
      )
    });

    it("checks auction existence", async () => {
      assert(await auctionContract.isOnAuction(beth.token));
    });

    it("checks auction non-existence", async () => {
      const exist = await auctionContract.isOnAuction(nonExistingToken);
      assert(!exist);
    });

    it("cancel auction", async () => {
      await auctionContract.cancelAuction(rick.token, {from: rick.account});
      assert.equal(await nftContract.ownerOf(rick.token), rick.account);
    });

    it("throws after underprice bid", async () => {
      const lowBidPrice = web3.utils.toBN(summer.payment - 1);
      await bankContract.deposit(erc20Contract.address, lowBidPrice, morty.account, "deposit", {from: owner})

      await truffleAssert.reverts(
        auctionContract.bid(summer.token, lowBidPrice, {from: morty.account}),
        "Bid amount has to be higher than or equal to the current price!"
      );
    });

    it("throws after bid on non-existing auction", async () => {
      const paymentAmount = web3.utils.toBN(morty.payment);
      await bankContract.deposit(erc20Contract.address, paymentAmount, morty.account, "deposit", {from: owner})

      await truffleAssert.reverts(
        auctionContract.bid(nonExistingToken, paymentAmount, {from: morty.account}),
        "NFT is not on this auction!"
      );
    });

    it("bid on classic auction", async () => {
      const tokenCurrentPrice = await auctionContract.getCurrentPrice(summer.token);
      await bankContract.deposit(erc20Contract.address, tokenCurrentPrice, morty.account, "deposit", {from: owner})
      
      // summer is creator of the auction
      const initialSummersBalance = await erc20Contract.balanceOf(summer.account);

      const response = await auctionContract.bid(summer.token, tokenCurrentPrice, { from: morty.account});

      truffleAssert.eventEmitted(response, 'AuctionSuccessful', { 
        tokenId: web3.utils.toBN(summer.token), winner: morty.account, totalPrice: tokenCurrentPrice
      });

      assert(await erc20Contract.balanceOf(summer.account), initialSummersBalance + tokenCurrentPrice, "Seller has to gain his revenue");
      assert.equal(await nftContract.ownerOf(summer.token), morty.account);
    });

    it("pause contract", async () => {
      await auctionContract.pause({from: owner});
      assert(await auctionContract.paused());
    });

    it("throws trying to cancel by seller", async () => {
      await truffleAssert.reverts(
        auctionContract.cancelAuction(morty.token, {from: morty.account}),
        "Contract is paused"
      );
    });

    it("cancel auction when paused by admin", async () => {
      await auctionContract.cancelAuctionWhenPaused(morty.token, {from: owner});
      assert.equal(await nftContract.ownerOf(morty.token), morty.account);
    });

    it("throws trying to bid when paused", async () => {
      await truffleAssert.reverts(
        auctionContract.bid(beth.token, await auctionContract.getCurrentPrice(beth.token), {from: jerry.account}),
        "Contract is paused"
      );
    });

    it("throws trying to remove auction without permision", async () => {
      await truffleAssert.reverts(
        auctionContract.removeAuction(beth.token, {from: jerry.account}),
        "Can be executed only by admin accounts!"
      );
    });

    it("removes auction", async () => {
      assert(await auctionContract.isOnAuction(beth.token));
      await auctionContract.removeAuction(beth.token, {from: owner});
      const isOnAuction = await auctionContract.isOnAuction(beth.token);
      assert(!isOnAuction);
    });

    it("unpause contract", async () => {
      await auctionContract.unpause({from: owner});
      assert(!(await auctionContract.paused()));
    });

    it("throws trying to remove auction when not paused", async () => {
      await truffleAssert.reverts(
        auctionContract.removeAuction(jerry.token, {from: owner}),
        "Contract is not paused"
      );
    });

    it("check current price when duration is over", async () => {
      await advanceChainTime(duration);

      const currentPrice = await auctionContract.getCurrentPrice(jerry.token);
      assert.equal(currentPrice, jerry.payment);
    });

    it("cancel auction when duration is over", async () => {
      advanceChainTime(duration);

      await auctionContract.cancelAuction(jerry.token, {from: jerry.account});
      assert.equal(await nftContract.ownerOf(jerry.token), jerry.account);
    });

    it("throws trying to withdraw balance without permissions", async () => {
      const auctionContractBalance = await erc20Contract.balanceOf(auctionContract.address);
      assert(auctionContractBalance > 0, "Auction contract should have some tokens!");

      await truffleAssert.reverts(
        auctionContract.withdrawTokens(erc20Contract.address, {from: jerry.account}),
        "Ownable: caller is not the owner"
      );
    });

    it("withdraws auction contract balance", async () => {
      const initialAuctionContractBalance = await erc20Contract.balanceOf(auctionContract.address);
      assert(initialAuctionContractBalance > 0, "Auction contract should have some tokens!");

      const initialOwnersBalance = await erc20Contract.balanceOf(owner);
      await auctionContract.withdrawTokens(erc20Contract.address, {from: owner});

      const auctionContractBalanceAfter = await erc20Contract.balanceOf(auctionContract.address);
      const ownerBalanceAfter = await erc20Contract.balanceOf(owner);

      const expectedOwnerBalance = initialOwnersBalance.add(initialAuctionContractBalance);

      assert.equal(auctionContractBalanceAfter, 0);
      assert.equal(expectedOwnerBalance.toString(), ownerBalanceAfter.toString());
    });

  });
})
