// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "./DutchAuctionBase.sol";

/// @title Extension of Auction Base (core). Allows to enumarate auctions.
/// @dev It's highly inspired by https://github.com/0xcert/ethereum-erc721/blob/master/contracts/tokens/NFTokenEnumerable.sol
contract DutchAuctionEnumerable
  is DutchAuctionBase
{

  /// @notice Array of tokens in auction
  uint256[] public tokens;

  /// @notice Mapping from token ID to its index in global tokens array
  mapping(uint256 => uint256) public tokenToIndex;

  /// @notice Mapping from owner to the list of owned NFT IDs in an auction
  mapping(address => uint256[]) public sellerToTokens;

  /// @notice Mapping from NFT ID to its index in the seller tokens list
  mapping(uint256 => uint256) public tokenToSellerIndex;

  /// @notice Adds an auction to the list of open auctions. Also fires the AuctionCreated event
  /// @param _token The ID of the token to be put on auction
  /// @param _auction Auction to be created
  function _addAuction(uint256 _token, Auction memory _auction)
    internal
    override
  {
    super._addAuction(_token, _auction);

    tokens.push(_token);
    tokenToIndex[_token] = tokens.length - 1;

    sellerToTokens[_auction.seller].push(_token);
    tokenToSellerIndex[_token] = sellerToTokens[_auction.seller].length - 1;
  }

  /// @notice Removes an auction from the list of open auctions
  /// @param _token ID of NFT on auction to be removed
  function _removeAuction(uint256 _token)
    internal
    override
  {
    require(tokens.length > 0, "No open auction");

    Auction memory auction = tokenIdToAuction[_token];
    require(auction.seller != address(0), "The auction is invalid");
    require(sellerToTokens[auction.seller].length > 0, "The token's auction's seller has no open auctions");

    uint256 sellersIndexOfTokenToRemove = tokenToSellerIndex[_token];

    uint256 lastSellersTokenIndex = sellerToTokens[auction.seller].length - 1;
    uint256 lastSellerToken = sellerToTokens[auction.seller][lastSellersTokenIndex];

    sellerToTokens[auction.seller][sellersIndexOfTokenToRemove] = lastSellerToken;
    sellerToTokens[auction.seller].pop();

    tokenToSellerIndex[lastSellerToken] = sellersIndexOfTokenToRemove;
    tokenToSellerIndex[_token] = 0;

    uint256 tokenIndex = tokenToIndex[_token];
    // Sanity check.
    require(tokens[tokenIndex] == _token, "Incorrectly computed token index");

    // nullify token index reference
    uint256 lastTokenIndex = tokens.length - 1;
    uint256 lastToken = tokens[lastTokenIndex];

    tokens[tokenIndex] = lastToken;
    tokens.pop();

    tokenToIndex[lastToken] = tokenIndex;
    tokenToIndex[_token] = 0;

    super._removeAuction(_token);
  }


  /// @notice Returns the count of all existing auctions
  function totalAuctions()
    public
    virtual
    view
    returns (uint256)
  {
    return tokens.length;
  }

  /// @notice Returns NFT ID by its index
  /// @param _index A counter. Has to be less than `totalSupply()`
  function tokenInAuctionByIndex(
    uint256 _index
  )
    public
    virtual
    view
    returns (uint256)
  {
    require(_index < tokens.length);
    // Sanity check
    assert(tokenToIndex[tokens[_index]] == _index);
    return tokens[_index];
  }

  /// @notice Returns the n-th NFT ID from a list of user's tokens in auction
  /// @param _seller The user address
  /// @param _index Index number representing n-th token in user's list of tokens in auction
  function tokenOfSellerByIndex(
    address _seller,
    uint256 _index
  )
    public
    virtual
    view
    returns (uint256)
  {
    require(_index < sellerToTokens[_seller].length);
    return sellerToTokens[_seller][_index];
  }

  /// @notice Returns the count of all existing auctions.
  function totalAuctionsBySeller(
    address _seller
  )
    public
    virtual
    view
    returns (uint256)
  {
    return sellerToTokens[_seller].length;
  }
}
