# MarbleCards - Contracts

Contracts handling [Marble.cards](https://beta.marble.cards) collectibles and other stuff.

### Setup .env
  Truffle.js is expecting env variables for running correctly. Change out values in *~/src/sample.env* and rename it to  *~/src/.env*
  ```
    WALLET_PASSWORDS = <ur psswds>
    WALLET_MNEMONIC = <ur mnemonic>
    INFURA_KEY = <ur infura key>
    LOG = <true | false>
  ```

### Docker

1. Run `docker-compose build` in root directory of repository.
2. `docker-compose up`

There is no exposed ports. All we need is located over linked volumes.

### Building contracts

1. Follow docker instruction to have ready all dev tools you need.

2. To build the contracts get into builder image:
    ```
    docker-compose exec builder bash
    ```

3. Use truffle to build it. Result will be in *~/build/contracts* folder.
    ```
    npx truffle compile
    ```

#### Migration - Ganache

1. Ganache should be listening on 7545 if u did not change truffle configuration than just run
    ```
    npx truffle migrate
    ```

#### Migration - Ropsten (via Geth node)

To deploy contract over Ropsten network we have to set up account over geth node unlock it and call truffle

1. Run docker containers needed to deploy contracts
    ```
    docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml build
    docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml up -d
    ```

2. Create *delete.me* file containing your private key

3. Get into geth image.
    ```
    docker-compose  -f ./docker-compose.yml -f ./docker-compose.ropsten.yml exec geth /bin/sh
    ```

4. Import account
    ```
    geth --testnet account import /docker-entrypoint/delete.me
    ```

5. Open get console
    ```
    geth attach ~/.ethereum/testnet/geth.ipc
    ```

6. Unlock account (geth console). if u don't see imported account, then restart geth container.
    ```
    personal.unlockAccount(eth.accounts[0], undefined, 2200)
    ```

7. Go to console of image where is truffle installed
    ```
    docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml exec builder bash
    ```

8. Migrate script to Ropsten network via infrura
    ```
    # npm run clean

    npx truffle migrate --network infuraRopsten
    ```

#### Migration - Ropsten (via Infura)

To deploy contract over Ropsten network we have to set up account over geth node unlock it and call truffle

1. Create *.env* add *WALLET_MNEMONIC* and *INFURA_KEY*

    ```
    WALLET_MNEMONIC = ...
    INFURA_KEY = ...
    ```

2. Run docker containers needed to deploy contracts
    ```
    docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml build
    docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml up -d
    docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml exec builder bash
    ```

3. Migrate script to Ropsten network via infrura
    ```
    # npm run clean

    npx truffle migrate --network infuraRopsten
    ```

    #### Migration - Ropsten (via Infura)

    To deploy contract over Ropsten network we have to set up account over geth node unlock it and call truffle

    1. Create *.env* add *WALLET_MNEMONIC* and *INFURA_KEY*

        ```
        WALLET_MNEMONIC = ...
        INFURA_KEY = ...
        ```

    2. Run docker containers needed to deploy contracts
        ```
        docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml build
        docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml up -d
        docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml exec builder bash
        ```

    3. Migrate script to Ropsten network via infrura
        ```
        # npm run clean

        npx truffle migrate --network infuraRopsten
        ```
4. Migrate script to Ropsten network via infrura

  1-2. Steps same as above

  3. Migrate script to Mainnet network via infrura
      ```
      # npm run clean

      npx truffle migrate --network mainnet
      ```

#### Test - Ganache

1. Enter builder container.
    ```
    docker-compose exec builder bash
    ```

2. Run tests. Expecting 6 unlocked wallets. 1st wallet over node is consider as owner of contracts.
    ```
    npx truffle test ./test/contracts/marbleIntegrityTest.js
    npx truffle test ./test/contracts/marbleCandidateTest.js
    npx truffle test ./test/contracts/marbleNFTTest.js
    npx truffle test ./test/contracts/marbleMintingAuctionTest.js
    npx truffle test ./test/contracts/marbleAuctionTest.js
    npx truffle test ./test/contracts/marbleNFTFactoryTest.js
    ```

#### Test - Ropsten

1. Enter builder container.
    ```
    docker-compose exec builder bash
    ```

2. Run tests. Expecting 6 unlocked wallets. Their PKs should be provided in *./src/.env* !!! DO NOT COMMIT THEM :))) !!!
    ```
    npx truffle test --network infuraRopstenTest ./test/contracts/marbleIntegrityTest.js
    npx truffle test --network infuraRopstenTest ./test/contracts/marbleCandidateTest.js
    npx truffle test --network infuraRopstenTest ./test/contracts/marbleNFTTest.js
    npx truffle test --network infuraRopstenTest ./test/contracts/marbleMintingAuctionTest.js
    npx truffle test --network infuraRopstenTest ./test/contracts/marbleAuctionTest.js
    npx truffle test --network infuraRopstenTest ./test/contracts/marbleNFTFactoryTest.js
    ```

#### Extra utils/deployments scripts


*Copy NFTs to newly deployed contracts* it's neccessery to provide original factory contract
    ```
    npx truffle-deploy --network infuraRopsten ./deployments/001_copy_marbles.js
    ```

*Check deployed contracts* (over Ropsten via infura)
    ```
    npx truffle-deploy --network infuraRopsten ./deployments/002_show_deployed_contracts.js
    ```
*Show all candidates* (over Ropsten via infura)
    ```
    npx truffle-deploy --network infuraRopsten ./deployments/003_show_candidates.js
    ```

*Mint one NFT* (over Ropsten via infura)
    ```
    npx truffle-deploy --network infuraRopsten ./deployments/004_mint_one.js
    ```

*Set new last minted ID* (over Ropsten via infura)
    ```
    npx truffle-deploy --network infuraRopsten ./deployments/005_set_last_minted_id.js
    ```

*Temporary playground* (over Ropsten via infura)
    ```
    npx truffle-deploy --network infuraRopsten ./deployments/006_temp.js
    ```
