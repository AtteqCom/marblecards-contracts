const RmbcSeller = artifacts.require("./RmbcSeller.sol");
const logger = require('../utils/logger');
const truffleAssert = require('truffle-assertions');
const [dragonslayer, demonhunter] = require("../utils/actors.js");
const zeroAddress = '0x0000000000000000000000000000000000000000';

contract("RmbcSeller", accounts => {
  let sellerContract;
  const owner = accounts[0];

  dragonslayer.account = accounts[1];
  demonhunter.account = accounts[2];

  before(async () => {
    sellerContract = await RmbcSeller.new();
  })

  describe("payChainCurrency function", () => {

    it("emits correct event", async () => {
      const sentEthAmount = 226;
      const expectedRmbcAmount = 11;
  
      await sellerContract.setMinimalPaidAmount(sentEthAmount);
      const response = await sellerContract.payChainCurrency(expectedRmbcAmount, { from: owner, value: sentEthAmount });
  
      truffleAssert.eventEmitted(response, 'ChainCurrencyPaid', { 
        fromAddress: owner, paidAmount: web3.utils.toBN(sentEthAmount), expectedRmbcAmount: web3.utils.toBN(expectedRmbcAmount)
      });
    });

    it("reverts when payment under minimal price", async () => {
      const minimalAmount = 100;

      await sellerContract.setMinimalPaidAmount(minimalAmount);

      await truffleAssert.reverts(
        sellerContract.payChainCurrency(10, { from: owner, value: minimalAmount - 1 }),
        "Not enough Ether provided.",
      )
    });
  });

  describe("setMinimalPaidAmount function", () => {
    it("reverts when not owner tries to change minimal price", async () => {
      await truffleAssert.reverts(
        sellerContract.setMinimalPaidAmount(10, { from: dragonslayer.account }),
        ""
      )
    })
  });

  describe("withdraw function", () => {
    it("actually withdraws the chain currency", async () => {
      await sellerContract.setMinimalPaidAmount(10);
      const previousOwnerBalance = web3.utils.toBN(await web3.eth.getBalance(owner));
      
      await sellerContract.payChainCurrency(10, { from: demonhunter.account, value: 26 })
      await sellerContract.payChainCurrency(10, { from: demonhunter.account, value: 53 })
      await sellerContract.payChainCurrency(10, { from: dragonslayer.account, value: 51 })
      await sellerContract.payChainCurrency(10, { from: demonhunter.account, value: 13 })

      const contractBalance = web3.utils.toBN(await web3.eth.getBalance(sellerContract.address));

      const withdrawReceipt = await sellerContract.withdrawBalance({ from: owner });
      const gasUsed = withdrawReceipt.receipt.gasUsed;
      const gasPrice = (await web3.eth.getTransaction(withdrawReceipt.tx)).gasPrice;
      const gasCost = web3.utils.toBN(gasUsed * gasPrice);

      const currentOwnerBalance = web3.utils.toBN(await web3.eth.getBalance(owner));
      const expectedOwnerBalance = previousOwnerBalance.sub(gasCost).add(contractBalance)

      assert.equal(currentOwnerBalance.toString(), expectedOwnerBalance.toString());
    });

    it("reverts when called from non owner account", async () => {
      await truffleAssert.reverts(
        sellerContract.withdrawBalance({ from: dragonslayer.account }),
        ""
      )
    })
  })

});
