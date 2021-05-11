module.exports = [
    {
      "constant": false,
      "inputs": [
        {
          "name": "_marbleId",
          "type": "uint256"
        },
        {
          "name": "_startingPrice",
          "type": "uint256"
        },
        {
          "name": "_endingPrice",
          "type": "uint256"
        },
        {
          "name": "_duration",
          "type": "uint256"
        }
      ],
      "name": "createAuction",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_marbleId",
          "type": "uint256"
        },
        {
          "name": "_startingPrice",
          "type": "uint256"
        },
        {
          "name": "_endingPrice",
          "type": "uint256"
        },
        {
          "name": "_duration",
          "type": "uint256"
        },
        {
          "name": "_mintingFee",
          "type": "uint256"
        },
        {
          "name": "_seller",
          "type": "address"
        }
      ],
      "name": "createMintingAuction",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "cancelAuction",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "bid",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "getCurrentPrice",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "totalAuctions",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_index",
          "type": "uint256"
        }
      ],
      "name": "tokenInAuctionByIndex",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_seller",
          "type": "address"
        },
        {
          "name": "_index",
          "type": "uint256"
        }
      ],
      "name": "tokenOfSellerByIndex",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_seller",
          "type": "address"
        }
      ],
      "name": "totalAuctionsBySeller",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "isOnAuction",
      "outputs": [
        {
          "name": "isIndeed",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "getAuction",
      "outputs": [
        {
          "name": "seller",
          "type": "address"
        },
        {
          "name": "startingPrice",
          "type": "uint256"
        },
        {
          "name": "endingPrice",
          "type": "uint256"
        },
        {
          "name": "duration",
          "type": "uint256"
        },
        {
          "name": "startedAt",
          "type": "uint256"
        },
        {
          "name": "canBeCanceled",
          "type": "bool"
        },
        {
          "name": "extraFee",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];
