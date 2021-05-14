const HDWalletProvider = require("@truffle/hdwallet-provider");

require('dotenv').config();  // Store environment-specific variable from '.env' to process.env

module.exports = {
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
    matic: { // must be a web3-1.0.0, otherwise truffle commands may hang in CI
      provider: () => new HDWalletProvider(process.env.WALLET_PASSWORD, "https://rpc-mainnet.maticvigil.com"),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      gasPrice: 1000000000,
      skipDryRun: true
    },
    mumbai: { // must be a web3-1.0.0, otherwise truffle commands may hang in CI
      provider: () => new HDWalletProvider(process.env.WALLET_PASSWORD, "https://rpc-mumbai.matic.today"),
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
    infuraGoerli: {
      provider: () => new HDWalletProvider(process.env.WALLET_MNEMONIC, "https://goerli.infura.io/v3/" + process.env.INFURA_KEY, 0, 6),
      network_id: '5'
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
      version: "0.6.2",
      settings: {
        //Note: The default solc version is *not* set here!
        //It's set in compilerSupplier/index.js in compile-solidity
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  }
};
