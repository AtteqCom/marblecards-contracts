// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


/// @dev Partial interface of the MarbleDutchAuction contract to easen our work with it
abstract contract MarbleDutchAuction {
  function createAuctionByMetatransaction(uint256 _tokenId, uint256 _startingPrice, uint256 _endingPrice, uint256 _duration, address _sender) external virtual;
  function bidByMetatransaction(uint256 _tokenId, uint256 _offer, address _offerBy) external virtual;
  function cancelAuctionByMetatransaction(uint256 _tokenId, address _sender) external virtual;
  function getCurrentPrice(uint256 _tokenId) external virtual view returns (uint256);
}
