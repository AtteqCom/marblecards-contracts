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

  const CANDIDATE_URL = "https://en.wikipedia.org/wiki/Greta_Thunberg";
  const METADATA_URL = "https://ws.beta.marble.cards/marble/token/3119";

  logger.info(`-- CHECK --------------------------------------`);
  logger.info(`Factory Last ID: ${await factory.lastMintedNFTId()}`);
  logger.info(`GET CANDIDATE:`);
  var _greta_candidate = await candidate.getCandidate(CANDIDATE_URL);
  logger.info(_greta_candidate);
  logger.info(`MINT:`);

  await factory.mint(
    CANDIDATE_URL,
    METADATA_URL,
    CANDIDATE_URL,
    "20000000000000000",
    "10000000000000000",
    (24*60*60) + ""
  );

  var lastMinted = await factory.lastMintedNFTId();

  logger.info(`Factory Last ID: ${await lastMinted}`);
  var total = await nft.totalSupply();
  var model = await nft.getNFT(await nft.tokenByIndex(total -1));

  logger.info(model.id + "");

};
