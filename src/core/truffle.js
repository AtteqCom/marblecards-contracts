const HDWalletProvider = require("truffle-hdwallet-provider"); // WEB3.one

require('dotenv').config();  // Store environment-specific variable from '.env' to process.env

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "ganache",
      port: 8545,
      network_id: "*",
    },
    ropsten: {
      network_id: 3,
      host: "geth",
      port: 8545,
      gasPrice: 1,
      gas: 6012388
    },
    mainnet: { // must be a web3-1.0.0, otherwise truffle commands may hang in CI
      provider: () => new HDWalletProvider(process.env.WALLET_PASSWORD, "https://mainnet.infura.io/v3/" + process.env.INFRURA_KEY_MAINNET),
      network_id: '1',
      gasPrice: 60000000000,
      gas: 901238
    },
    mumbai: { // must be a web3-1.0.0, otherwise truffle commands may hang in CI
      provider: () => new HDWalletProvider(process.env.WALLET_MNEMONIC, "https://rpc-mumbai.matic.today"),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    // If you're using an HDWalletProvider, it must be Web3 1.0 enabled or your migration will hang.
    infuraRopsten: {
      provider: () =>
        // must be a web3-1.0.0, otherwise truffle commands may hang in CI
        new HDWalletProvider(process.env.WALLET_MNEMONIC, "https://ropsten.infura.io/v3/" + process.env.INFURA_KEY, 0, 6),
      network_id: '3'
    },
    infuraRopstenTest: {
      // must be a web3-1.0.0, otherwise truffle commands may hang in CI
      provider: () =>
        new HDWalletProvider(process.env.WALLET_PASSWORDS.split(","), "https://ropsten.infura.io/v3/" + process.env.INFURA_KEY, 0, 6),
      network_id: '3'
    }
  },
  compilers: {
    solc: {
      version: "0.4.24",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
