// const MarbleMetatransactions = artifacts.require("./MarbleMetatransactions.sol");

// const MarbleNFTFactory = artifacts.require("MarbleNFTFactory");
// const waffle = require('ethereum-waffle');

// // const MarbleNFTFactoryAbi = require("../../externalABI/marbleNFTFactory.abi.js");

// const MarbleNFT = artifacts.require("MarbleNFT");

// const Doppelganger = require('ethereum-doppelganger');
// // import Doppelganger from 'ethereum-doppelganger';
// // const ERC20 = artifacts.require("./ERC20Token.sol");

// const logger = require('../utils/logger');
// const truffleAssert = require('truffle-assertions');

// // const [dragonslayer, demonhunter] = require("../utils/actors.js");


// contract("MarbleMetatransactions", accounts => {
  
//   let erc20Token;
//   let metatransactionsContract;

//   let mockFactoryContract;
//   let marbleNFTFactoryAbi = [  {    "constant": true,    "inputs": [      {        "name": "_interfaceID",        "type": "bytes4"      }    ],    "name": "supportsInterface",    "outputs": [      {        "name": "",        "type": "bool"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": true,    "inputs": [      {        "name": "",        "type": "uint256"      }    ],    "name": "adminList",    "outputs": [      {        "name": "",        "type": "address"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": false,    "inputs": [      {        "name": "adminAddress",        "type": "address"      }    ],    "name": "removeAdmin",    "outputs": [      {        "name": "index",        "type": "uint256"      }    ],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "constant": true,    "inputs": [      {        "name": "adminAddress",        "type": "address"      }    ],    "name": "isAdmin",    "outputs": [      {        "name": "isIndeed",        "type": "bool"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": true,    "inputs": [],    "name": "marbleNFTCandidateContract",    "outputs": [      {        "name": "",        "type": "address"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": false,    "inputs": [],    "name": "unpause",    "outputs": [      {        "name": "",        "type": "bool"      }    ],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "constant": false,    "inputs": [],    "name": "claimOwnership",    "outputs": [],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "constant": true,    "inputs": [],    "name": "paused",    "outputs": [      {        "name": "",        "type": "bool"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": true,    "inputs": [],    "name": "marbleNFTContract",    "outputs": [      {        "name": "",        "type": "address"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": false,    "inputs": [      {        "name": "adminAddress",        "type": "address"      }    ],    "name": "addAdmin",    "outputs": [      {        "name": "index",        "type": "uint256"      }    ],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "constant": false,    "inputs": [],    "name": "pause",    "outputs": [      {        "name": "",        "type": "bool"      }    ],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "constant": true,    "inputs": [],    "name": "owner",    "outputs": [      {        "name": "",        "type": "address"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": true,    "inputs": [],    "name": "marbleDutchAuctionContract",    "outputs": [      {        "name": "",        "type": "address"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": true,    "inputs": [],    "name": "lastMintedNFTId",    "outputs": [      {        "name": "",        "type": "uint256"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": true,    "inputs": [],    "name": "pendingOwner",    "outputs": [      {        "name": "",        "type": "address"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": true,    "inputs": [      {        "name": "",        "type": "address"      }    ],    "name": "adminsMap",    "outputs": [      {        "name": "",        "type": "uint256"      }    ],    "payable": false,    "stateMutability": "view",    "type": "function"  },  {    "constant": false,    "inputs": [      {        "name": "_newOwner",        "type": "address"      }    ],    "name": "transferOwnership",    "outputs": [],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "inputs": [      {        "name": "_lastMintedNFTId",        "type": "uint256"      }    ],    "payable": false,    "stateMutability": "nonpayable",    "type": "constructor"  },  {    "anonymous": false,    "inputs": [      {        "indexed": true,        "name": "_creator",        "type": "address"      },      {        "indexed": true,        "name": "_tokenId",        "type": "uint256"      }    ],    "name": "MarbleNFTCreated",    "type": "event"  },  {    "anonymous": false,    "inputs": [      {        "indexed": true,        "name": "_tokenId",        "type": "uint256"      },      {        "indexed": true,        "name": "_owner",        "type": "address"      },      {        "indexed": true,        "name": "_creator",        "type": "address"      }    ],    "name": "MarbleNFTBurned",    "type": "event"  },  {    "anonymous": false,    "inputs": [],    "name": "Pause",    "type": "event"  },  {    "anonymous": false,    "inputs": [],    "name": "Unpause",    "type": "event"  },  {    "anonymous": false,    "inputs": [      {        "indexed": true,        "name": "previousOwner",        "type": "address"      },      {        "indexed": true,        "name": "newOwner",        "type": "address"      }    ],    "name": "OwnershipTransferred",    "type": "event"  },  {    "constant": false,    "inputs": [      {        "name": "_lastMintedNFTId",        "type": "uint256"      }    ],    "name": "setLastMintedNFTId",    "outputs": [],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "constant": false,    "inputs": [      {        "name": "_address",        "type": "address"      }    ],    "name": "setMarbleDutchAuctionContract",    "outputs": [],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "constant": false,    "inputs": [      {        "name": "_address",        "type": "address"      }    ],    "name": "setNFTContract",    "outputs": [],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "constant": false,    "inputs": [      {        "name": "_address",        "type": "address"      }    ],    "name": "setCandidateContract",    "outputs": [],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "constant": false,    "inputs": [      {        "name": "_uri",        "type": "string"      },      {        "name": "_metadataUri",        "type": "string"      },      {        "name": "_candidateUri",        "type": "string"      },      {        "name": "_auctionStartingPrice",        "type": "uint256"      },      {        "name": "_auctionMinimalPrice",        "type": "uint256"      },      {        "name": "_auctionDuration",        "type": "uint256"      }    ],    "name": "mint",    "outputs": [],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  },  {    "constant": false,    "inputs": [      {        "name": "_tokenId",        "type": "uint256"      }    ],    "name": "burn",    "outputs": [],    "payable": false,    "stateMutability": "nonpayable",    "type": "function"  }];

//   let mockNftContract;
//   let marbleNFTAbi = `[    {      "constant": true,      "inputs": [        {          "name": "_interfaceID",          "type": "bytes4"        }      ],      "name": "supportsInterface",      "outputs": [        {          "name": "",          "type": "bool"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [],      "name": "name",      "outputs": [        {          "name": "_name",          "type": "string"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "getApproved",      "outputs": [        {          "name": "",          "type": "address"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": false,      "inputs": [        {          "name": "_approved",          "type": "address"        },        {          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "approve",      "outputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "",          "type": "uint256"        }      ],      "name": "adminList",      "outputs": [        {          "name": "",          "type": "address"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": false,      "inputs": [        {          "name": "adminAddress",          "type": "address"        }      ],      "name": "removeAdmin",      "outputs": [        {          "name": "index",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": true,      "inputs": [],      "name": "totalSupply",      "outputs": [        {          "name": "",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": false,      "inputs": [        {          "name": "_from",          "type": "address"        },        {          "name": "_to",          "type": "address"        },        {          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "transferFrom",      "outputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "adminAddress",          "type": "address"        }      ],      "name": "isAdmin",      "outputs": [        {          "name": "isIndeed",          "type": "bool"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "",          "type": "uint256"        }      ],      "name": "sourceUriHashToId",      "outputs": [        {          "name": "",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_owner",          "type": "address"        },        {          "name": "_index",          "type": "uint256"        }      ],      "name": "tokenOfOwnerByIndex",      "outputs": [        {          "name": "",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": false,      "inputs": [        {          "name": "_from",          "type": "address"        },        {          "name": "_to",          "type": "address"        },        {          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "safeTransferFrom",      "outputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": false,      "inputs": [],      "name": "claimOwnership",      "outputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_index",          "type": "uint256"        }      ],      "name": "tokenByIndex",      "outputs": [        {          "name": "",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "ownerOf",      "outputs": [        {          "name": "_owner",          "type": "address"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "",          "type": "uint256"        }      ],      "name": "idToMarbleNFTSource",      "outputs": [        {          "name": "uri",          "type": "string"        },        {          "name": "creator",          "type": "address"        },        {          "name": "created",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": false,      "inputs": [        {          "name": "adminAddress",          "type": "address"        }      ],      "name": "addAdmin",      "outputs": [        {          "name": "index",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_owner",          "type": "address"        }      ],      "name": "balanceOf",      "outputs": [        {          "name": "",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [],      "name": "owner",      "outputs": [        {          "name": "",          "type": "address"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [],      "name": "symbol",      "outputs": [        {          "name": "_symbol",          "type": "string"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": false,      "inputs": [        {          "name": "_operator",          "type": "address"        },        {          "name": "_approved",          "type": "bool"        }      ],      "name": "setApprovalForAll",      "outputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": false,      "inputs": [        {          "name": "_from",          "type": "address"        },        {          "name": "_to",          "type": "address"        },        {          "name": "_tokenId",          "type": "uint256"        },        {          "name": "_data",          "type": "bytes"        }      ],      "name": "safeTransferFrom",      "outputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "tokenURI",      "outputs": [        {          "name": "",          "type": "string"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [],      "name": "pendingOwner",      "outputs": [        {          "name": "",          "type": "address"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "",          "type": "address"        }      ],      "name": "adminsMap",      "outputs": [        {          "name": "",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_owner",          "type": "address"        },        {          "name": "_operator",          "type": "address"        }      ],      "name": "isApprovedForAll",      "outputs": [        {          "name": "",          "type": "bool"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": false,      "inputs": [        {          "name": "_newOwner",          "type": "address"        }      ],      "name": "transferOwnership",      "outputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "inputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "constructor"    },    {      "anonymous": false,      "inputs": [        {          "indexed": true,          "name": "_from",          "type": "address"        },        {          "indexed": true,          "name": "_to",          "type": "address"        },        {          "indexed": true,          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "Transfer",      "type": "event"    },    {      "anonymous": false,      "inputs": [        {          "indexed": true,          "name": "_owner",          "type": "address"        },        {          "indexed": true,          "name": "_approved",          "type": "address"        },        {          "indexed": true,          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "Approval",      "type": "event"    },    {      "anonymous": false,      "inputs": [        {          "indexed": true,          "name": "_owner",          "type": "address"        },        {          "indexed": true,          "name": "_operator",          "type": "address"        },        {          "indexed": false,          "name": "_approved",          "type": "bool"        }      ],      "name": "ApprovalForAll",      "type": "event"    },    {      "anonymous": false,      "inputs": [        {          "indexed": true,          "name": "previousOwner",          "type": "address"        },        {          "indexed": true,          "name": "newOwner",          "type": "address"        }      ],      "name": "OwnershipTransferred",      "type": "event"    },    {      "constant": false,      "inputs": [        {          "name": "_tokenId",          "type": "uint256"        },        {          "name": "_owner",          "type": "address"        },        {          "name": "_creator",          "type": "address"        },        {          "name": "_uri",          "type": "string"        },        {          "name": "_metadataUri",          "type": "string"        },        {          "name": "_created",          "type": "uint256"        }      ],      "name": "mint",      "outputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": false,      "inputs": [        {          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "burn",      "outputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": false,      "inputs": [        {          "name": "_tokenId",          "type": "uint256"        },        {          "name": "_approved",          "type": "address"        }      ],      "name": "forceApproval",      "outputs": [],      "payable": false,      "stateMutability": "nonpayable",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "tokenSource",      "outputs": [        {          "name": "uri",          "type": "string"        },        {          "name": "creator",          "type": "address"        },        {          "name": "created",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_uri",          "type": "string"        }      ],      "name": "tokenBySourceUri",      "outputs": [        {          "name": "tokenId",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_tokenId",          "type": "uint256"        }      ],      "name": "getNFT",      "outputs": [        {          "name": "id",          "type": "uint256"        },        {          "name": "uri",          "type": "string"        },        {          "name": "metadataUri",          "type": "string"        },        {          "name": "owner",          "type": "address"        },        {          "name": "creator",          "type": "address"        },        {          "name": "created",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    },    {      "constant": true,      "inputs": [        {          "name": "_uri",          "type": "string"        }      ],      "name": "getSourceUriHash",      "outputs": [        {          "name": "hash",          "type": "uint256"        }      ],      "payable": false,      "stateMutability": "view",      "type": "function"    }  ]`;

//   const owner = accounts[0];
//   const balin = accounts[1];

//   before(async () => {
//     provider = waffle.createMockProvider(); 
//     [user] = await waffle.getWallets(provider)
//   });

//   beforeEach(async () => {
//     mockFactoryContract = new Doppelganger.default(marbleNFTFactoryAbi);
//     mockNftContract = new Doppelganger.default(marbleNFTAbi);

//     await mockFactoryContract.deploy(user);
//     await mockNftContract.deploy(user);

//     await mockFactoryContract.marbleNFTContract.returns(mockNftContract.address); 
//     await mockNftContract.forceApproval.returns();
//     await mockNftContract.safeTransferFrom.returns();

//     metatransactionsContract = await MarbleMetatransactions.new(mockFactoryContract.address, 2);
//     // erc20Token = await ERC20.new();
//     // await erc20Token.approve(bankContract.address, 10000000000000);
//   });

//   describe("transferNft function", () => {
//     // transferNft(address toAddress, uint256 tokenId)
//     it("actually transfers the nft", async () => {
//       // await mock.givenMethodReturnBool(
//       //   token.contract.methods.transferFrom(0, 0, 0).encodeABI(), 
//       //   true
//       // )

//       await metatransactionsContract.transferNft(owner, 1, mockNftContract.address);
  
//       // assert.equal(await erc20Token.balanceOf(owner), originalTokensAmount - depositAmount);
//       // assert.equal(await erc20Token.balanceOf(bankContract.address), depositAmount);
//     });
//   });

// });
