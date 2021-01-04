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

  let nft, factory, auction, candidate, start, end;

  logger.info(`Network - "${network}".`);

  async function getContract(contractPath) {
    var Contract = tools.artifacts.require(contractPath);

    return await Contract.deployed();
  }

  factory = await getContract("./MarbleNFTFactory.sol");
  nft = await getContract("./MarbleNFT.sol");
  candidate = await getContract("./MarbleNFTCandidate.sol");
  auction = await getContract("./MarbleDutchAuction.sol");


  logger.info(`Factory Last ID: ${await factory.lastMintedNFTId()}`);

  await factory.setLastMintedNFTId(2973);
  logger.info(`Factory Last ID: ${await factory.lastMintedNFTId()}`);

};
