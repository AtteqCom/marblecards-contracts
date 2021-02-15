const MarbleMetatransactions = artifacts.require("./MarbleMetatransactions.sol");
const MarbleCandidate = artifacts.require("./MarbleNFTCandidate.sol");
const MarbleBank = artifacts.require("./MarbleBank.sol");

const config = require('../config');

module.exports = async function(deployer) {
  // const factoryContractAddress = config.MARBLE_FACTORY_CONTRACT_ADDRESS;
  const factoryContractAddress = "0x6BD0b0dfF2CF41C67E26e5B5411A3808f6F62e27";
  // const metatransactionsChain = config.MARBLE_METATRANSACTIONS_CHAIN;
  const metatransactionsChain = 3;
  // const mintingPriceEth = config.CANDIDATE_MINIMAL_PRICE;
  const mintingPriceEth = "5000000000000000";

  await deployer.deploy(MarbleMetatransactions, factoryContractAddress, metatransactionsChain);
  await deployer.deploy(MarbleCandidate);
  await deployer.deploy(MarbleBank);

  const metatransactions = await MarbleMetatransactions.deployed();
  const candidate = await MarbleCandidate.deployed();
  const bank = await MarbleBank.deployed();

  await candidate.setBankContract(bank.address);
  await candidate.setMetatransactionsContract(metatransactions.address)
  await candidate.setMinimalPrice(mintingPriceEth)
  await bank.addAffiliate(candidate.address);
  await bank.addAffiliate(metatransactions.address);
  
  // TODO: factory->setCandidate(candidate)
  // TODO: candidate->setTokenPrice(token, price)
  // TODO: nft->addAdmin(metatransactions)
};
