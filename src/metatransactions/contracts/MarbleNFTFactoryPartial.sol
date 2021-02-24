// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


import "./MarbleNFTCandidateInterface.sol";

contract MarbleNFTFactoryPartial {

  MarbleNFTCandidateInterface public marbleNFTCandidateContract;

  constructor(MarbleNFTCandidateInterface candidateContract)
  {
    marbleNFTCandidateContract = candidateContract;
  }

}