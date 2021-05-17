const MarbleCandidate = artifacts.require("./MarbleNFTCandidate.sol");
const MarbleBank = artifacts.require("./MarbleBank.sol");
const MarbleBankAuthorization = artifacts.require("./MarbleBankWithdrawAuthorization.sol");

module.exports = async function(deployer, network) {
  // const mintingPriceEth = config.CANDIDATE_MINIMAL_PRICE;
  if (!(network === 'matic' || network === 'mumbai')) {
    console.log(`Network NOT supported "${network}"`);
    return;
  }

  const mintingPriceEth = "5000000000000000";

  console.log('GET deployed contracts');
  const candidate = await MarbleCandidate.deployed();
  const bank = await MarbleBank.deployed();
  const bankWithdrawAuthorization = await MarbleBankAuthorization.deployed();

  console.log('SET bank address to candidate contract');
  await candidate.setBankContract(bank.address);
  console.log('SET minimal minting price to candidate contract');
  await candidate.setMinimalPrice(mintingPriceEth)
  console.log('SET candidate as bank admin');
  await bank.addAffiliate(candidate.address);
  console.log('SET bank withdraw authorization contract to bank contract');
  await bank.setWithdrawAuthorization(bankWithdrawAuthorization.address);
};
