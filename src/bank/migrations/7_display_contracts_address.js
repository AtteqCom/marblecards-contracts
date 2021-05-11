const MarbleCandidate = artifacts.require("./MarbleNFTCandidate.sol");
const MarbleBank = artifacts.require("./MarbleBank.sol");
const MarbleBankAuthorization = artifacts.require("./MarbleBankWithdrawAuthorization.sol");
const RmbcSeller = artifacts.require('./RmbcSeller.sol');

module.exports = async function(deployer,network) {
  if (network === 'matic' || network === 'mumbai') {
    const candidate = await MarbleCandidate.deployed();
    const bank = await MarbleBank.deployed();
    const bankWithdrawAuthorization = await MarbleBankAuthorization.deployed();
    console.log(`MarbleNFTCandidate: ${candidate.address}`);
    console.log(`MarbleBank: ${bank.address}`);
    console.log(`MarbleBankWithdrawAuthorization: ${bankWithdrawAuthorization.address}`);
  }
  const rmbcSeller = await RmbcSeller.deployed();

  console.log(`RmbcSeller: ${rmbcSeller.address}`);
};
