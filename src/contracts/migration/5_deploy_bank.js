const RmbcSeller = artifacts.require('./bank/RmbcSeller.sol');
const MarbleBank = artifacts.require("./bank/MarbleBank.sol");
const MarbleBankWithdrawAuthorization = artifacts.require("./bank/MarbleBankWithdrawAuthorization.sol");

const MarbleCandidate = artifacts.require("./marble/MarbleNFTCandidate.sol");

module.exports = async function(deployer) {
  await deployer.deploy(RmbcSeller);
  await deployer.deploy(MarbleBank);
  await deployer.deploy(MarbleBankWithdrawAuthorization);

  const candidate = await MarbleCandidate.deployed();
  const bank = await MarbleBank.deployed();
  const bankWithdrawAuthorization = await MarbleBankAuthorization.deployed();

  console.log('SET bank address to candidate contract');
  await candidate.setBankContract(bank.address);

  console.log('SET candidate as bank admin');
  await bank.addAffiliate(candidate.address);
  console.log('SET bank withdraw authorization contract to bank contract');
  await bank.setWithdrawAuthorization(bankWithdrawAuthorization.address);
};
