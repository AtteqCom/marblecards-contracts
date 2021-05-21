pragma solidity ^0.4.24;

import "./DutchAuctionBase.sol";

/**
 * @title Extension of Auction Base (core). Allows to enumarate auctions.
 * @dev It's highly inspired by https://github.com/0xcert/ethereum-erc721/blob/master/contracts/tokens/NFTokenEnumerable.sol
 */
contract DutchAuctionEnumerable
  is DutchAuctionBase
{

  // array of tokens in auction
  uint256[] public tokens;

  /**
   * @dev Mapping from token ID its index in global tokens array.
   */
  mapping(uint256 => uint256) public tokenToIndex;

  /**
   * @dev Mapping from owner to list of owned NFT IDs in this auction.
   */
  mapping(address => uint256[]) public sellerToTokens;

  /**
   * @dev Mapping from NFT ID to its index in the seller tokens list.
   */
  mapping(uint256 => uint256) public tokenToSellerIndex;

  /**
   * @dev Adds an auction to the list of open auctions. Also fires the
   *  AuctionCreated event.
   * @param _token The ID of the token to be put on auction.
   * @param _auction Auction to add.
   */
  function _addAuction(uint256 _token, Auction _auction)
    internal
  {
    super._addAuction(_token, _auction);

    uint256 length = tokens.push(_token);
    tokenToIndex[_token] = length - 1;

    length = sellerToTokens[_auction.seller].push(_token);
    tokenToSellerIndex[_token] = length - 1;
  }

  /*
   * @dev Removes an auction from the list of open auctions.
   * @param _token - ID of NFT on auction.
   */
  function _removeAuction(uint256 _token)
    internal
  {
    assert(tokens.length > 0);

    Auction memory auction = tokenIdToAuction[_token];
    // auction has to be defined
    assert(auction.seller != address(0));
    assert(sellerToTokens[auction.seller].length > 0);

    uint256 sellersIndexOfTokenToRemove = tokenToSellerIndex[_token];

    uint256 lastSellersTokenIndex = sellerToTokens[auction.seller].length - 1;
    uint256 lastSellerToken = sellerToTokens[auction.seller][lastSellersTokenIndex];

    sellerToTokens[auction.seller][sellersIndexOfTokenToRemove] = lastSellerToken;
    sellerToTokens[auction.seller].length--;

    tokenToSellerIndex[lastSellerToken] = sellersIndexOfTokenToRemove;
    tokenToSellerIndex[_token] = 0;

    uint256 tokenIndex = tokenToIndex[_token];
    assert(tokens[tokenIndex] == _token);

    // Sanity check. This could be removed in the future.
    uint256 lastTokenIndex = tokens.length - 1;
    uint256 lastToken = tokens[lastTokenIndex];

    tokens[tokenIndex] = lastToken;
    tokens.length--;

    // nullify token index reference
    tokenToIndex[lastToken] = tokenIndex;
    tokenToIndex[_token] = 0;

    super._removeAuction(_token);
  }


  /**
   * @dev Returns the count of all existing auctions.
   */
  function totalAuctions()
    external
    view
    returns (uint256)
  {
    return tokens.length;
  }

  /**
   * @dev Returns NFT ID by its index.
   * @param _index A counter less than `totalSupply()`.
   */
  function tokenInAuctionByIndex(
    uint256 _index
  )
    external
    view
    returns (uint256)
  {
    require(_index < tokens.length);
    // Sanity check. This could be removed in the future.
    assert(tokenToIndex[tokens[_index]] == _index);
    return tokens[_index];
  }

  /**
   * @dev returns the n-th NFT ID from a list of owner's tokens.
   * @param _seller Token owner's address.
   * @param _index Index number representing n-th token in owner's list of tokens.
   */
  function tokenOfSellerByIndex(
    address _seller,
    uint256 _index
  )
    external
    view
    returns (uint256)
  {
    require(_index < sellerToTokens[_seller].length);
    return sellerToTokens[_seller][_index];
  }

  /**
   * @dev Returns the count of all existing auctions.
   */
  function totalAuctionsBySeller(
    address _seller
  )
    external
    view
    returns (uint256)
  {
    return sellerToTokens[_seller].length;
  }
}
