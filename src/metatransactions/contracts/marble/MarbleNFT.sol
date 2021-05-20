// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


/// @dev Partial interface of the MarbleNFT contract so that we can easily work with it
abstract contract MarbleNFT {
  function forceApproval(uint256 _tokenId, address _approved) external virtual;
  function safeTransferFrom(address from, address to, uint256 tokenId) external virtual;
  function transferFrom(address from, address to, uint256 tokenId) external virtual;
}
