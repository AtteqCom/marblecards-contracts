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

  before(async () => {
    await initialize();
  });

  describe("unit tests", () => {
    beforeEach(async () => {
      await initialize()
    })

    describe("createAuction function", () => {
      // it("reverts on nonexistent NFT", async () => {
      //   await truffleAssert.reverts(
      //     auctionContract.createAuction(1351, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000)),
      //     "ERC721: owner query for nonexistent token"
      //   )
      // })

      // it("reverts when not owner of the NFT", async () => {
      //   await createNFT(18, owner);

      //   await truffleAssert.reverts(
      //     auctionContract.createAuction(18, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000), {from: rick.account}),
      //     "Only owner of the token can create auction!"
      //   )
      // })

      // it("reverts when auction too short", async () => {
      //   await createNFT(19, owner);

      //   await truffleAssert.reverts(
      //     auctionContract.createAuction(19, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(59), {from: owner}),
      //     "Duration of the dynamic part of the auction has to be at least one minute"
      //   )
      // })

      // it("reverts when paused", async () => {
      //   await createNFT(23, owner);
      //   await auctionContract.pause({from: owner});

      //   await truffleAssert.reverts(
      //     auctionContract.createAuction(23, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(130), {from: owner}),
      //     "Contract is paused"
      //   )
      // })

      // it("emits correct event", async () => {
      //   await createNFT(20, summer.account);

      //   const result = await auctionContract.createAuction(20, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(120), {from: summer.account});

      //   truffleAssert.eventEmitted(result, 'AuctionCreated', { 
      //     tokenId: web3.utils.toBN(20), seller: summer.account, startingPrice: web3.utils.toBN(10), endingPrice: web3.utils.toBN(5), 
      //     duration: web3.utils.toBN(120), delayedCancel: false
      //   });
      // })

      // it("changes the owner to the auction contract", async () => {
      //   await createNFT(21, owner);

      //   await auctionContract.createAuction(21, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(120), {from: owner});

      //   assert.equal(await nftContract.ownerOf(21), auctionContract.address);
      // })
    })

    describe("createMintingAuction function", () => {

      // it("reverts on nonexistent NFT", async () => {
      //   await truffleAssert.reverts(
      //     auctionContract.createMintingAuction(1531211, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000), owner, {from: owner}),
      //     "ERC721: owner query for nonexistent token"
      //   )
      // })

      // it("reverts when auction too short", async () => {
      //   await createNFT(27, owner);

      //   await truffleAssert.reverts(
      //     auctionContract.createMintingAuction(27, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(59), owner, {from: owner}),
      //     "Duration of the dynamic part of the auction has to be at least one minute"
      //   )
      // })

      // it("reverts when called from non admin account", async () => {
      //   await createNFT(28, rick.account);

      //   await truffleAssert.reverts(
      //     auctionContract.createMintingAuction(28, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(120), rick.account, {from: rick.account}),
      //     "Can be executed only by admin accounts!"
      //   )
      // })

      // it("emits correct event", async () => {
      //   await createNFT(29, summer.account);

      //   const result = await auctionContract.createMintingAuction(29, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(120), summer.account, {from: owner});

      //   truffleAssert.eventEmitted(result, 'AuctionCreated', { 
      //     tokenId: web3.utils.toBN(29), seller: summer.account, startingPrice: web3.utils.toBN(10), endingPrice: web3.utils.toBN(5), 
      //     duration: web3.utils.toBN(120), delayedCancel: true
      //   });
      // })

      // it("changes the owner to the auction contract", async () => {
      //   await createNFT(30, owner);

      //   await auctionContract.createMintingAuction(30, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(120), owner, {from: owner});

      //   assert.equal(await nftContract.ownerOf(30), auctionContract.address);
      // })
    })

    describe("createAuctionByMetatransaction function", () => {
      // let metatransactionsAddress;

      // beforeEach(async () => {
      //   // NOTE: for testing purposes, we will need it to be some wallet
      //   metatransactionsAddress = owner;
      //   await auctionContract.setMetatransactionsContract(metatransactionsAddress, {from: owner});
      // })

      // it("reverts when not called from metatx address", async () => {
      //   await createNFT(31, owner);

      //   await truffleAssert.reverts(
      //     auctionContract.createAuctionByMetatransaction(31, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000), owner, {from: rick.account}),
      //     "Can be called only by metatransactions contract"
      //   )
      // })

      // it("reverts on nonexistent NFT", async () => {
      //   await truffleAssert.reverts(
      //     auctionContract.createAuctionByMetatransaction(5312, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000), owner, {from: metatransactionsAddress}),
      //     "ERC721: owner query for nonexistent token"
      //   )
      // })

      // it("reverts when not owner of the NFT", async () => {
      //   await createNFT(32, owner);

      //   await truffleAssert.reverts(
      //     auctionContract.createAuctionByMetatransaction(32, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(10000), rick.account, {from: metatransactionsAddress}),
      //     "Only owner of the token can create auction!"
      //   )
      // })

      // it("reverts when auction too short", async () => {
      //   await createNFT(33, owner);

      //   await truffleAssert.reverts(
      //     auctionContract.createAuctionByMetatransaction(33, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(59), owner, {from: metatransactionsAddress}),
      //     "Duration of the dynamic part of the auction has to be at least one minute"
      //   )
      // })

      // it("reverts when paused", async () => {
      //   await createNFT(34, rick.account);
      //   await auctionContract.pause({from: owner});

      //   await truffleAssert.reverts(
      //     auctionContract.createAuctionByMetatransaction(34, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(130), rick.account, {from: metatransactionsAddress}),
      //     "Contract is paused"
      //   )
      // })

      // it("emits correct event", async () => {
      //   await createNFT(35, summer.account);

      //   const result = await auctionContract.createAuctionByMetatransaction(35, web3.utils.toBN(10), web3.utils.toBN(5), web3.utils.toBN(120), summer.account, {from: metatransactionsAddress});

      //   truffleAssert.eventEmitted(result, 'AuctionCreated', { 
      //     tokenId: web3.utils.toBN(35), seller: summer.account, startingPrice: web3.utils.toBN(10), endingPrice: web3.utils.toBN(5), 
      //     duration: web3.utils.toBN(120), delayedCancel: false
      //   });
      // })

      // it("changes the owner to the auction contract", async () => {
      //   await createNFT(36, summer.account);

      //   await auctionContract.createAuctionByMetatransaction(36, web3.utils.toBN(10), web3.utils.toBN(10), web3.utils.toBN(120), summer.account, {from: metatransactionsAddress});

      //   assert.equal(await nftContract.ownerOf(36), auctionContract.address);
      // })
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

        const result = await auctionContract.bid(tokenId, cost, { from: morty.account });

        truffleAssert.eventEmitted(result, 'AuctionSuccessful', { 
          tokenId: web3.utils.toBN(tokenId), totalPrice: web3.utils.toBN(cost), winner: morty.account
        });
      })

      it("transfers mbc from the bidder to the seller", async () => {
        const tokenId = 42;
        const cost = 512;

        await bankContract.deposit(erc20Contract.address, cost + 10, morty.account, "deposit", {from: owner})
        const initialSellerBankBalance = await bankContract.userBalance(erc20Contract.address, morty.account);
        const initialOwnerBalance = await erc20Contract.balanceOf(owner);
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(cost), web3.utils.toBN(cost), web3.utils.toBN(duration), {from: owner});

        await auctionContract.bid(tokenId, cost, { from: morty.account });

        assert.equal((await erc20Contract.balanceOf(owner)).toString(), +initialOwnerBalance + cost);
        assert.equal((await bankContract.userBalance(erc20Contract.address, morty.account)).toString(), initialSellerBankBalance - cost);
      })

      it("transfers the token to the bidder", async () => {
        const tokenId = 43;
        const cost = 513;

        await bankContract.deposit(erc20Contract.address, cost, morty.account, "deposit", {from: owner})
        await createNFT(tokenId, owner);
        await auctionContract.createAuction(tokenId, web3.utils.toBN(cost), web3.utils.toBN(cost), web3.utils.toBN(duration), {from: owner});

        await auctionContract.bid(tokenId, cost, { from: morty.account });

        assert.equal(await nftContract.ownerOf(tokenId), morty.account);
      })
    })

    describe("bidByMetatransaction function", () => {
      // TODO: implement me
    })

    describe("cancelAuction function", () => {
      // TODO: implement me
    })

    describe("cancelAuctionByMetatransaction function", () => {
      // TODO: implement me
    })

    describe("cancelAuctionWhenPaused function", () => {
      // TODO: implement me
    })

    describe("isOnAuction function", () => {
      // TODO: implement me
    })

    describe("getAuction function", () => {
      // TODO: implement me
    })

    describe("getCurrentPrice function", () => {
      // TODO: implement me
    })

    describe("removeAuction function", () => {
      // TODO: implement me
    })

    // describe("setMetatransactionsContract function", () => {
    //   it("reverts when not called from owner account", async () => {
    //     await truffleAssert.reverts(
    //       // NOTE: the address can be any address at this point
    //       auctionContract.setMetatransactionsContract(owner, {from: rick.account}),
    //       "Can be executed only by admin accounts!"
    //     )
    //   })

    //   it("actually changes the contract reference", async () => {
    //     // NOTE: the address can be any address at this point
    //     await auctionContract.setMetatransactionsContract(owner, {from: owner});
    //     assert.equal(owner, await auctionContract.marbleMetatransactionsContract(), "Should change the reference to the new address");
    //   })
    // })

    // describe("setMarbleCoinContract function", () => {
    //   it("reverts when not called from owner account", async () => {
    //     await truffleAssert.reverts(
    //       auctionContract.setMarbleCoinContract(erc20Contract.address, {from: rick.account}),
    //       "Can be executed only by admin accounts!"
    //     )
    //   })

    //   it("actually changes the contract reference", async () => {
    //     const newErc20Contract = await ERC20Coin.new();
    //     await auctionContract.setMarbleCoinContract(newErc20Contract.address, {from: owner});

    //     assert.equal(newErc20Contract.address, await auctionContract.marbleCoinContract(), "Should change the reference to the new contract");
    //   })
    // })

    // describe("tokenInAuctionByIndex function", () => {
    //   it("returns correct token id", async () => {
    //     await createAuctionAndToken(1, owner); // index 0
    //     await createAuctionAndToken(2, rick.account); // index 1
    //     await createAuctionAndToken(3, morty.account); // index 2

    //     const result = await auctionContract.tokenInAuctionByIndex(1);
        
    //     assert.equal(result, 2);
    //   })
    // })

    // describe("tokenOfSellerByIndex function", () => {
    //   it("returns correct token id", async () => {
    //     await createAuctionAndToken(10, owner); // index 0
    //     await createAuctionAndToken(14, owner); // index 1
    //     await createAuctionAndToken(15, owner); // index 2

    //     const result = await auctionContract.tokenOfSellerByIndex(owner, 2);
        
    //     assert.equal(result, 15);
    //   })
    // })

    // describe("totalAuctionsBySeller function", () => {
    //   it("returns 0 before any auction is created", async () => {
    //     assert.equal(await auctionContract.totalAuctionsBySeller(owner), 0, "There should be no auctions")
    //   })

    //   it("returns 0 before any auction is created by the queried account", async () => {
    //     await createAuctionAndToken(beth.token, beth.account);
    //     assert.equal(await auctionContract.totalAuctionsBySeller(owner), 0, "There should be no auctions")
    //   })

    //   it("returns correct number", async () => {
    //     await createAuctionAndToken(beth.token, beth.account);
    //     await createAuctionAndToken(10, owner);
    //     await createAuctionAndToken(11, owner);

    //     assert.equal(await auctionContract.totalAuctionsBySeller(owner), 2, "There should be two owner auctions")
    //     assert.equal(await auctionContract.totalAuctionsBySeller(beth.account), 1, "There should be one beth auction")
    //     assert.equal(await auctionContract.totalAuctionsBySeller(rick.account), 0, "There should be no rick auction")
    //   })
    // })

    // describe("totalAuctions function", () => {
    //   it("returns 0 before any auction is created", async () => {
    //     assert.equal(await auctionContract.totalAuctions(), 0, "There should be no auctions")
    //   })

    //   it("returns correct number of auctions", async () => {
    //     await createAuctionAndToken(rick.token, rick.account);
    //     await createAuctionAndToken(beth.token, beth.account);

    //     assert.equal(await auctionContract.totalAuctions(), 2, "There should be 2 auuctions")
    //   })
    // })

    // describe("setNFTContract function", () => {
    //   it("reverts when not called from owner account", async () => {
    //     await truffleAssert.reverts(
    //       auctionContract.setNFTContract(nftContract.address, {from: rick.account}),
    //       "Can be executed only by admin accounts!"
    //     )
    //   })

    //   it("actually changes the contract reference", async () => {
    //     const newNftContract = await MarbleNFT.new();
    //     await auctionContract.setNFTContract(newNftContract.address, {from: owner});

    //     assert.equal(newNftContract.address, await auctionContract.nftContract(), "Should change the reference to the new contract");
    //   })
    // })

  })

  // describe("full scenario", () => {

  //   it("returns correct count of Auctions after creation", async () => {
  //     await nftContract.mint(rick.token, rick.account, rick.account, rick.uri, rick.tokenUri, Date.now(), {from: owner});
  //     await nftContract.mint(beth.token, beth.account, beth.account, beth.uri, beth.tokenUri, Date.now(), {from: owner});
  //     await nftContract.mint(summer.token, summer.account, summer.account, summer.uri, summer.tokenUri, Date.now(), {from: owner});
  //     await nftContract.mint(morty.token, morty.account, morty.account, morty.uri, morty.tokenUri, Date.now(), {from: owner});
  //     await nftContract.mint(jerry.token, jerry.account, jerry.account, jerry.uri, jerry.tokenUri, Date.now(), {from: owner});

  //     await auctionContract.createAuction(rick.token, web3.utils.toBN(2*rick.payment), web3.utils.toBN(rick.payment), web3.utils.toBN(duration*10), {from: rick.account});
  //     await auctionContract.createAuction(beth.token, web3.utils.toBN(2*beth.payment), web3.utils.toBN(beth.payment), web3.utils.toBN(duration*10), {from: beth.account});
  //     await auctionContract.createAuction(summer.token, web3.utils.toBN(2*summer.payment), web3.utils.toBN(summer.payment), web3.utils.toBN(duration*10), {from: summer.account});
  //     await auctionContract.createAuction(morty.token, web3.utils.toBN(2*morty.payment), web3.utils.toBN(morty.payment), web3.utils.toBN(duration*10), {from: morty.account});
  //     await auctionContract.createAuction(jerry.token, web3.utils.toBN(2*jerry.payment), web3.utils.toBN(jerry.payment), web3.utils.toBN(duration), {from: jerry.account});

  //     assert.equal(await auctionContract.totalAuctions(), 5);
  //   });

  //   it("throws trying to create auction with not owned NFT", async () => {
  //     await truffleAssert.reverts(
  //       auctionContract.createAuction(beth.token, web3.utils.toBN(2*rick.payment), web3.utils.toBN(rick.payment), web3.utils.toBN(duration), {from: rick.account}),
  //       "Only owner of the token can create auction!"
  //     )
  //   });

  //   it("throws trying to create auction with not existing NFT", async () => {
  //     await truffleAssert.reverts(
  //       auctionContract.createAuction(nonExistingToken, web3.utils.toBN(2*rick.payment), web3.utils.toBN(rick.payment), web3.utils.toBN(duration), {from: rick.account}),
  //       "ERC721: owner query for nonexistent token"
  //     )
  //   });

  //   it("throws trying to create auction with minimal price higher than starting price", async () => {
  //     await truffleAssert.reverts(
  //       auctionContract.createAuction(jerry.token, web3.utils.toBN(jerry.payment), web3.utils.toBN(2*jerry.payment), web3.utils.toBN(duration), {from: jerry.account}),
  //       "Only owner of the token can create auction!"
  //     );
  //   });

  //   it("throws trying to cancel not owned auction", async () => {
  //     await truffleAssert.reverts(
  //       auctionContract.cancelAuction(beth.token, {from: rick.account}),
  //       "You have no rights to cancel this auction!"
  //     )
  //   });

  //   it("checks auction existence", async () => {
  //     assert(await auctionContract.isOnAuction(beth.token));
  //   });

  //   it("checks auction non-existence", async () => {
  //     const exist = await auctionContract.isOnAuction(nonExistingToken);
  //     assert(!exist);
  //   });

  //   it("cancel auction", async () => {
  //     await auctionContract.cancelAuction(rick.token, {from: rick.account});
  //     assert.equal(await nftContract.ownerOf(rick.token), rick.account);
  //   });

  //   it("throws after underprice bid", async () => {
  //     const lowBidPrice = web3.utils.toBN(summer.payment - 1);
  //     await bankContract.deposit(erc20Contract.address, lowBidPrice, morty.account, "deposit", {from: owner})

  //     await truffleAssert.reverts(
  //       auctionContract.bid(summer.token, lowBidPrice, {from: morty.account}),
  //       "Bid amount has to be higher than or equal to the current price!"
  //     );
  //   });

  //   it("throws after bid on non-existing auction", async () => {
  //     const paymentAmount = web3.utils.toBN(morty.payment);
  //     await bankContract.deposit(erc20Contract.address, paymentAmount, morty.account, "deposit", {from: owner})

  //     await truffleAssert.reverts(
  //       auctionContract.bid(nonExistingToken, paymentAmount, {from: morty.account}),
  //       "NFT is not on this auction!"
  //     );
  //   });

  //   it("bid on classic auction", async () => {
  //     const tokenCurrentPrice = await auctionContract.getCurrentPrice(summer.token);
  //     await bankContract.deposit(erc20Contract.address, tokenCurrentPrice, morty.account, "deposit", {from: owner})
      
  //     // summer is creator of the auction
  //     const initialSummersBalance = await erc20Contract.balanceOf(summer.account);

  //     const response = await auctionContract.bid(summer.token, tokenCurrentPrice, { from: morty.account});

  //     truffleAssert.eventEmitted(response, 'AuctionSuccessful', { 
  //       tokenId: web3.utils.toBN(summer.token), winner: morty.account, totalPrice: tokenCurrentPrice
  //     });

  //     assert(await erc20Contract.balanceOf(summer.account), initialSummersBalance + tokenCurrentPrice, "Seller has to gain his revenue");
  //     assert.equal(await nftContract.ownerOf(summer.token), morty.account);
  //   });

  //   it("pause contract", async () => {
  //     await auctionContract.pause({from: owner});
  //     assert(await auctionContract.paused());
  //   });

  //   it("throws trying to cancel by seller", async () => {
  //     await truffleAssert.reverts(
  //       auctionContract.cancelAuction(morty.token, {from: morty.account}),
  //       "Contract is paused"
  //     );
  //   });

  //   it("cancel auction when paused by admin", async () => {
  //     await auctionContract.cancelAuctionWhenPaused(morty.token, {from: owner});
  //     assert.equal(await nftContract.ownerOf(morty.token), morty.account);
  //   });

  //   it("throws trying to bid when paused", async () => {
  //     await truffleAssert.reverts(
  //       auctionContract.bid(beth.token, await auctionContract.getCurrentPrice(beth.token), {from: jerry.account}),
  //       "Contract is paused"
  //     );
  //   });

  //   it("throws trying to remove auction without permision", async () => {
  //     await truffleAssert.reverts(
  //       auctionContract.removeAuction(beth.token, {from: jerry.account}),
  //       "Can be executed only by admin accounts!"
  //     );
  //   });

  //   it("removes auction", async () => {
  //     assert(await auctionContract.isOnAuction(beth.token));
  //     await auctionContract.removeAuction(beth.token, {from: owner});
  //     const isOnAuction = await auctionContract.isOnAuction(beth.token);
  //     assert(!isOnAuction);
  //   });

  //   it("unpause contract", async () => {
  //     await auctionContract.unpause({from: owner});
  //     assert(!(await auctionContract.paused()));
  //   });

  //   it("throws trying to remove auction when not paused", async () => {
  //     await truffleAssert.reverts(
  //       auctionContract.removeAuction(jerry.token, {from: owner}),
  //       "Contract is not paused"
  //     );
  //   });

  //   it("check current price when duration is over", async () => {
  //     await advanceChainTime(duration);

  //     const currentPrice = await auctionContract.getCurrentPrice(jerry.token);
  //     assert.equal(currentPrice, jerry.payment);
  //   });

  //   it("cancel auction when duration is over", async () => {
  //     advanceChainTime(duration);

  //     await auctionContract.cancelAuction(jerry.token, {from: jerry.account});
  //     assert.equal(await nftContract.ownerOf(jerry.token), jerry.account);
  //   });

  //   it("throws trying to withdraw balance without permissions", async () => {
  //     const auctionContractBalance = await erc20Contract.balanceOf(auctionContract.address);
  //     assert(auctionContractBalance > 0, "Auction contract should have some tokens!");

  //     await truffleAssert.reverts(
  //       auctionContract.withdrawTokens(erc20Contract.address, {from: jerry.account}),
  //       "Ownable: caller is not the owner"
  //     );
  //   });

  //   it("withdraws auction contract balance", async () => {
  //     const initialAuctionContractBalance = await erc20Contract.balanceOf(auctionContract.address);
  //     assert(initialAuctionContractBalance > 0, "Auction contract should have some tokens!");

  //     const initialOwnersBalance = await erc20Contract.balanceOf(owner);
  //     await auctionContract.withdrawTokens(erc20Contract.address, {from: owner});

  //     const auctionContractBalanceAfter = await erc20Contract.balanceOf(auctionContract.address);
  //     const ownerBalanceAfter = await erc20Contract.balanceOf(owner);

  //     const expectedOwnerBalance = initialOwnersBalance.add(initialAuctionContractBalance);

  //     assert.equal(auctionContractBalanceAfter, 0);
  //     assert.equal(expectedOwnerBalance.toString(), ownerBalanceAfter.toString());
  //   });

  // });
})
