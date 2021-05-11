const MarbleBank = artifacts.require("./MarbleBank.sol");
const MarbleBankWithdrawAuthorization = artifacts.require("./MarbleBankWithdrawAuthorization.sol");
const ERC20 = artifacts.require("./MetaCoin.sol");

const logger = require('../utils/logger');
const truffleAssert = require('truffle-assertions');
const assertResponse = require('../utils/assertResponse');

const [dragonslayer, demonhunter] = require("../utils/actors.js");

const zeroAddress = '0x0000000000000000000000000000000000000000';
const noTransaction = { 
  id: web3.utils.toBN(0), 
  from: zeroAddress, 
  to: zeroAddress, 
  affiliateExecuted: zeroAddress, 
  token: zeroAddress, 
  amount: web3.utils.toBN(0), 
  note: ""
}

contract("MarbleBank", accounts => {
  let bankContract;
  let withdrawAuthorizationContract;
  let erc20Token;
  const owner = accounts[0];

  dragonslayer.account = accounts[1];
  demonhunter.account = accounts[2];

  beforeEach(async () => {
    bankContract = await MarbleBank.new();
    withdrawAuthorizationContract = await MarbleBankWithdrawAuthorization.new();
    erc20Token = await ERC20.new();

    await erc20Token.approve(bankContract.address, 10000000000000);
    await bankContract.setWithdrawAuthorization(withdrawAuthorizationContract.address);
  });

  describe("deposit function", () => {
    it("actually transfers the tokens", async () => {
      const originalTokensAmount = (await erc20Token.balanceOf(owner));
      const depositAmount = 100;

      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");

      assert.equal(await erc20Token.balanceOf(owner), originalTokensAmount - depositAmount);
      assert.equal(await erc20Token.balanceOf(bankContract.address), depositAmount);
    });
  
    it("emits correct event", async () => {
      const depositAmount = 200;
      const note = "deposit";
  
      const response = await bankContract.deposit(erc20Token.address, depositAmount, owner, note);
  
      truffleAssert.eventEmitted(response, 'Deposit', { 
        transactionId: web3.utils.toBN(1), from: owner, to: owner, token: erc20Token.address, amount: web3.utils.toBN(depositAmount), note 
      });
    })

    it("stores the transaction", async () => {
      const depositAmount = 335;
      const note = "my test deposit";

      await bankContract.deposit(erc20Token.address, depositAmount, owner, note, { from: owner });

      assertResponse(await bankContract.transactions(1), { 
        id: web3.utils.toBN(1), 
        from: owner, 
        to: owner, 
        affiliateExecuted: zeroAddress, 
        token: erc20Token.address, 
        amount: web3.utils.toBN(depositAmount), 
        note: note
      }, "Deposit transaction stored incorrectly")
      assertResponse(await bankContract.transactions(2), noTransaction, "Later transactions should not exist")
    })
  
    it("reverts on deposit to null address", async () => {
      const depositAmount = 100;

      await truffleAssert.reverts(
        bankContract.deposit(erc20Token.address, depositAmount, zeroAddress, "deposit"),
        "Transaction to null address",
      )
    });

    it("reverts when not enough tokens", async () => {
      const balance = (await erc20Token.balanceOf(owner));
      await truffleAssert.reverts(
        bankContract.deposit(erc20Token.address, balance + 1 , owner, "deposit"), 
        "Not enough tokens"
      );
    })

    it("reverts when paused", async () => {
      const balance = (await erc20Token.balanceOf(owner));
      await bankContract.pause();

      await truffleAssert.reverts(
        bankContract.deposit(erc20Token.address, balance, owner, "deposit"), 
        "Contract is paused"
      );
    })
  })

  describe("deposit function when depositing to someone else's account", () => {
    it("correctly transfers the tokens", async () => {
      const originalOwnerTokensAmount = (await erc20Token.balanceOf(owner));
      const originalDemonhunterTokensAmount = (await erc20Token.balanceOf(demonhunter.account));
      const depositAmount = 26;

      await bankContract.deposit(erc20Token.address, depositAmount, demonhunter.account, "deposit");

      assert.equal(await erc20Token.balanceOf(owner), originalOwnerTokensAmount - depositAmount)
      assert.equal((await erc20Token.balanceOf(demonhunter.account)).toNumber(), originalDemonhunterTokensAmount.toNumber())
      assert.equal(await erc20Token.balanceOf(bankContract.address), depositAmount);
    })

    it("emits correct event", async () => {
      const depositAmount = 200;
      const note = "deposit";
  
      const response = await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, note, { from: owner });
  
      truffleAssert.eventEmitted(response, 'Deposit', { 
        transactionId: web3.utils.toBN(1), from: owner, to: dragonslayer.account, token: erc20Token.address, amount: web3.utils.toBN(depositAmount), note 
      });
    })

    it("stores the transaction", async () => {
      const depositAmount = 333;
      const note = "depo depo deposit";

      await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, note, { from: owner });

      assertResponse(await bankContract.transactions(1), { 
        id: web3.utils.toBN(1), 
        from: owner, 
        to: dragonslayer.account, 
        affiliateExecuted: zeroAddress, 
        token: erc20Token.address, 
        amount: web3.utils.toBN(depositAmount), 
        note: note
      }, "Deposit transaction stored incorrectly")
      assertResponse(await bankContract.transactions(2), noTransaction, "Later transactions should not exist")
    })

    it("reverts when not enough tokens", async () => {
      const balance = (await erc20Token.balanceOf(owner));
      await truffleAssert.reverts(
        bankContract.deposit(erc20Token.address, balance + 1, demonhunter.account, "deposit", { from: owner }), 
        "Not enough tokens"
      );
    })

    it("reverts when paused", async () => {
      const balance = (await erc20Token.balanceOf(owner));
      await bankContract.pause();

      await truffleAssert.reverts(
        bankContract.deposit(erc20Token.address, balance, demonhunter.account, "deposit", { from: owner }), 
        "Contract is paused"
      );
    })

  })

  describe("withdraw function", () => {
    it("actually transfers the tokens to owner", async () => {
      const originalTokensAmount = (await erc20Token.balanceOf(owner));
      const depositAmount = 10;
      const withdrawAmount = 5;
  
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      await withdrawAuthorizationContract.addToWhitelist(owner);
      await bankContract.withdraw(erc20Token.address, withdrawAmount, "withdraw");
  
      assert.equal(await erc20Token.balanceOf(owner), originalTokensAmount - depositAmount + withdrawAmount);
      assert.equal(await erc20Token.balanceOf(bankContract.address), depositAmount - withdrawAmount);
    })
  
    it("actually transfers all tokens to the owner when all tokens are requested", async () => {
      const originalTokensAmount = (await erc20Token.balanceOf(owner));
      const depositAmount = 17;
      const withdrawAmount = 17;
  
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      await withdrawAuthorizationContract.addToWhitelist(owner);
      await bankContract.withdraw(erc20Token.address, withdrawAmount, "withdraw");
  
      assert.equal(await erc20Token.balanceOf(owner), originalTokensAmount - depositAmount + withdrawAmount);
      assert.equal(await erc20Token.balanceOf(bankContract.address), depositAmount - withdrawAmount);
    })
  
    it("emits correct event", async () => {
      const depositAmount = 45;
      const withdrawAmount = 20;
      const note = "withdraw";
  
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      await withdrawAuthorizationContract.addToWhitelist(owner);
      const response = await bankContract.withdraw(erc20Token.address, withdrawAmount, note);
  
      truffleAssert.eventEmitted(response, 'Withdrawal', { 
        transactionId: web3.utils.toBN(2), user: owner, token: erc20Token.address, amount: web3.utils.toBN(withdrawAmount), note 
      });
    })

    it("stores the transaction", async () => {
      const depositAmount = 666;
      const depositNote = "deposit the devil";
      const withdrawAmount = 444;
      const withdrawNote = "withdraw";

      await bankContract.deposit(erc20Token.address, depositAmount, owner, depositNote);
      await withdrawAuthorizationContract.addToWhitelist(owner);
      await bankContract.withdraw(erc20Token.address, withdrawAmount, withdrawNote);

      assertResponse(await bankContract.transactions(1), { 
        id: web3.utils.toBN(1),
        from: owner, 
        to: owner, 
        affiliateExecuted: zeroAddress, 
        token: erc20Token.address, 
        amount: web3.utils.toBN(depositAmount), 
        note: depositNote
      }, "Deposit transaction stored incorrectly")
      assertResponse(await bankContract.transactions(2), { 
        id: web3.utils.toBN(2),
        from: bankContract.address,
        to: owner,
        affiliateExecuted: zeroAddress,
        token: erc20Token.address,
        amount: web3.utils.toBN(withdrawAmount), 
        note: withdrawNote
      }, "Withdraw transaction stored incorrectly")
      assertResponse(await bankContract.transactions(3), noTransaction, "Later transactions should not exist")
    })
  
    it("reverts when not enough tokens deposited", async () => {
      const depositAmount = 50;
      const withdrawAmount = 51;
  
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      await withdrawAuthorizationContract.addToWhitelist(owner);

      await truffleAssert.reverts(
        bankContract.withdraw(erc20Token.address, withdrawAmount, "withdraw"), 
        "Not enough tokens"
      );
    })

    it("reverts when not authorized to withdraw tokens", async () => {
      const depositAmount = 50;

      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      
      // NOTE: by default, no address is authorized to withdraw untill the authorization is given explicitly
      await truffleAssert.reverts(
        bankContract.withdraw(erc20Token.address, depositAmount, "withdraw"), 
        "Withdraw not authorized"
      );
    })

    it("reverts when paused", async () => {
      const depositAmount = 10;
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      await withdrawAuthorizationContract.addToWhitelist(owner);

      await bankContract.pause();

      await truffleAssert.reverts(
        bankContract.withdraw(erc20Token.address, 1, "withdraw"), 
        "Contract is paused"
      );
    })

  })
  
  describe("pay function", () => {
    it("actually transfers the tokens", async () => {
      const depositAmount = 32;
      const payAmount = 15;
  
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      await bankContract.pay(erc20Token.address, payAmount, dragonslayer.account, "test payment");
  
      assert.equal(await erc20Token.balanceOf(dragonslayer.account), payAmount);
      assert.equal(await erc20Token.balanceOf(bankContract.address), depositAmount - payAmount);
    })
  
    it("actually transfers all the tokens, when paying with all tokens", async () => {
      const amount = 125;
  
      await bankContract.deposit(erc20Token.address, amount, owner, "deposit");
      await bankContract.pay(erc20Token.address, amount, dragonslayer.account, "test payment");
  
      assert.equal(await erc20Token.balanceOf(dragonslayer.account), amount);
      assert.equal(await erc20Token.balanceOf(bankContract.address), 0);
    })
  
    it("emits correct event", async () => {
      const depositAmount = 20;
      const payAmount = 17;
      const note = "test payment";
  
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
      const response = await bankContract.pay(erc20Token.address, payAmount, dragonslayer.account, note, { from: owner });
  
      truffleAssert.eventEmitted(response, 'Payment', { 
        transactionId: web3.utils.toBN(2), from: owner, to: dragonslayer.account, token: erc20Token.address, 
        amount: web3.utils.toBN(payAmount), note, affiliate: zeroAddress,
      });
    })

    it("stores the transaction", async () => {
      const depositAmount = 126;
      const depositNote = "deposit some $$";
      const payAmount = 106;
      const payNote = "pay aliments";

      await bankContract.deposit(erc20Token.address, depositAmount, owner, depositNote);
      await bankContract.pay(erc20Token.address, payAmount, dragonslayer.account, payNote, { from: owner });

      assertResponse(await bankContract.transactions(1), { 
        id: web3.utils.toBN(1),
        from: owner, 
        to: owner, 
        affiliateExecuted: zeroAddress, 
        token: erc20Token.address, 
        amount: web3.utils.toBN(depositAmount), 
        note: depositNote
      }, "Deposit transaction stored incorrectly")
      assertResponse(await bankContract.transactions(2), { 
        id: web3.utils.toBN(2),
        from: owner,
        to: dragonslayer.account,
        affiliateExecuted: zeroAddress,
        token: erc20Token.address,
        amount: web3.utils.toBN(payAmount), 
        note: payNote
      }, "Payment transaction stored incorrectly")
      assertResponse(await bankContract.transactions(3), noTransaction, "Later transactions should not exist")
    })

    it("reverts on pay to null address", async () => {
      await bankContract.deposit(erc20Token.address, 1, owner, "deposit");

      await truffleAssert.reverts(
        bankContract.pay(erc20Token.address, 1, zeroAddress, "test payment"), 
        "Transaction to null address"
      );
    });
  
    it("reverts when not enough tokens deposited", async () => {
      const depositAmount = 20;
      const payAmount = 25;
  
      await bankContract.deposit(erc20Token.address, depositAmount, owner, "deposit");
  
      await truffleAssert.reverts(
        bankContract.pay(erc20Token.address, payAmount, dragonslayer.account, "test payment"), 
        "Not enough tokens"
      );
    })

    it("reverts when paused", async () => {
      const payAmount = 106;
      await bankContract.deposit(erc20Token.address, payAmount, owner, "deposit");
      await bankContract.pay(erc20Token.address, payAmount, dragonslayer.account, "pay", { from: owner });
      await bankContract.pause();

      await truffleAssert.reverts(
        bankContract.pay(erc20Token.address, payAmount, dragonslayer.account, "test payment"), 
        "Contract is paused"
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
      await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, "deposit", { from: dragonslayer.account });
      await bankContract.addAffiliate(owner);
  
      await bankContract.payByAffiliate(erc20Token.address, payAmount, dragonslayer.account, demonhunter.account, "pay by aff test")
  
      assert.equal(await erc20Token.balanceOf(dragonslayer.account), originalAmount - depositAmount);
      assert.equal(await erc20Token.balanceOf(demonhunter.account), payAmount);
    });
  
    it("emits correct event", async () => {
      const depositAmount = 40;
      const payAmount = 12;
      const note = "pay by aff test";
      await erc20Token.transfer(dragonslayer.account, 100, { from: owner })
      await erc20Token.approve(bankContract.address, 10000000000000, { from: dragonslayer.account });
      await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, "deposit", { from: dragonslayer.account });
      await bankContract.addAffiliate(owner);
  
      const result = await bankContract.payByAffiliate(erc20Token.address, payAmount, dragonslayer.account, demonhunter.account, note);
  
      truffleAssert.eventEmitted(result, 'Payment', { 
        transactionId: web3.utils.toBN(2), from: dragonslayer.account, to: demonhunter.account, token: erc20Token.address, 
        amount: web3.utils.toBN(payAmount), note, affiliate: owner
      });
    });

    it("stores the transaction", async () => {
      const depositAmount = 42;
      const depositNote = "deposit some $$$$$";
      const payAmount = 24;
      const payNote = "pay pay";

      await erc20Token.transfer(dragonslayer.account, 100, { from: owner })
      await erc20Token.approve(bankContract.address, 100, { from: dragonslayer.account });
      await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, depositNote, { from: dragonslayer.account });
      await bankContract.addAffiliate(owner);
      await bankContract.payByAffiliate(erc20Token.address, payAmount, dragonslayer.account, demonhunter.account, payNote, { from: owner });

      assertResponse(await bankContract.transactions(1), { 
        id: web3.utils.toBN(1),
        from: dragonslayer.account, 
        to: dragonslayer.account, 
        affiliateExecuted: zeroAddress, 
        token: erc20Token.address, 
        amount: web3.utils.toBN(depositAmount), 
        note: depositNote
      }, "Deposit transaction stored incorrectly")
      assertResponse(await bankContract.transactions(2), { 
        id: web3.utils.toBN(2),
        from: dragonslayer.account,
        to: demonhunter.account,
        affiliateExecuted: owner,
        token: erc20Token.address,
        amount: web3.utils.toBN(payAmount), 
        note: payNote
      }, "Payment transaction stored incorrectly")
      assertResponse(await bankContract.transactions(3), noTransaction, "Later transactions should not exist")
    })

    it("reverts on pay to null address", async () => {
      const depositAmount = 40;
      const payAmount = 12;
      const note = "pay by aff test";
      await erc20Token.transfer(dragonslayer.account, 100, { from: owner })
      await erc20Token.approve(bankContract.address, 10000000000000, { from: dragonslayer.account });
      await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, "deposit", { from: dragonslayer.account });
      await bankContract.addAffiliate(owner);
  
      await truffleAssert.reverts(
        bankContract.payByAffiliate(erc20Token.address, payAmount, dragonslayer.account, zeroAddress, note), 
        "Transaction to null address"
      );
    });

    it("reverts on pay from null address", async () => {
      const depositAmount = 40;
      const payAmount = 12;
      const note = "pay by aff test";
      await erc20Token.transfer(dragonslayer.account, 100, { from: owner })
      await erc20Token.approve(bankContract.address, 10000000000000, { from: dragonslayer.account });
      await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, "deposit", { from: dragonslayer.account });
      await bankContract.addAffiliate(owner);
  
      await truffleAssert.reverts(
        bankContract.payByAffiliate(erc20Token.address, payAmount, zeroAddress, demonhunter.account, note), 
        "User account does not exist"
      );
    });
  
    it("reverts when not affiliate", async () => {
      const depositAmount = 20;
      await erc20Token.transfer(dragonslayer.account, 100, { from: owner })
      await erc20Token.approve(bankContract.address, 10000000000000, { from: dragonslayer.account });
      await bankContract.deposit(erc20Token.address, depositAmount, dragonslayer.account, "deposit", { from: dragonslayer.account });
  
      await truffleAssert.reverts(
        bankContract.payByAffiliate(erc20Token.address, depositAmount, dragonslayer.account, owner, "pay by aff test"), 
        "Address is not affiliate"
      );
    })

    it("reverts when paused", async () => {
      const payAmount = 12;
      await erc20Token.transfer(dragonslayer.account, payAmount, { from: owner })
      await erc20Token.approve(bankContract.address, 10000000000000, { from: dragonslayer.account });
      await bankContract.deposit(erc20Token.address, payAmount, dragonslayer.account, "deposit", { from: dragonslayer.account });
      await bankContract.addAffiliate(owner);

      await bankContract.pause();

      await truffleAssert.reverts(
        bankContract.payByAffiliate(erc20Token.address, payAmount, dragonslayer.account, owner, "pay by aff test"),   
        "Contract is paused"
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
      
      await withdrawAuthorizationContract.addToWhitelist(owner);
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

    it("reverts null address", async () => {
      await truffleAssert.reverts(
        bankContract.addAffiliate(zeroAddress),
        "Null address cannot be affiliate"
      );
    })

    it("reverts when already affiliate", async () => {
      await bankContract.addAffiliate(dragonslayer.account);
      await truffleAssert.reverts(
        bankContract.addAffiliate(dragonslayer.account),
        "Address is affiliate"
      )
    })

    it("reverts when called from not owner account", async () => {
      await truffleAssert.reverts(
        bankContract.addAffiliate(dragonslayer.account, { from: dragonslayer.account })
      );
    })

    it("reverts when paused", async () => {
      await bankContract.pause();

      await truffleAssert.reverts(
        bankContract.addAffiliate(dragonslayer.account),
        "Contract is paused"
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

    it("reverts when paused", async () => {
      await bankContract.addAffiliate(dragonslayer.account);
      await bankContract.pause();

      await truffleAssert.reverts(
        bankContract.removeAffiliate(dragonslayer.account),
        "Contract is paused"
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

  describe("setWithdrawAuthorization function", () => {
    it("actually changes the contract", async () => {
      const newAuthContract = await MarbleBankWithdrawAuthorization.new();

      assert.notEqual(await bankContract.withdrawAuthorization(), newAuthContract.address, 
        "The initial address should differ from the one to which it is to be changed")
      
      await bankContract.setWithdrawAuthorization(newAuthContract.address);

      assert.equal(await bankContract.withdrawAuthorization(), newAuthContract.address, 
        "The address should be changed to the new contract");
    })

    it("reverts when not called from the owner address", async () => {
      const newAuthContract = await MarbleBankWithdrawAuthorization.new();

      await truffleAssert.reverts(
        bankContract.setWithdrawAuthorization(newAuthContract.address, { from: demonhunter.account })
      )
    })

    it("reverts when paused", async () => {
      const newAuthContract = await MarbleBankWithdrawAuthorization.new();
      await bankContract.pause();

      await truffleAssert.reverts(
        bankContract.setWithdrawAuthorization(newAuthContract.address),
        "Contract is paused"
      );
    })
  })

  describe("pause unpause functions", () => {
    it("actually pauses the contract", async () => {
      await bankContract.pause();

      const isPaused = await bankContract.paused();

      assert.equal(isPaused, true, "Paused should be true");
    })

    it("actually unpauses the contract", async () => {
      await bankContract.pause();
      assert.equal(true, await bankContract.paused(), "Paused should be true");
      await bankContract.unpause();

      const isPaused = await bankContract.paused();

      assert.equal(isPaused, false, "Paused should be false");
    })

    it("reverts when pause called from non owner", async () => {
      await truffleAssert.reverts(
        bankContract.pause({from: demonhunter.account}),
        "Ownable: caller is not the owner"
      );
    })
    
    it("reverts when unpause called from non owner", async () => {
      await truffleAssert.reverts(
        bankContract.unpause({from: demonhunter.account}),
        "Ownable: caller is not the owner"
      );
    })
  })

  describe("transferToNewBank function", () => {
    it("actually transfers the money", async () => {
      const amount = 1000;
      const newBank = await MarbleBank.new();

      await bankContract.deposit(erc20Token.address, amount, demonhunter.account, "deposit", {from: owner});

      assert.equal(await bankContract.userBalance(erc20Token.address, demonhunter.account), amount, 
        `The initial balance in old bank should be ${amount}`);
      assert.equal(await newBank.userBalance(erc20Token.address, demonhunter.account), 0, 
        "The balance in new bank should be 0 initially");

      await bankContract.pause();
      await bankContract.transferToNewBank(erc20Token.address, demonhunter.account, newBank.address, {from: owner})

      assert.equal(await bankContract.userBalance(erc20Token.address, demonhunter.account), 0, 
        `The balance in old bank should be 0 after the transfer`);
      assert.equal(await newBank.userBalance(erc20Token.address, demonhunter.account), amount, 
        `The balance in new bank should be ${amount} after the transfer`);
      assert.equal(await erc20Token.balanceOf(newBank.address), amount, 
        `The new bank's balance should be ${amount} after the transfer`);
    });

    it("reverts when contract not paused", async () => {
      await truffleAssert.reverts(
        bankContract.transferToNewBank(erc20Token.address, owner, bankContract.address, {from: owner}),
        "Contract is not paused"
      )
    });

    it("reverts when called from non owner", async () => {
      await bankContract.pause();
      await truffleAssert.reverts(
        bankContract.transferToNewBank(erc20Token.address, owner, bankContract.address, {from: demonhunter.account}),
        "Ownable: caller is not the owner"
      )
    });

    it("reverts when user's balance is 0", async () => {
      await bankContract.pause();
      await truffleAssert.reverts(
        bankContract.transferToNewBank(erc20Token.address, demonhunter.account, bankContract.address, {from: owner}),
        "Balance of the user is 0"
      )
    });
  });

  describe("withdrawByOwner function", () => {
    it("actually withdraws the mbc", async () => {
      const initialAmount = await erc20Token.balanceOf(owner);
      const sentAmount = 10;

      await erc20Token.transfer(bankContract.address, sentAmount, {from: owner});

      assert.equal(await erc20Token.balanceOf(bankContract.address), sentAmount);

      await bankContract.pause();
      await bankContract.withdrawByOwner(erc20Token.address);

      assert.equal((await erc20Token.balanceOf(owner)).toString(), initialAmount.toString());
      assert.equal(await erc20Token.balanceOf(bankContract.address), 0);
    })

    it("reverts when contract not paused", async () => {
      await truffleAssert.reverts(
        bankContract.withdrawByOwner(erc20Token.address, {from: owner}),
        "Contract is not paused"
      )
    })

    it("revertes when called from non owner", async () => {
      await truffleAssert.reverts(
        bankContract.withdrawByOwner(erc20Token.address, {from: demonhunter.account}),
        "Ownable: caller is not the owner"
      )
    })
  })
  
});