const RmbcSeller = artifacts.require("./RmbcSeller.sol");
const logger = require('../../../core/test/utils/logger');
const truffleAssert = require('truffle-assertions');
const [dragonslayer, demonhunter] = require("../../../core/test/utils/actors.js");
const zeroAddress = '0x0000000000000000000000000000000000000000';

contract("RmbcSeller", accounts => {
  let sellerContract;
  const owner = accounts[0];

  dragonslayer.account = accounts[1];
  demonhunter.account = accounts[2];

  before(async () => {
    sellerContract = await RmbcSeller.new();
  })

  describe("payEth function", () => {

    it("emits correct event", async () => {
      const sentEthAmount = 226;
      const expectedRmbcAmount = 11;
  
      await sellerContract.setMinimalEthAmount(sentEthAmount);
      const response = await sellerContract.payEth(expectedRmbcAmount, { from: owner, value: sentEthAmount });
  
      truffleAssert.eventEmitted(response, 'EthPaid', { 
        fromAddress: owner, ethAmount: web3.utils.toBN(sentEthAmount), expectedRmbcAmount: web3.utils.toBN(expectedRmbcAmount)
      });
    });

    it("reverts when payment under minimal price", async () => {
      const minimalAmount = 100;

      await sellerContract.setMinimalEthAmount(minimalAmount);

      await truffleAssert.reverts(
        sellerContract.payEth(10, { from: owner, value: minimalAmount - 1 }),
        "Not enough Ether provided.",
      )
    });
  });

  describe("setMinimalEthAmoun function", () => {
    it("reverts when not owner tries to change minimal price", async () => {
      await truffleAssert.reverts(
        sellerContract.setMinimalEthAmount(10, { from: dragonslayer.account }),
        ""
      )
    })
  });

  describe("withdraw function", () => {
    it("actually withdraws the ETH", async () => {
      await sellerContract.setMinimalEthAmount(10);
      const previousOwnerBalance = await web3.eth.getBalance(owner);
      
      await sellerContract.payEth(10, { from: demonhunter.account, value: 26 })
      await sellerContract.payEth(10, { from: demonhunter.account, value: 53 })
      await sellerContract.payEth(10, { from: dragonslayer.account, value: 51 })
      await sellerContract.payEth(10, { from: demonhunter.account, value: 13 })

      const contractBalance = await web3.eth.getBalance(sellerContract.address);

      const withdrawReceipt = await sellerContract.withdrawBalance({ from: owner });
      const gasUsed = withdrawReceipt.receipt.gasUsed;
      const gasPrice = (await web3.eth.getTransaction(withdrawReceipt.tx)).gasPrice;
      const gasCost = gasUsed * gasPrice;

      const currentOwnerBalance = await web3.eth.getBalance(owner);

      assert.equal(currentOwnerBalance, parseInt(previousOwnerBalance) - gasCost + parseInt(contractBalance));
    });

    it("reverts when called from non owner account", async () => {
      await truffleAssert.reverts(
        sellerContract.withdrawBalance({ from: dragonslayer.account }),
        ""
      )
    })
  })

});
