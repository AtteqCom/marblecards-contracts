const MarbleNFTFactory = artifacts.require("./MarbleNFTFactoryPartial.sol");
const MarbleNFTCandidate = artifacts.require("./MarbleNFTCandidate.sol");
const MarbleBank = artifacts.require("./MarbleBank.sol");
const MarbleMetatransactions = artifacts.require("./MarbleMetatransactions.sol");
const ERC20 = artifacts.require("./MetaCoin.sol");

const truffleAssert = require('truffle-assertions');
const assertResponse = require('../utils/assertResponse');

const [james, lars] = require("../utils/actors.js");

const zeroAddress = '0x0000000000000000000000000000000000000000';


contract("MarbleMetatransactions", accounts => {
  
  let bankContract;
  let candidateContract;
  let factoryContract;
  let erc20Token;
  let metatransactionsContract;

  const owner = accounts[0];
  const candidatePrice = 100;
  const ownerBankInitialBalance = 100000;
  const jamesBankInitialBalance = 10000;
  const larsBankInitialBalance = 10;

  before(async () => {
    james.account = accounts[1];
    lars.account = accounts[2];

    bankContract = await MarbleBank.new();
    candidateContract = await MarbleNFTCandidate.new();
    factoryContract = await MarbleNFTFactory.new(candidateContract.address);
    erc20Token = await ERC20.new();
    metatransactionsContract = await MarbleMetatransactions.new(factoryContract.address, "1")

    // set contract references
    await candidateContract.setMetatransactionsContract(metatransactionsContract.address);
    await candidateContract.setMinimalMintingPriceInToken(erc20Token.address, candidatePrice);
    await candidateContract.setBankContract(bankContract.address);

    // set affiliates
    await bankContract.addAffiliate(candidateContract.address);
    await bankContract.addAffiliate(metatransactionsContract.address);

    // deposit tokens to bank for selected wallets
    await erc20Token.increaseAllowance(bankContract.address, ownerBankInitialBalance + jamesBankInitialBalance + larsBankInitialBalance, { from: owner })
    await bankContract.deposit(erc20Token.address, ownerBankInitialBalance, owner, "deposit", { from: owner })
    await bankContract.deposit(erc20Token.address, jamesBankInitialBalance, james.account, "deposit", { from: owner })
    await bankContract.deposit(erc20Token.address, larsBankInitialBalance, lars.account, "deposit", { from: owner })
    
  });

  describe("createPageCandidateWithERC20 function", () => {
    
    it("creates the candidate", async () => {
      const candidateUri = "https://boardgamegeek.com/boardgame/331787/tiny-epic-dungeons";

      await metatransactionsContract.createPageCandidateWithERC20(candidateUri, erc20Token.address, { from: owner });
      const createdCandidate = await candidateContract.getCandidate(candidateUri);

      assertResponse(createdCandidate, {
        index: web3.utils.toBN(0),
        owner: owner,
        mintingPrice: web3.utils.toBN(candidatePrice),
        uri: candidateUri,
      }, "The created candidate is wrong")
    });

    it("emits candidate created event", async () => {
      const candidateUri = "https://boardgamegeek.com/boardgame/193738/great-western-trail"

      const response = await metatransactionsContract.createPageCandidateWithERC20(candidateUri, erc20Token.address, { from: james.account });

      // because the event is not emitted directly by the metatx contract, we need to use this workaround
      let innerTx = await truffleAssert.createTransactionResult(candidateContract, response.tx);

      truffleAssert.eventEmitted(innerTx, 'CandidateCreated', { 
        index: web3.utils.toBN(1), 
        owner: james.account, 
        mintingPrice: web3.utils.toBN(candidatePrice), 
        paidInToken: erc20Token.address, 
        uri: candidateUri,
      });
    });

    it("reverts when not enough tokens in bank", async () => {
      const candidateUri = "https://boardgamegeek.com/boardgame/329465/red-rising"

      await truffleAssert.reverts(
        metatransactionsContract.createPageCandidateWithERC20(candidateUri, erc20Token.address, { from: lars.account }),
        "Not enough tokens in the bank."
      )
    })
  });

  describe("executeBankPayment function", () => {

    it("creates correct transction in bank", async () => {
      const paymentAmount = 26;
      const paymentTo = candidateContract.address;
      const note = "test payment"

      await metatransactionsContract.executeBankPayment(erc20Token.address, paymentAmount, paymentTo, note, { from: james.account });

      // there should be previous transactions from previous tests (deposits, creating candidate)
      const expectedTransactionId = 6;
      assertResponse(
        await bankContract.transactions.call(expectedTransactionId),
        { 
          id: web3.utils.toBN(expectedTransactionId),
          from: james.account,
          to: paymentTo,
          affiliateExecuted: metatransactionsContract.address,
          token: erc20Token.address, 
          amount: web3.utils.toBN(paymentAmount), 
          note: note
        }, 
        "Incorrect transaction stored"
      )
    })

    it("emits transaction event", async () => {
      const paymentAmount = 28;
      const paymentTo = candidateContract.address;
      const note = "test payment 2"

      const response = await metatransactionsContract.executeBankPayment(erc20Token.address, paymentAmount, paymentTo, note, { from: james.account });

      // because the event is not emitted directly by the metatx contract, we need to use this workaround
      let innerTx = await truffleAssert.createTransactionResult(bankContract, response.tx);

      truffleAssert.eventEmitted(innerTx, 'Payment', { 
        transactionId: web3.utils.toBN(7), 
        from: james.account, 
        to: paymentTo, 
        affiliate: metatransactionsContract.address, 
        token: erc20Token.address, 
        amount: web3.utils.toBN(paymentAmount), 
        note: note
      });
    })
  });

  describe("setMarbleFactoryContract function", () => {

    it("actually hanges the contract reference", async () => {
      const artificialAddress = "0x4569E094036304AC7a0F9AA0A5e418915077a544"
      await metatransactionsContract.setMarbleFactoryContract(artificialAddress, { from: owner });

      assert.equal(
        await metatransactionsContract.marbleNFTFactoryContract(),
        artificialAddress,
        "Incorrectly set new factory contract address"
      )

      // revert back for future tests
      await metatransactionsContract.setMarbleFactoryContract(factoryContract.address, { from: owner });
    })

    it("reverts when not called from owner", async () => {
      const artificialAddress = "0x4569E094036304AC7a0F9AA0A5e418915077a544"
      
      await truffleAssert.reverts(
        metatransactionsContract.setMarbleFactoryContract(artificialAddress, { from: lars.account }),
        "Ownable: caller is not the owner"
      )
    });
  })

});
