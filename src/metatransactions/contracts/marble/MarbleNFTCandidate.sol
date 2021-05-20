// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;

import "./MarbleBank.sol";


/// @dev Partial interface of the MarbleNFTCandidate contract so that we can easily work with it
abstract contract MarbleNFTCandidate {
  MarbleBank public erc20Bank;
  function createCandidateWithERC20ForUser(string calldata _uri, address _erc20, address _owner) external virtual returns(uint256 index);
}
