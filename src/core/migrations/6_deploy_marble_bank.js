var MarbleCandidate = artifacts.require("./MarbleNFTCandidate.sol");
var MarbleBank = artifacts.require("./MarbleBank.sol");


module.exports = async function(deployer) {
  await deployer.deploy(MarbleBank);
  const candidate = await MarbleCandidate.deployed();
  const bank = await MarbleBank.deployed();

  await candidate.setBankContract(bank.address);
  await bank.addAffiliate(candidate.address);
};
