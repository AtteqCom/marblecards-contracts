const MarbleCandidate = artifacts.require("./marble/MarbleNFTCandidate.sol");
const MarbleNFTFactory = artifacts.require("./marble/MarbleNFTFactory.sol");
const MarbleNFT = artifacts.require("./marble/MarbleNFT.sol");
const MarbleNFTLib = artifacts.require("./marble/MarbleNFTLib.sol");
const MarbleNFTFactory = artifacts.require("./marble/MarbleNFTFactory.sol");

module.exports = async function(deployer) {
  await deployer.deploy(MarbleCandidate);
  await deployer.deploy(MarbleNFTFactory, 0);
  await deployer.deploy(MarbleNFT);

  let marbleNftFactory = await MarbleNFTFactory.deployed();
  let marbleNft = await MarbleNFT.deployed();
  let marbleNFTCandidate = await MarbleCandidate.deployed();

  // set relations
  await marbleNftFactory.setNFTContract(marbleNft.address);
  await marbleNFTFactory.setCandidateContract(marbleNFTCandidate.address);

  // add admins
  await marbleNFT.addAdmin(marbleNFTFactory.address);
  await marbleNFTCandidate.addAdmin(marbleNFTFactory.address);
};
