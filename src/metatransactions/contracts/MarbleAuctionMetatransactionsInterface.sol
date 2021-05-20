// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


/// @title Metatransactions support for auction contract of Marble.Cards
interface MarbleAuctionMetatransactionsInterface {

  /// @notice Puts the given NFT on auction If executed by the NFT owner
  /// @param nftId ID of the NFT token to be put on the auction
  /// @param startingPrice Initial price in the auction
  /// @param endingPrice Price at the end of the dynamic price phase of the auction and afterwards
  /// @param duration Duration of the dynamic price phase of the auction
  function startAuction(uint256 nftId, uint256 startingPrice, uint256 endingPrice, uint256 duration)
    external;

  /// @notice Bids on an NFT if it is in an auction
  /// @dev If the bid is high enough, the auction is immediatelly finished and the NFT transfered to the bidder
  /// @param nftId ID of the NFT to bid on
  /// @param offer Bid offer in MBC wei
  function bidAuction(uint256 nftId, uint256 offer)
    external;

  /// @notice Cancels auction on given NFT if issued by the owner and not in the first phase of the initial auction
  /// @param nftId ID of the NFT whose auction is to be canceled
  function cancelAuction(uint256 nftId) 
    external;

  /// @notice Gets current price (in MBC wei) of a given NFT in an auction
  /// @param nftId ID of the queried NFT
  function getAuctionCurrentPrice(uint256 nftId)
    external
    view
    returns(uint256);
  
}