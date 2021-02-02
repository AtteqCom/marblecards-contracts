const MarbleBank = artifacts.require("./MarbleBank.sol");
const ERC20 = artifacts.require("./MetaCoin.sol");

const logger = require('../../../core/test/utils/logger');
const truffleAssert = require('truffle-assertions');

const [dragonslayer, demonhunter] = require("../../../core/test/utils/actors.js");


contract("MarbleBank", accounts => {
  let bankContract;
  let erc20Token;
  const owner = accounts[0];

  dragonslayer.account = accounts[1];
  demonhunter.account = accounts[2];

  beforeEach(async () => {
    bankContract = await MarbleBank.new();
    erc20Token = await ERC20.new();
    await erc20Token.approve(bankContract.address, 10000000000000);
  });

  describe("deposit function", () => {
    it("actually transfers the tokens", async () => {
      const originalTokensAmount = (await erc20Token.balanceOf(owner)).toNumber();
      const depositAmount = 100;

      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");

      assert.equal(await erc20Token.balanceOf(owner), originalTokensAmount - depositAmount);
      assert.equal(await erc20Token.balanceOf(bankContract.address), depositAmount);
    });
  
    it("emits correct event", async () => {
      const depositAmount = 200;
  
      const response = await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
  
      truffleAssert.eventEmitted(response, 'Deposit', { transactionId: web3.utils.toBN(1), from: owner, to: owner, token: erc20Token.address, amount:  web3.utils.toBN(depositAmount) });
    })
  
    it("reverts when not enough tokens", async () => {
      const balance = (await erc20Token.balanceOf(owner)).toNumber();
      await truffleAssert.reverts(
        bankContract.deposit(erc20Token.address, balance + 1, owner, "deposit"), 
        "Not enough tokens"
      );
    })
  })

  describe("withdraw function", () => {
    it("actually transfers the tokens to owner", async () => {
      const originalTokensAmount = (await erc20Token.balanceOf(owner)).toNumber();
      const depositAmount = 10;
      const withdrawAmount = 5;
  
      // to be correct, we shouldn't call this function, but mock the bank contract to think that the user has deposited the given amount
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      await bankContract.withdraw(erc20Token.address, withdrawAmount, "withdraw");
  
      assert.equal(await erc20Token.balanceOf(owner), originalTokensAmount - depositAmount + withdrawAmount);
      assert.equal(await erc20Token.balanceOf(bankContract.address), depositAmount - withdrawAmount);
    })
  
    it("actually transfers all tokens to the owner when all tokens are requested", async () => {
      const originalTokensAmount = (await erc20Token.balanceOf(owner)).toNumber();
      const depositAmount = 17;
      const withdrawAmount = 17;
  
      // to be correct, we shouldn't call this function, but mock the bank contract to think that the user has deposited the given amount
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      await bankContract.withdraw(erc20Token.address, withdrawAmount, "withdraw");
  
      assert.equal(await erc20Token.balanceOf(owner), originalTokensAmount - depositAmount + withdrawAmount);
      assert.equal(await erc20Token.balanceOf(bankContract.address), depositAmount - withdrawAmount);
    })
  
    it("emits correct event", async () => {
      const depositAmount = 45;
      const withdrawAmount = 20;
  
      // to be correct, we shouldn't call this function, but mock the  bank contract to think that the user has deposited the given amount
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      const response = await bankContract.withdraw(erc20Token.address, withdrawAmount, "withdraw");
  
      truffleAssert.eventEmitted(response, 'Withdrawal', { transactionId: web3.utils.toBN(2), user: owner, token: erc20Token.address, amount:  web3.utils.toBN(withdrawAmount) });
    })
  
    it("reverts when not enough tokens deposited", async () => {
      const depositAmount = 50;
      const withdrawAmount = 51;
  
      // to be correct, we shouldn't call this function, but mock the bank contract to think that the user has deposited the given amount
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      await truffleAssert.reverts(
        bankContract.withdraw(erc20Token.address, withdrawAmount, "withdraw"), 
        "Not enough tokens"
      );
    })
  })
  
  describe("pay function", () => {
    it("actually transfers the tokens", async () => {
      const depositAmount = 32;
      const payAmount = 15;
  
      // to be correct, we shouldn't call this function, but mock the bank contract to think that the user has deposited the given amount
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      await bankContract.pay(erc20Token.address, payAmount, dragonslayer.account, "test payment");
  
      assert.equal(await erc20Token.balanceOf(dragonslayer.account), payAmount);
      assert.equal(await erc20Token.balanceOf(bankContract.address), depositAmount - payAmount);
    })
  
    it("actually transfers all the tokens, when paying with all tokens", async () => {
      const amount = 125;
  
      // to be correct, we shouldn't call this function, but mock the bank contract to think that the user has deposited the given amount
      await bankContract.deposit(erc20Token.address, amount, owner, "deposit");
      await bankContract.pay(erc20Token.address, amount, dragonslayer.account, "test payment");
  
      assert.equal(await erc20Token.balanceOf(dragonslayer.account), amount);
      assert.equal(await erc20Token.balanceOf(bankContract.address), 0);
    })
  
    it("emits correct event", async () => {
      const depositAmount = 20;
      const payAmount = 17;
  
      // to be correct, we shouldn't call this function, but mock the bank contract to think that the user has deposited the given amount
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      const response = await bankContract.pay(erc20Token.address, payAmount, dragonslayer.account, "test payment");
  
      truffleAssert.eventEmitted(response, 'Payment', { transactionId: web3.utils.toBN(2), from: owner, to: dragonslayer.account, token: erc20Token.address, amount: web3.utils.toBN(payAmount) });
    })
  
    it("reverts when not enough tokens deposited", async () => {
      const depositAmount = 20;
      const payAmount = 25;
  
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
  
      await truffleAssert.reverts(
        bankContract.pay(erc20Token.address, payAmount, dragonslayer.account, "test payment"), 
        "Not enough tokens"
      );
    })
  })
  
  describe("payByAffiliate function", () => {
    it("actually transfers tokens correctly", async () => {
      const originalAmount = 100;
      const depositAmount = 40;
      const payAmount = 12;
      await erc20Token.transfer(dragonslayer.account, originalAmount, { from: owner })
      await erc20Token.approve(bankContract.address, 10000000000000, { from: dragonslayer.account });
      // to be correct, we shouldn't call this function, but mock the bank contract to think that the user has deposited the given amount
      await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, "deposit", { from: dragonslayer.account });
      await bankContract.addAffiliate(owner);
  
      await bankContract.payByAffiliate(erc20Token.address, payAmount, dragonslayer.account, demonhunter.account, "pay by aff test")
  
      assert.equal(await erc20Token.balanceOf(dragonslayer.account), originalAmount - depositAmount);
      assert.equal(await erc20Token.balanceOf(demonhunter.account), payAmount);
    });
  
    it("emits correct event", async () => {
      const depositAmount = 40;
      const payAmount = 12;
      await erc20Token.transfer(dragonslayer.account, 100, { from: owner })
      await erc20Token.approve(bankContract.address, 10000000000000, { from: dragonslayer.account });
      // to be correct, we shouldn't call this function, but mock the bank contract to think that the user has deposited the given amount
      await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, "deposit", { from: dragonslayer.account });
      await bankContract.addAffiliate(owner);
  
      const result = await bankContract.payByAffiliate(erc20Token.address, payAmount, dragonslayer.account, demonhunter.account, "pay by aff test");
  
      truffleAssert.eventEmitted(result, 'Payment', { transactionId: web3.utils.toBN(2), from: dragonslayer.account, to: demonhunter.account, token: erc20Token.address, amount: web3.utils.toBN(payAmount) });
    });
  
    it("reverts when not affiliate", async () => {
      const depositAmount = 20;
      await erc20Token.transfer(dragonslayer.account, 100, { from: owner })
      await erc20Token.approve(bankContract.address, 10000000000000, { from: dragonslayer.account });
      // to be correct, we shouldn't call this function, but mock the bank contract to think that the user has deposited the given amount
      await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, "deposit", { from: dragonslayer.account });
  
      await truffleAssert.reverts(
        bankContract.payByAffiliate(erc20Token.address, depositAmount, dragonslayer.account, owner, "pay by aff test"), 
        "User is not affiliate"
      );
    })
  })

  describe("hasEnoughTokens function", () => {
    it("returns true if user has enough tokens", async () => {
      const depositAmount = 20;
      const requestAmount = 10;
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");

      const result = await bankContract.hasEnoughTokens(erc20Token.address, requestAmount, owner);

      assert.isTrue(result);
    })

    it("returns false if user has enough tokens", async () => {
      const depositAmount = 20;
      const requestAmount = 30;
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");

      const result = await bankContract.hasEnoughTokens(erc20Token.address, requestAmount, owner);

      assert.isFalse(result);
    })

    it("returns false when user does not have account", async () => {
      const result = await bankContract.hasEnoughTokens(erc20Token.address, 10, owner);
      assert.isFalse(result);
    })

    it("returns false when user does not have account for the given token", async () => {
      const notTokenAddress = "0xaa9f842497ea9e55D4F756dA3cf00CfDB9AeD437";
      await bankContract.deposit(erc20Token.address, 20, owner, "deposit");

      const result = await bankContract.hasEnoughTokens(notTokenAddress, 10, owner);

      assert.isFalse(result);
    })
  })

  describe("userBalance function", () => {
    it("returns correct amount after deposits", async () => {
      await bankContract.deposit(erc20Token.address, 20, owner, "deposit 1");
      const result1 = await bankContract.userBalance(erc20Token.address, owner);
      assert.equal(result1, 20)
      
      await bankContract.deposit(erc20Token.address, 15, owner, "deposit 2");
      const result2 = await bankContract.userBalance(erc20Token.address, owner);
      assert.equal(result2, 35)
    })

    it("returns correct amount after withdrawal", async () => {
      await bankContract.deposit(erc20Token.address, 20, owner, "deposit");
      const result1 = await bankContract.userBalance(erc20Token.address, owner);
      assert.equal(result1, 20)
      
      await bankContract.withdraw(erc20Token.address, 15, "withdraw");
      const result2 = await bankContract.userBalance(erc20Token.address, owner);
      assert.equal(result2, 5)
    })

    it("returns correct amount after payment", async () => {
      await bankContract.deposit(erc20Token.address, 20, owner, "deposit");
      const result1 = await bankContract.userBalance(erc20Token.address, owner);
      assert.equal(result1, 20)
      
      await bankContract.pay(erc20Token.address, 7, dragonslayer.account, "payment");
      const result2 = await bankContract.userBalance(erc20Token.address, owner);
      assert.equal(result2, 13)
    })

    it("returns 0 user does not have account", async () => {
      const result = await bankContract.userBalance(erc20Token.address, owner);
      assert.equal(result, 0);
    })

    it("returns 0 when user does not have account for the given token", async () => {
      const notTokenAddress = "0xaa9f842497ea9e55D4F756dA3cf00CfDB9AeD437";
      await bankContract.deposit(erc20Token.address, 20, owner, "deposit");

      const result = await bankContract.userBalance(notTokenAddress, owner);

      assert.equal(result, 0);
    })
  })
  
  describe("addAffiliate function", () => {
    it("emits correct event", async () => {
      const result = await bankContract.addAffiliate(dragonslayer.account);
      truffleAssert.eventEmitted(result, "AffiliateAdded", { affiliate: dragonslayer.account });
    })

    it("reverts when already affiliate", async () => {
      await bankContract.addAffiliate(dragonslayer.account);
      await truffleAssert.reverts(
        bankContract.addAffiliate(dragonslayer.account),
        "User is affiliate"
      )
    })

    it("reverts when called from not owner account", async () => {
      await truffleAssert.reverts(
        bankContract.addAffiliate(dragonslayer.account, { from: dragonslayer.account })
      );
    })
  })

  describe("removeAffiliate function", () => {
    it("emits correct event", async () => {
      await bankContract.addAffiliate(dragonslayer.account);

      const result = await bankContract.removeAffiliate(dragonslayer.account);

      truffleAssert.eventEmitted(result, "AffiliateRemoved", { affiliate: dragonslayer.account });
    })

    it("reverts when not affiliate", async () => {
      await truffleAssert.reverts(
        bankContract.removeAffiliate(dragonslayer.account)
      );
    })

    it("reverts when called from not owner account", async () => {
      await bankContract.addAffiliate(dragonslayer.account);

      await truffleAssert.reverts(
        bankContract.removeAffiliate(dragonslayer.account, { from: dragonslayer.account })
      );
    })
  })

  describe("isAffiliate function", () => {
    it("returns false when there are no affiliates", async () => {
      const result = await bankContract.isAffiliate(owner);
      assert.isFalse(result);
    })

    it("returns true if the user is affiliate", async () => {
      await bankContract.addAffiliate(owner);
      const result = await bankContract.isAffiliate(owner);
      assert.isTrue(result);
    })

    it("returns false if the user is not affiliate", async () => {
      await bankContract.addAffiliate(owner);
      const result = await bankContract.isAffiliate(dragonslayer.account);
      assert.isFalse(result);
    })

    it("returns false if the user was affiliate but was removed later", async () => {
      await bankContract.addAffiliate(owner);
      await bankContract.removeAffiliate(owner);
      const result = await bankContract.isAffiliate(owner);
      assert.isFalse(result);
    })
  })
  
});