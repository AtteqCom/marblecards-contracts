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
  let bankContract;
  let erc20Contract;

  const owner = accounts[0];

  summer.account = accounts[1];
  beth.account = accounts[2];
  jerry.account = accounts[3];
  rick.account = accounts[4];
  morty.account = accounts[5];

  async function initialize() {
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
    await nftContract.setApprovalForAll(auctionContract.address, true, {from: owner});
    await nftContract.setApprovalForAll(auctionContract.address, true, {from: rick.account});
    await nftContract.setApprovalForAll(auctionContract.address, true, {from: morty.account});
    await nftContract.setApprovalForAll(auctionContract.address, true, {from: summer.account});
    await nftContract.setApprovalForAll(auctionContract.address, true, {from: beth.account});
    await nftContract.setApprovalForAll(auctionContract.address, true, {from: jerry.account});
  }

  async function createNFT(tokenId, userAddress) {
    await nftContract.mint(tokenId, userAddress, userAddress, `${tokenId}`, `${tokenId}`, Date.now(), {from: owner});
  }

  async function createAuctionAndToken(tokenId, userAddress) {
    await createNFT(tokenId, userAddress);
    await auctionContract.createAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(duration), {from: userAddress});
  }

  describe("full scenario", () => {

    before(async () => {
      await initialize();
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
      
      await auctionContract.setAuctioneerCut(5000);
      const response = await auctionContract.bid(summer.token, tokenCurrentPrice, { from: morty.account});

      truffleAssert.eventEmitted(response, 'AuctionSuccessful', { 
        tokenId: web3.utils.toBN(summer.token), winner: morty.account, totalPrice: web3.utils.toBN(tokenCurrentPrice.toString())
      });

      const auctioneerRevenue = web3.utils.toBN(tokenCurrentPrice).divn(2);
      const sellerRevenue = tokenCurrentPrice.sub(auctioneerRevenue)
      assert.equal((await bankContract.userBalance(erc20Contract.address, summer.account)).toString(), sellerRevenue, 
        "Seller has to gain his revenue");
      assert.equal(await nftContract.ownerOf(summer.token), morty.account);
      assert.equal((await erc20Contract.balanceOf(auctionContract.address)).toString(), auctioneerRevenue,
        "Auction should gain its revenue")
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

  describe("unit tests", () => {
    beforeEach(async () => {
      await initialize()
    })

    describe("createAuction function", () => {
      it("reverts on nonexistent NFT", async () => {
        await truffleAssert.reverts(
          auctionContract.createAuction(1351, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000)),
          "ERC721: owner query for nonexistent token"
        )
      })

      it("reverts when not owner of the NFT", async () => {
        await createNFT(18, owner);

        await truffleAssert.reverts(
          auctionContract.createAuction(18, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000), {from: rick.account}),
          "Only owner of the token can create auction!"
        )
      })

      it("reverts when auction too short", async () => {
        await createNFT(19, owner);

        await truffleAssert.reverts(
          auctionContract.createAuction(19, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(59), {from: owner}),
          "Duration of the dynamic part of the auction has to be at least one minute"
        )
      })

      it("reverts when paused", async () => {
        await createNFT(23, owner);
        await auctionContract.pause({from: owner});

        await truffleAssert.reverts(
          auctionContract.createAuction(23, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(130), {from: owner}),
          "Contract is paused"
        )
      })

      it("emits correct event", async () => {
        await createNFT(20, summer.account);

        const result = await auctionContract.createAuction(20, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(120), {from: summer.account});

        truffleAssert.eventEmitted(result, 'AuctionCreated', { 
          tokenId: web3.utils.toBN(20), seller: summer.account, startingPrice: web3.utils.toBN(10), endingPrice: web3.utils.toBN(5), 
          duration: web3.utils.toBN(120), delayedCancel: false
        });
      })

      it("changes the owner to the auction contract", async () => {
        await createNFT(21, owner);

        await auctionContract.createAuction(21, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(120), {from: owner});

        assert.equal(await nftContract.ownerOf(21), auctionContract.address);
      })
    })

    describe("createMintingAuction function", () => {

      it("reverts on nonexistent NFT", async () => {
        await truffleAssert.reverts(
          auctionContract.createMintingAuction(1531211, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000), owner, {from: owner}),
          "ERC721: owner query for nonexistent token"
        )
      })

      it("reverts when auction too short", async () => {
        await createNFT(27, owner);

        await truffleAssert.reverts(
          auctionContract.createMintingAuction(27, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(59), owner, {from: owner}),
          "Duration of the dynamic part of the auction has to be at least one minute"
        )
      })

      it("reverts when called from non admin account", async () => {
        await createNFT(28, rick.account);

        await truffleAssert.reverts(
          auctionContract.createMintingAuction(28, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(120), rick.account, {from: rick.account}),
          "Can be executed only by admin accounts!"
        )
      })

      it("emits correct event", async () => {
        await createNFT(29, summer.account);

        const result = await auctionContract.createMintingAuction(29, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(120), summer.account, {from: owner});

        truffleAssert.eventEmitted(result, 'AuctionCreated', { 
          tokenId: web3.utils.toBN(29), seller: summer.account, startingPrice: web3.utils.toBN(10), endingPrice: web3.utils.toBN(5), 
          duration: web3.utils.toBN(120), delayedCancel: true
        });
      })

      it("changes the owner to the auction contract", async () => {
        await createNFT(30, owner);

        await auctionContract.createMintingAuction(30, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(120), owner, {from: owner});

        assert.equal(await nftContract.ownerOf(30), auctionContract.address);
      })
    })

    describe("createAuctionByMetatransaction function", () => {
      let metatransactionsAddress;

      beforeEach(async () => {
        // NOTE: for testing purposes, we will need it to be some wallet which will act as metatx contract and execute the transactions
        metatransactionsAddress = owner;
        await auctionContract.setMetatransactionsContract(metatransactionsAddress, {from: owner});
      })

      it("reverts when not called from metatx address", async () => {
        await createNFT(31, owner);

        await truffleAssert.reverts(
          auctionContract.createAuctionByMetatransaction(31, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000), owner, {from: rick.account}),
          "Can be called only by metatransactions contract"
        )
      })

      it("reverts on nonexistent NFT", async () => {
        await truffleAssert.reverts(
          auctionContract.createAuctionByMetatransaction(5312, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000), owner, {from: metatransactionsAddress}),
          "ERC721: owner query for nonexistent token"
        )
      })

      it("reverts when not owner of the NFT", async () => {
        await createNFT(32, owner);

        await truffleAssert.reverts(
          auctionContract.createAuctionByMetatransaction(32, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000), rick.account, {from: metatransactionsAddress}),
          "Only owner of the token can create auction!"
        )
      })

      it("reverts when auction too short", async () => {
        await createNFT(33, owner);

        await truffleAssert.reverts(
          auctionContract.createAuctionByMetatransaction(33, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(59), owner, {from: metatransactionsAddress}),
          "Duration of the dynamic part of the auction has to be at least one minute"
        )
      })

      it("reverts when paused", async () => {
        await createNFT(34, rick.account);
        await auctionContract.pause({from: owner});

        await truffleAssert.reverts(
          auctionContract.createAuctionByMetatransaction(34, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(130), rick.account, {from: metatransactionsAddress}),
          "Contract is paused"
        )
      })

      it("emits correct event", async () => {
        await createNFT(35, summer.account);

        const result = await auctionContract.createAuctionByMetatransaction(35, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(120), summer.account, {from: metatransactionsAddress});

        truffleAssert.eventEmitted(result, 'AuctionCreated', { 
          tokenId: web3.utils.toBN(35), seller: summer.account, startingPrice: web3.utils.toBN(10), endingPrice: web3.utils.toBN(5), 
          duration: web3.utils.toBN(120), delayedCancel: false
        });
      })

      it("changes the owner to the auction contract", async () => {
        await createNFT(36, summer.account);

        await auctionContract.createAuctionByMetatransaction(36, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(120), summer.account, {from: metatransactionsAddress});

        assert.equal(await nftContract.ownerOf(36), auctionContract.address);
      })
    })

    describe("bid function", () => {
      it("reverts when token not in auction", async () => {
        await bankContract.deposit(erc20Contract.address, 10, owner, "deposit", {from: owner})

        await truffleAssert.reverts(
          auctionContract.bid(37, 10),
          "NFT is not on this auction!"
        )
      })

      it("reverts when contract is paused", async () => {
        await auctionContract.pause();

        await truffleAssert.reverts(
          auctionContract.bid(38, 10),
          "Contract is paused"
        )
      })

      it("reverts when is initial auction and finished", async () => {
        const tokenId = 39;
        const duration = 200;

        await bankContract.deposit(erc20Contract.address, 10, morty.account, "deposit", {from: owner})
        await createNFT(tokenId, owner);
        await auctionContract.createMintingAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(duration), owner, {from: owner});
        await advanceChainTime(duration + 20);

        await truffleAssert.reverts(
          auctionContract.bid(tokenId, 10, {from: morty.account}),
          "You can not bid on this auction, because it has delayed cancel policy actived and after times up it belongs once again to seller!"
        )
      })

      it("reverts when not enough mbc in bank", async () => {
        const tokenId = 40;
        const duration = 200;

        await bankContract.deposit(erc20Contract.address, 9, morty.account, "deposit", {from: owner})
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(duration), {from: owner});

        await truffleAssert.reverts(
          auctionContract.bid(tokenId, 10, {from: morty.account}),
          "Not enough tokens in the bank"
        )
      })

      it("emits correct event", async () => {
        const tokenId = 41;
        const cost = 256;

        await bankContract.deposit(erc20Contract.address, cost, morty.account , "deposit", {from: owner})
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(cost), web3.utils.toBN(cost), web3.utils.toBN(duration), {from: owner});
        await auctionContract.setAuctioneerCut(2500);

        const result = await auctionContract.bid(tokenId, cost, { from: morty.account });

        truffleAssert.eventEmitted(result, 'AuctionSuccessful', { 
          tokenId: web3.utils.toBN(tokenId), totalPrice: web3.utils.toBN(cost), winner: morty.account
        });
      })

      it("transfers mbc correctly (from bidder to seller and auction)", async () => {
        const tokenId = 42;
        const cost = 512;

        await bankContract.deposit(erc20Contract.address, cost + 10, morty.account, "deposit", {from: owner})
        const initialOwnerBalance = await erc20Contract.balanceOf(owner);
        const initialOwnerBankBalance = await bankContract.userBalance(erc20Contract.address, owner);
        const initialBidderBankBalance = await bankContract.userBalance(erc20Contract.address, morty.account);
        const initialAuctionBalance = await erc20Contract.balanceOf(auctionContract.address);
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(cost), web3.utils.toBN(cost), web3.utils.toBN(duration), {from: owner});
        await auctionContract.setAuctioneerCut(2500);
        await auctionContract.setAuctioneerDelayedCancelCut(0);

        await auctionContract.bid(tokenId, cost, { from: morty.account });


        const currentOwnerBalance = await erc20Contract.balanceOf(owner);
        const currentOwnerBankBalance = await bankContract.userBalance(erc20Contract.address, owner);
        const currentAuctionContractBalance = await erc20Contract.balanceOf(auctionContract.address);
        const currentBidderBankBalance = await bankContract.userBalance(erc20Contract.address, morty.account);

        const expectedOwnerBalance = initialOwnerBalance;
        const expectedOwnerBankBalance = initialOwnerBankBalance.add(web3.utils.toBN(cost * (3/4)));
        const expectedAuctionContractBalance = initialAuctionBalance.add(web3.utils.toBN(cost * (1/4)));
        const expectedBidderBankBalance = initialBidderBankBalance.sub(web3.utils.toBN(cost));

        assert.equal(currentOwnerBalance.toString(), expectedOwnerBalance.toString(),
          "Owner's erc20 balance should not have changed");
        assert.equal(currentOwnerBankBalance.toString(), expectedOwnerBankBalance.toString(),
          "Owner's balance in the bank should have increase by 3/4 of the auction cost (1/4 is auction contract's cut)");
        assert.equal(currentAuctionContractBalance.toString(), expectedAuctionContractBalance.toString(),
          "Auction contract's balance should have increased by 1/4 of the cost because the cut is 25%");
        assert.equal(currentBidderBankBalance.toString(), expectedBidderBankBalance.toString(),
          "Bidder's balance in bank should have decreased by the cost of the auction");
      })

      it("transfers mbc correctly (from bidder to seller and auction) ON INITIAL AUCTION", async () => {
        const tokenId = 44;
        const cost = 512;

        await bankContract.deposit(erc20Contract.address, cost + 10, morty.account, "deposit", {from: owner})
        const initialOwnerBalance = await erc20Contract.balanceOf(owner);
        const initialOwnerBankBalance = await bankContract.userBalance(erc20Contract.address, owner);
        const initialBidderBankBalance = await bankContract.userBalance(erc20Contract.address, morty.account);
        const initialAuctionBalance = await erc20Contract.balanceOf(auctionContract.address);
        await createNFT(tokenId, owner);
        await auctionContract.createMintingAuction(tokenId, web3.utils.toBN(cost), web3.utils.toBN(cost), web3.utils.toBN(duration), owner, {from: owner});
        await auctionContract.setAuctioneerCut(0);
        await auctionContract.setAuctioneerDelayedCancelCut(2500);

        await auctionContract.bid(tokenId, cost, { from: morty.account });

        const currentOwnerBalance = await erc20Contract.balanceOf(owner);
        const currentOwnerBankBalance = await bankContract.userBalance(erc20Contract.address, owner);
        const currentAuctionContractBalance = await erc20Contract.balanceOf(auctionContract.address);
        const currentBidderBankBalance = await bankContract.userBalance(erc20Contract.address, morty.account);

        const expectedOwnerBalance = initialOwnerBalance;
        const expectedOwnerBankBalance = initialOwnerBankBalance.add(web3.utils.toBN(cost * (3/4)));
        const expectedAuctionContractBalance = initialAuctionBalance.add(web3.utils.toBN(cost * (1/4)));
        const expectedBidderBankBalance = initialBidderBankBalance.sub(web3.utils.toBN(cost));

        assert.equal(currentOwnerBalance.toString(), expectedOwnerBalance.toString(),
          "Owner's erc20 balance should not have changed");
        assert.equal(currentOwnerBankBalance.toString(), expectedOwnerBankBalance.toString(),
          "Owner's bank balance should have increase by 3/4 of the auction cost (1/4 is auction contract's cut)");
        assert.equal(currentAuctionContractBalance.toString(), expectedAuctionContractBalance.toString(),
          "Auction contract's balance should have increased by 1/4 of the cost because the cut is 25%");
        assert.equal(currentBidderBankBalance.toString(), expectedBidderBankBalance.toString(),
          "Bidder's balance in bank should have decreased by the cost of the auction");
      })

      it("transfers the token to the bidder", async () => {
        const tokenId = 45;
        const cost = 513;

        await bankContract.deposit(erc20Contract.address, cost, morty.account, "deposit", {from: owner})
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(cost), web3.utils.toBN(cost), web3.utils.toBN(duration), {from: owner});

        await auctionContract.bid(tokenId, cost, { from: morty.account });

        assert.equal(await nftContract.ownerOf(tokenId), morty.account);
      })
    })

    describe("bidByMetatransaction function", () => {
      let metatransactionsAddress;

      beforeEach(async () => {
        // NOTE: for testing purposes, we will need it to be some wallet which will act as metatx contract and execute the transactions
        metatransactionsAddress = owner;
        await auctionContract.setMetatransactionsContract(metatransactionsAddress, {from: owner});
      })

      it("reverts when token not in auction", async () => {
        await bankContract.deposit(erc20Contract.address, 10, summer.account, "deposit", {from: owner})

        await truffleAssert.reverts(
          auctionContract.bidByMetatransaction(46, 10, summer.account, {from: metatransactionsAddress}),
          "NFT is not on this auction!"
        )
      })

      it("reverts when contract is paused", async () => {
        await auctionContract.pause();

        await truffleAssert.reverts(
          auctionContract.bidByMetatransaction(47, 10, summer.account, {from: metatransactionsAddress}),
          "Contract is paused"
        )
      })

      it("reverts when is initial auction and finished", async () => {
        const tokenId = 48;
        const duration = 200;

        await bankContract.deposit(erc20Contract.address, 10, morty.account, "deposit", {from: owner})
        await createNFT(tokenId, owner);
        await auctionContract.createMintingAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(duration), owner, {from: owner});
        await advanceChainTime(duration + 20);

        await truffleAssert.reverts(
          auctionContract.bidByMetatransaction(tokenId, 10, morty.account, {from: metatransactionsAddress}),
          "You can not bid on this auction, because it has delayed cancel policy actived and after times up it belongs once again to seller!"
        )
      })

      it("reverts when not enough mbc in bank", async () => {
        const tokenId = 49;
        const duration = 200;

        await bankContract.deposit(erc20Contract.address, 9, morty.account, "deposit", {from: owner})
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(duration), {from: owner});

        await truffleAssert.reverts(
          auctionContract.bidByMetatransaction(tokenId, 10, morty.account, {from: metatransactionsAddress}),
          "Not enough tokens in the bank"
        )
      })

      it("reverts when executed from other address than mtx address", async () => {
        const tokenId = 50;
        const duration = 200;

        await bankContract.deposit(erc20Contract.address, 10, morty.account, "deposit", {from: owner})
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(duration), {from: owner});

        await truffleAssert.reverts(
          auctionContract.bidByMetatransaction(tokenId, 10, morty.account, {from: morty.account}),
          "Can be called only by metatransactions contract"
        )
      })

      it("emits correct event", async () => {
        const tokenId = 51;
        const cost = 256;

        await bankContract.deposit(erc20Contract.address, cost, morty.account , "deposit", {from: owner})
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(cost), web3.utils.toBN(cost), web3.utils.toBN(duration), {from: owner});
        await auctionContract.setAuctioneerCut(2500);

        const result = await auctionContract.bidByMetatransaction(tokenId, cost, morty.account, { from: metatransactionsAddress });

        truffleAssert.eventEmitted(result, 'AuctionSuccessful', { 
          tokenId: web3.utils.toBN(tokenId), totalPrice: web3.utils.toBN(cost), winner: morty.account
        });
      })

      it("transfers mbc correctly (from bidder to seller and auction)", async () => {
        const tokenId = 52;
        const cost = 512;

        await bankContract.deposit(erc20Contract.address, cost + 10, morty.account, "deposit", {from: owner})
        const initialOwnerBalance = await erc20Contract.balanceOf(owner);
        const initialOwnerBankBalance = await bankContract.userBalance(erc20Contract.address, owner);
        const initialBidderBankBalance = await bankContract.userBalance(erc20Contract.address, morty.account);
        const initialAuctionBalance = await erc20Contract.balanceOf(auctionContract.address);
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(cost), web3.utils.toBN(cost), web3.utils.toBN(duration), {from: owner});
        await auctionContract.setAuctioneerCut(2500);
        await auctionContract.setAuctioneerDelayedCancelCut(0);

        await auctionContract.bidByMetatransaction(tokenId, cost, morty.account, { from: metatransactionsAddress });


        const currentOwnerBalance = await erc20Contract.balanceOf(owner);
        const currentOwnerBankBalance = await bankContract.userBalance(erc20Contract.address, owner);
        const currentAuctionContractBalance = await erc20Contract.balanceOf(auctionContract.address);
        const currentBidderBankBalance = await bankContract.userBalance(erc20Contract.address, morty.account);

        const expectedOwnerBalance = initialOwnerBalance;
        const expectedOwnerBankBalance = initialOwnerBankBalance.add(web3.utils.toBN(cost * (3/4)));
        const expectedAuctionContractBalance = initialAuctionBalance.add(web3.utils.toBN(cost * (1/4)));
        const expectedBidderBankBalance = initialBidderBankBalance.sub(web3.utils.toBN(cost));

        assert.equal(currentOwnerBalance.toString(), expectedOwnerBalance.toString(),
          "Owner's erc20 balance should not have changed");
        assert.equal(currentOwnerBankBalance.toString(), expectedOwnerBankBalance.toString(),
          "Owner's balance in the bank should have increase by 3/4 of the auction cost (1/4 is auction contract's cut)");
        assert.equal(currentAuctionContractBalance.toString(), expectedAuctionContractBalance.toString(),
          "Auction contract's balance should have increased by 1/4 of the cost because the cut is 25%");
        assert.equal(currentBidderBankBalance.toString(), expectedBidderBankBalance.toString(),
          "Bidder's balance in bank should have decreased by the cost of the auction");
      })

      it("transfers mbc correctly (from bidder to seller and auction) ON INITIAL AUCTION", async () => {
        const tokenId = 53;
        const cost = 512;

        await bankContract.deposit(erc20Contract.address, cost + 10, morty.account, "deposit", {from: owner})
        const initialOwnerBalance = await erc20Contract.balanceOf(owner);
        const initialOwnerBankBalance = await bankContract.userBalance(erc20Contract.address, owner);
        const initialBidderBankBalance = await bankContract.userBalance(erc20Contract.address, morty.account);
        const initialAuctionBalance = await erc20Contract.balanceOf(auctionContract.address);
        await createNFT(tokenId, owner);
        await auctionContract.createMintingAuction(tokenId, web3.utils.toBN(cost), web3.utils.toBN(cost), web3.utils.toBN(duration), owner, {from: owner});
        await auctionContract.setAuctioneerCut(0);
        await auctionContract.setAuctioneerDelayedCancelCut(2500);

        await auctionContract.bidByMetatransaction(tokenId, cost, morty.account, { from: metatransactionsAddress });

        const currentOwnerBalance = await erc20Contract.balanceOf(owner);
        const currentOwnerBankBalance = await bankContract.userBalance(erc20Contract.address, owner);
        const currentAuctionContractBalance = await erc20Contract.balanceOf(auctionContract.address);
        const currentBidderBankBalance = await bankContract.userBalance(erc20Contract.address, morty.account);

        const expectedOwnerBalance = initialOwnerBalance;
        const expectedOwnerBankBalance = initialOwnerBankBalance.add(web3.utils.toBN(cost * (3/4)));
        const expectedAuctionContractBalance = initialAuctionBalance.add(web3.utils.toBN(cost * (1/4)));
        const expectedBidderBankBalance = initialBidderBankBalance.sub(web3.utils.toBN(cost));

        assert.equal(currentOwnerBalance.toString(), expectedOwnerBalance.toString(),
          "Owner's erc20 balance should not have changed");
        assert.equal(currentOwnerBankBalance.toString(), expectedOwnerBankBalance.toString(),
          "Owner's bank balance should have increase by 3/4 of the auction cost (1/4 is auction contract's cut)");
        assert.equal(currentAuctionContractBalance.toString(), expectedAuctionContractBalance.toString(),
          "Auction contract's balance should have increased by 1/4 of the cost because the cut is 25%");
        assert.equal(currentBidderBankBalance.toString(), expectedBidderBankBalance.toString(),
          "Bidder's balance in bank should have decreased by the cost of the auction");
      })

      it("transfers the token to the bidder", async () => {
        const tokenId = 54;
        const cost = 513;

        await bankContract.deposit(erc20Contract.address, cost, morty.account, "deposit", {from: owner})
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(cost), web3.utils.toBN(cost), web3.utils.toBN(duration), {from: owner});

        await auctionContract.bidByMetatransaction(tokenId, cost, morty.account, { from: metatransactionsAddress });

        assert.equal(await nftContract.ownerOf(tokenId), morty.account);
      })
    })

    describe("cancelAuction function", () => {
      it("reverts when token not in auction", async () => {
        await truffleAssert.reverts(
          auctionContract.cancelAuction(55),
          "NFT is not auctioned over our contract!"
        )
      })

      it("reverts when contract is paused", async () => {
        const tokenId = 56;
        await createAuctionAndToken(tokenId, owner);
        await auctionContract.pause();

        await truffleAssert.reverts(
          auctionContract.cancelAuction(tokenId, {from: owner}),
          "Contract is paused"
        )
      })

      it("reverts when called by not seller address", async () => {
        const tokenId = 57;
        await createAuctionAndToken(tokenId, morty.account);

        await truffleAssert.reverts(
          auctionContract.cancelAuction(tokenId, {from: rick.account}),
          "You have no rights to cancel this auction!"
        )
      })

      it("reverts when is initial auction and not finished yet", async () => {
        const tokenId = 58;
        const duration = 200;

        await createNFT(tokenId, morty.account);
        await auctionContract.createMintingAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(duration), morty.account, {from: owner});

        await truffleAssert.reverts(
          auctionContract.cancelAuction(tokenId, {from: morty.account}),
          "You have no rights to cancel this auction!"
        )
      })

      it("emits correct event", async () => {
        const tokenId = 59;

        await createAuctionAndToken(tokenId, summer.account);

        const result = await auctionContract.cancelAuction(tokenId, { from: summer.account });

        truffleAssert.eventEmitted(result, 'AuctionCancelled', { 
          tokenId: web3.utils.toBN(tokenId)
        });
      })

      it("transfers the token back to the seller", async () => {
        const tokenId = 60;

        await createAuctionAndToken(tokenId, summer.account);
        assert.equal(await nftContract.ownerOf(tokenId), auctionContract.address, 
          "After the auction creation, the owner of the NFT should be the auction contract")

        await auctionContract.cancelAuction(tokenId, { from: summer.account });

        assert.equal(await nftContract.ownerOf(tokenId), summer.account);
      })
    })

    describe("cancelAuctionByMetatransaction function", () => {
      let metatransactionsAddress;

      beforeEach(async () => {
        // NOTE: for testing purposes, we will need it to be some wallet which will act as metatx contract and execute the transactions
        metatransactionsAddress = owner;
        await auctionContract.setMetatransactionsContract(metatransactionsAddress, {from: owner});
      })

      it("reverts when token not in auction", async () => {
        await truffleAssert.reverts(
          auctionContract.cancelAuctionByMetatransaction(61, beth.account, {from: metatransactionsAddress}),
          "NFT is not auctioned over our contract!"
        )
      })

      it("reverts when contract is paused", async () => {
        const tokenId = 62;
        await createAuctionAndToken(tokenId, beth.account);
        await auctionContract.pause();

        await truffleAssert.reverts(
          auctionContract.cancelAuctionByMetatransaction(tokenId, beth.account, {from: metatransactionsAddress}),
          "Contract is paused"
        )
      })

      it("reverts when called by not metatransactions address", async () => {
        const tokenId = 63;
        await createAuctionAndToken(tokenId, beth.account);

        await truffleAssert.reverts(
          auctionContract.cancelAuctionByMetatransaction(tokenId, beth.account, {from: beth.account}),
          "Can be called only by metatransactions contract"
        )
      })

      it("reverts when called by not seller address", async () => {
        const tokenId = 64;
        await createAuctionAndToken(tokenId, morty.account);

        await truffleAssert.reverts(
          auctionContract.cancelAuctionByMetatransaction(tokenId, beth.account, {from: metatransactionsAddress}),
          "You have no rights to cancel this auction!"
        )
      })

      it("reverts when is initial auction and not finished yet", async () => {
        const tokenId = 65;
        const duration = 200;

        await createNFT(tokenId, morty.account);
        await auctionContract.createMintingAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(duration), morty.account, {from: owner});

        await truffleAssert.reverts(
          auctionContract.cancelAuctionByMetatransaction(tokenId, morty.account, {from: metatransactionsAddress}),
          "You have no rights to cancel this auction!"
        )
      })

      it("emits correct event", async () => {
        const tokenId = 66;

        await createAuctionAndToken(tokenId, summer.account);

        const result = await auctionContract.cancelAuctionByMetatransaction(tokenId, summer.account, { from: metatransactionsAddress });

        truffleAssert.eventEmitted(result, 'AuctionCancelled', { 
          tokenId: web3.utils.toBN(tokenId)
        });
      })

      it("transfers the token back to the seller", async () => {
        const tokenId = 67;

        await createAuctionAndToken(tokenId, summer.account);
        assert.equal(await nftContract.ownerOf(tokenId), auctionContract.address, 
          "After the auction creation, the owner of the NFT should be the auction contract")

        await auctionContract.cancelAuctionByMetatransaction(tokenId, summer.account, { from: metatransactionsAddress });

        assert.equal(await nftContract.ownerOf(tokenId), summer.account);
      })
    })

    describe("cancelAuctionWhenPaused function", () => {
      it("reverts when called by non admin", async () => {
        const tokenId = 82;
        await createAuctionAndToken(tokenId, morty.account);
        await auctionContract.pause();

        await truffleAssert.reverts(
          auctionContract.cancelAuctionWhenPaused(tokenId, {from: jerry.account}),
          "Can be executed only by admin accounts!"
        )
      })

      it("reverts when contract not paused", async () => {
        const tokenId = 83;
        await createAuctionAndToken(tokenId, morty.account);

        await truffleAssert.reverts(
          auctionContract.cancelAuctionWhenPaused(tokenId, {from: owner}),
          "Contract is not paused"
        )
      })

      it("reverts when nft not on auction", async () => {
        await auctionContract.pause();

        await truffleAssert.reverts(
          auctionContract.cancelAuctionWhenPaused(84, {from: owner}),
          "NFT is not auctioned over our contract!"
        )
      })

      it("emits correct event", async () => {
        const tokenId = 85;

        await createAuctionAndToken(tokenId, summer.account);
        await auctionContract.pause();

        const result = await auctionContract.cancelAuctionWhenPaused(tokenId, { from: owner });

        truffleAssert.eventEmitted(result, 'AuctionCancelled', { 
          tokenId: web3.utils.toBN(tokenId)
        });
      })

      it("transfers the token back to the seller", async () => {
        const tokenId = 87;

        await createAuctionAndToken(tokenId, summer.account);
        await auctionContract.pause();
        assert.equal(await nftContract.ownerOf(tokenId), auctionContract.address, 
          "After the auction creation, the owner of the NFT should be the auction contract")

        await auctionContract.cancelAuctionWhenPaused(tokenId, { from: owner });

        assert.equal(await nftContract.ownerOf(tokenId), summer.account);
      })
    })

    describe("isOnAuction function", () => {
      it("returns false when NFT not on auction", async () => {
        assert.equal(
          await auctionContract.isOnAuction(78), false
        )
      })

      it("returns true when NFT on auction", async () => {
        const tokenId = 79;
        await createNFT(tokenId, morty.account);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(500), {from: morty.account});

        assert.equal(
          await auctionContract.isOnAuction(tokenId), true
        )
      })

      it("returns true when normal auction's dynamic phase ended", async () => {
        const tokenId = 80;
        const duration = 120;
        await createNFT(tokenId, morty.account);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(duration), {from: morty.account});
        
        await advanceChainTime(duration + 10);

        assert.equal(
          await auctionContract.isOnAuction(tokenId), true
        )
      })

      it("returns true when initial auction's dynamic phase ended", async () => {
        const tokenId = 81;
        const duration = 120;
        await createNFT(tokenId, morty.account);
        await auctionContract.createMintingAuction(tokenId, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(duration), morty.account, {from: owner});
        
        await advanceChainTime(duration + 10);

        assert.equal(
          await auctionContract.isOnAuction(tokenId), true
        )
      })
    })

    describe("getAuction function", () => {
      it("reverts when not on auction", async () => {
        it("reverts when NFT not in auction", async () => {
          await truffleAssert.reverts(
            auctionContract.getAuction(76),
            "NFT is not auctioned over our contract!"
          )
        })
      })

      it("returns correct values", async () => {
        const tokenId = 77;
        const duration = 100;
        const startPrice = 30
        const endPrice = 10;

        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(startPrice), web3.utils.toBN(endPrice), duration);

        const result = await auctionContract.getAuction(tokenId);

        assert.equal(result.seller, owner)
        assert.equal(result.startingPrice, startPrice)
        assert.equal(result.endingPrice, endPrice)
        assert.equal(result.duration, duration)
        assert.equal(result.delayedCancel, false)
      })
    })

    describe("getCurrentPrice function", () => {
      it("reverts when NFT not in auction", async () => {
        await truffleAssert.reverts(
          auctionContract.getCurrentPrice(73),
          "NFT is not auctioned over our contract!"
        )
      })

      it("returns correct value during dynamic price phase", async () => {
        const tokenId = 75;
        const duration = 100;
        const startPrice = 30
        const endPrice = 10;

        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(startPrice), web3.utils.toBN(endPrice), duration);
        await advanceChainTime(duration / 2);

        assert.equal(await auctionContract.getCurrentPrice(tokenId), startPrice + (endPrice - startPrice) / 2)
      })

      it("returns correct value after dynamic price phase", async () => {
        const tokenId = 74;
        const duration = 100;
        const endPrice = 10;

        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(endPrice * 10), web3.utils.toBN(endPrice), duration);
        await advanceChainTime(duration + 1);

        assert.equal(await auctionContract.getCurrentPrice(tokenId), endPrice)
      })
    })

    describe("removeAuction function", () => {
      it("reverts when called by non admin", async () => {
        const tokenId = 68;
        await createAuctionAndToken(tokenId, morty.account);
        await auctionContract.pause();

        await truffleAssert.reverts(
          auctionContract.removeAuction(tokenId, {from: morty.account}),
          "Can be executed only by admin accounts!"
        )
      })

      it("reverts when called on non paused contraact", async () => {
        const tokenId = 69;
        await createAuctionAndToken(69, beth.account);

        await truffleAssert.reverts(
          auctionContract.removeAuction(tokenId, {from: owner}),
          "Contract is not paused"
        )
      })

      it("reverts when the token is not in auction", async () => {
        await auctionContract.pause();

        await truffleAssert.reverts(
          auctionContract.removeAuction(70, {from: owner}),
          "No open auction"
        )
      })

      it("emits correct event", async () => {
        const tokenId = 71;
        await createAuctionAndToken(tokenId, jerry.account);
        await auctionContract.pause();

        const result = await auctionContract.removeAuction(tokenId, {from: owner});

        truffleAssert.eventEmitted(result, 'AuctionRemoved', { 
          _tokenId: web3.utils.toBN(tokenId)
        });
      })

      it("actually removes the auction", async () => {
        const tokenId = 72;
        await createAuctionAndToken(tokenId, jerry.account);
        await auctionContract.pause();
        assert.equal(await auctionContract.isOnAuction(tokenId), true, "Token should be on auction before the test")

        await auctionContract.removeAuction(tokenId, {from: owner});

        assert.equal(await auctionContract.isOnAuction(tokenId), false, "Token should not be on auction after the test")
      })
    })

    describe('tokens withdrawal', () => {
      it('adds tokens to the owner when withdrawn', async () => {
        const tokensAmount = 213;
        await erc20Contract.transfer(auctionContract.address, tokensAmount);
        
        const ownerTokensBefore = await erc20Contract.balanceOf(owner);
        await auctionContract.withdrawTokens(erc20Contract.address, { from: owner });
        const ownerTokensAfter = await erc20Contract.balanceOf(owner);
  
        assert.equal(ownerTokensAfter.sub(ownerTokensBefore), tokensAmount, "All tokens from the auction contract should be transfered to the owner.")
      })
  
      it('reverts when not owner is trying to withdraw', async () => {
        const tokensAmount = 125;
        await erc20Contract.transfer(auctionContract.address, tokensAmount);
        
        await truffleAssert.reverts(
          auctionContract.withdrawTokens(erc20Contract.address, { from: morty.account })
        )
      })
    })

    describe("setAuctioneerCut function", () => {
      it("reverts when called from non owner account", async () => {
        await truffleAssert.reverts(
          auctionContract.setAuctioneerCut(10, {from: jerry.account}),
          "Can be executed only by admin accounts!"
        )
      })

      it("reverts on incorrect value", async () => {
        await truffleAssert.reverts(
          auctionContract.setAuctioneerCut(10001, {from: owner}),
          "Cut should be in interval of 0-10000"
        )
      })

      it("actually changes the cut", async () => {
        const cut = 360;
        await auctionContract.setAuctioneerCut(cut, {from: owner});

        assert.equal(await auctionContract.auctioneerCut(), cut);
      })
    })

    describe("setAuctioneerDelayedCancelCut function", () => {
      it("reverts when called from non owner account", async () => {
        await truffleAssert.reverts(
          auctionContract.setAuctioneerDelayedCancelCut(10, {from: jerry.account}),
          "Can be executed only by admin accounts!"
        )
      })

      it("reverts on incorrect value", async () => {
        await truffleAssert.reverts(
          auctionContract.setAuctioneerDelayedCancelCut(10001, {from: owner}),
          "Delayed cut should be in interval of 0-10000"
        )
      })

      it("actually changes the cut", async () => {
        const cut = 360;
        await auctionContract.setAuctioneerDelayedCancelCut(cut, {from: owner});

        assert.equal(await auctionContract.auctioneerDelayedCancelCut(), cut);
      })
    })

    describe("setMetatransactionsContract function", () => {
      it("reverts when not called from owner account", async () => {
        await truffleAssert.reverts(
          // NOTE: the address can be any address at this point
          auctionContract.setMetatransactionsContract(owner, {from: rick.account}),
          "Can be executed only by admin accounts!"
        )
      })

      it("actually changes the contract reference", async () => {
        // NOTE: the address can be any address at this point
        await auctionContract.setMetatransactionsContract(owner, {from: owner});
        assert.equal(owner, await auctionContract.marbleMetatransactionsContract(), "Should change the reference to the new address");
      })
    })

    describe("setMarbleCoinContract function", () => {
      it("reverts when not called from owner account", async () => {
        await truffleAssert.reverts(
          auctionContract.setMarbleCoinContract(erc20Contract.address, {from: rick.account}),
          "Can be executed only by admin accounts!"
        )
      })

      it("actually changes the contract reference", async () => {
        const newErc20Contract = await ERC20Coin.new();
        await auctionContract.setMarbleCoinContract(newErc20Contract.address, {from: owner});

        assert.equal(newErc20Contract.address, await auctionContract.marbleCoinContract(), "Should change the reference to the new contract");
      })
    })

    describe("tokenInAuctionByIndex function", () => {
      it("returns correct token id", async () => {
        await createAuctionAndToken(1, owner); // index 0
        await createAuctionAndToken(2, rick.account); // index 1
        await createAuctionAndToken(3, morty.account); // index 2

        const result = await auctionContract.tokenInAuctionByIndex(1);
        
        assert.equal(result, 2);
      })
    })

    describe("tokenOfSellerByIndex function", () => {
      it("returns correct token id", async () => {
        await createAuctionAndToken(10, owner); // index 0
        await createAuctionAndToken(14, owner); // index 1
        await createAuctionAndToken(15, owner); // index 2

        const result = await auctionContract.tokenOfSellerByIndex(owner, 2);
        
        assert.equal(result, 15);
      })
    })

    describe("totalAuctionsBySeller function", () => {
      it("returns 0 before any auction is created", async () => {
        assert.equal(await auctionContract.totalAuctionsBySeller(owner), 0, "There should be no auctions")
      })

      it("returns 0 before any auction is created by the queried account", async () => {
        await createAuctionAndToken(beth.token, beth.account);
        assert.equal(await auctionContract.totalAuctionsBySeller(owner), 0, "There should be no auctions")
      })

      it("returns correct number", async () => {
        await createAuctionAndToken(beth.token, beth.account);
        await createAuctionAndToken(10, owner);
        await createAuctionAndToken(11, owner);

        assert.equal(await auctionContract.totalAuctionsBySeller(owner), 2, "There should be two owner auctions")
        assert.equal(await auctionContract.totalAuctionsBySeller(beth.account), 1, "There should be one beth auction")
        assert.equal(await auctionContract.totalAuctionsBySeller(rick.account), 0, "There should be no rick auction")
      })
    })

    describe("totalAuctions function", () => {
      it("returns 0 before any auction is created", async () => {
        assert.equal(await auctionContract.totalAuctions(), 0, "There should be no auctions")
      })

      it("returns correct number of auctions", async () => {
        await createAuctionAndToken(rick.token, rick.account);
        await createAuctionAndToken(beth.token, beth.account);

        assert.equal(await auctionContract.totalAuctions(), 2, "There should be 2 auuctions")
      })
    })

    describe("setNFTContract function", () => {
      it("reverts when not called from owner account", async () => {
        await truffleAssert.reverts(
          auctionContract.setNFTContract(nftContract.address, {from: rick.account}),
          "Can be executed only by admin accounts!"
        )
      })

      it("actually changes the contract reference", async () => {
        const newNftContract = await MarbleNFT.new();
        await auctionContract.setNFTContract(newNftContract.address, {from: owner});

        assert.equal(newNftContract.address, await auctionContract.nftContract(), "Should change the reference to the new contract");
      })
    })

  })

})
