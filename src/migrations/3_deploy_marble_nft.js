var MarbleNFT = artifacts.require("./MarbleNFT.sol");
var MarbleNFTLib = artifacts.require("./MarbleNFTLib.sol");
var MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");

module.exports = async function(deployer) {
  var nftAddress;
  var candidateAddress;

  await deployer.deploy(MarbleNFT);
  var _marbleNFT = await MarbleNFT.deployed();
  var _marbleNFTFactory =  await MarbleNFTFactory.deployed();

  await _marbleNFTFactory.setNFTContract(_marbleNFT.address);
  await _marbleNFT.addAdmin(_marbleNFTFactory.address);

};
