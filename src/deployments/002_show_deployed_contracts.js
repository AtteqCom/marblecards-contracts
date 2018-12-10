// https://github.com/axieinfinity/truffle-deploy/
const assert = require('assert');

module.exports = async ({ accounts, artifacts, deployer, logger, network, web3 }) => {

  var tools = {
    logger: logger,
    deployer: deployer,
    network: network,
    artifacts: artifacts,
    accounts: accounts
  };

  let nft, factory, auction, candidate;

  logger.info(`Network - "${network}".`);

  async function getContract(contractPath) {
    var Contract = tools.artifacts.require(contractPath);

    return await Contract.deployed();
  }

  factory = await getContract("./MarbleNFTFactory.sol");
  nft = await getContract("./MarbleNFT.sol");
  candidate = await getContract("./MarbleNFTCandidate.sol");
  auction = await getContract("./MarbleDutchAuction.sol");

  logger.info(`-- CONTRACTS ------------------------------------`);
  logger.info(`NFT: "${nft.address}".`);
  logger.info(`Factory: "${factory.address}".`);
  logger.info(`Auction: "${auction.address}".`);
  logger.info(`Candidate: "${candidate.address}".`);
  logger.info(`-------------------------------------------------`);

  logger.info(`-- STATUS ---------------------------------------`);
  logger.info(`Factory Last ID: ${await factory.lastMintedNFTId()}`);
  logger.info(`NFT total: ${await nft.totalSupply()}`);
  logger.info(`Candidates total: ${await candidate.getCandidatesCount()}`);
  logger.info(`Auctions total: ${await auction.totalAuctions()}`);
  logger.info(`-------------------------------------------------`);

  logger.info(`-- BALANCE --------------------------------------`);
  logger.info(`Auction: ${await web3.eth.getBalance(auction.address)}`);
  logger.info(`Owner: ${await web3.eth.getBalance(await nft.owner())}`);
  logger.info(`Candidate: ${await web3.eth.getBalance(candidate.address)}`);
};
