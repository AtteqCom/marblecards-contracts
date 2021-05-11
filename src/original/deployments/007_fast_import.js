const fs = require("fs");
const csv = require("fast-csv");

const stream = fs.createReadStream("export.csv");

// https://github.com/axieinfinity/truffle-deploy/
const assert = require('assert');


csv.fromStream(stream)
 .on("data", function(data){
   console.log(data);
 })
 .on("end", function(){
     console.log("done");
 });


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

   nft = await getContract("./MarbleNFT.sol");

 };
