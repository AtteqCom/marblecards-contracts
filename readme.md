# Marblegame - Contracts

Contracts supporting marblegame collectibles and other cool stuff

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
    truffle compile
    ```

#### Migration - Ganache

1. Ganache should be listening on 7545 if u did not change truffle configuration than just run
    ```
    truffle migrate
    ```

#### Migration - Ropsten

To deploy contract over Ropsten network we have to set up account over geth node unlock it and call truffle

1. Run docker containers needed to deploy contracts
    ```
    docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml build
    docker-compose -f docker-compose.yml -f docker-compose.ropsten.yml up
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

8. Migrate script to Ropsten network
    ```
    # npm run clean

    truffle migrate --network ropsten
    ```

#### Test - Ganache

1. Enter builder container.
    ```
    docker-compose exec builder bash
    ```

2. Run tests. Expecting 6 unlocked wallets. 1st wallet over node is consider as owner of contracts.
    ```
    truffle test ./test/contracts/marbleIntegrityTest.js
    truffle test ./test/contracts/marbleCandidateTest.js
    truffle test ./test/contracts/marbleNFTTest.js
    truffle test ./test/contracts/marbleMintingAuctionTest.js
    truffle test ./test/contracts/marbleAuctionTest.js
    truffle test ./test/contracts/marbleFactoryTest.js
    ```
