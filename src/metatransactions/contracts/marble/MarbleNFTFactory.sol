// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;

import "./MarbleNFT.sol";
import "./MarbleNFTCandidate.sol";
import "./MarbleDutchAuction.sol";


/// @dev Partial interface of the MarbleNFTFactory contract so that we can easily work with it
abstract contract MarbleNFTFactory {
  MarbleNFT public marbleNFTContract;
  MarbleNFTCandidate public marbleNFTCandidateContract;
  MarbleDutchAuction public marbleDutchAuctionContract;
}
