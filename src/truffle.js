module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "ganache",
      port: 7545,
      network_id: "*",
      //gasPrice: 1,
      //gas: 9000000,
    },
    ropsten: {
      network_id: 3,
      host: "geth",
      port: 8545,
      from: "0x3C47f1DeE211caA7616102042EF9BE18Da858574",
      gasPrice: 1,
      gas: 6012388
    }
  },
  rpc: {
    host: 'localhost',
    post:8080
  },
/*  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }*/
};
