const MarbleCandidate = artifacts.require("./MarbleNFTCandidate.sol");
const MarbleBank = artifacts.require("./MarbleBank.sol");
const MarbleBankAuthorization = artifacts.require("./MarbleBankWithdrawAuthorization.sol");
const RmbcSeller = artifacts.require('./RmbcSeller.sol');

const config = require('../config');

module.exports = async function(deployer) {
  // const mintingPriceEth = config.CANDIDATE_MINIMAL_PRICE;
  const mintingPriceEth = "5000000000000000";

  const candidate = await MarbleCandidate.deployed();
  const bank = await MarbleBank.deployed();
  const bankWithdrawAuthorization = await MarbleBankAuthorization.deployed();

  await candidate.setBankContract(bank.address);
  await candidate.setMinimalPrice(mintingPriceEth)
  await bank.addAffiliate(candidate.address);
  await bank.setWithdrawAuthorization(bankWithdrawAuthorization.address);
};
