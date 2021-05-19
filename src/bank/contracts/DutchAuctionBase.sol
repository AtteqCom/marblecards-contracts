// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./TokenPriceable.sol";


/// @title Dutch Auction Base
/// @dev Contains model defining Auction, public variables as reference to nftContract. It is expected that auctioneer is owner of the contract. Dutch auction by wiki - https://en.wikipedia.org/wiki/Dutch_auction. Contract is inspired by https://github.com/nedodn/NFT-Auction and https://github.com/dapperlabs/cryptokitties-bounty/tree/master/contracts/Auction/
/// @notice Contract omits a fallback function to prevent accidental eth transfers.
contract DutchAuctionBase is
  ERC165,
  TokenPriceable
{

  using SafeMath for uint128;
  using SafeMath for uint256;
  using Address for address;

  /// @dev Structure holding information about an auction
  /// @param seller Address of person who placed NFT to auction
  /// @param startingPrice Price (in MBC wei) at the beginning of the auction
  /// @param endingPrice Price (in MBC wei) at the end of the auction
  /// @param duration Duration (in seconds) of the auction when the price is dynamic
  /// @param startedAt Time when the auction started
  /// @param delayedCancel Determine if the seller can cancel auction during the dynamic part of the auction
  struct Auction {
    address seller;
    uint128 startingPrice;
    uint128 endingPrice;
    uint64 duration;
    uint256 startedAt;
    bool delayedCancel;
  }

  /// @notice Owner of the contract is considered as Auctioneer, so it supposed to have some share from successful sale.
  /// @dev Value in between 0-10000 (1% is equal to 100)
  uint16 public auctioneerCut;

  /// @notice Cut representing auctioneers earnings from auction with delayed cancel
  /// @dev Value in between 0-10000 (1% is equal to 100)
  uint16 public auctioneerDelayedCancelCut;

  /// @notice Reference to the NFT contract
  ERC721 public nftContract;

  /// @notice Reference to the MarbleCoin contract
  ERC20 public marbleCoinContract;

  /// @notice Maps token ID to its Auction
  mapping (uint256 => Auction) public tokenIdToAuction;

  /// @notice Event emitted when an auction is created
  /// @param tokenId ID of the token which is auctioned
  /// @param seller Address of the user who put the NFT to the auction
  /// @param startingPrice Starting price of the auction in MBC wei
  /// @param endingPrice Ending price of the auction in MBC wei
  /// @param duration Duration of the dynamic part of the auction
  /// @param delayedCancel Specifies, whether the auction can be canceled durign its dynamic price part
  event AuctionCreated(uint256 tokenId, address seller, uint256 startingPrice, uint256 endingPrice, uint256 duration, bool delayedCancel);

  /// @notice Event emitted when an auction ends successfully (i.e. someone won the auction)
  /// @param tokenId ID of the token in the auction
  /// @param totalPrice Price paid by the winner of the auction in MBC wei
  /// @param winner Address of the winner of the auction
  event AuctionSuccessful(uint256 tokenId, uint256 totalPrice, address winner);

  /// @notice Event emitted when an auction is canceled
  /// @param tokenId ID of the token whose auction was canceled
  event AuctionCancelled(uint256 tokenId);

  /// @dev Creates new auction for the given NFT and fires AuctionCreated event.
  /// @param _tokenId ID of the NFT token
  /// @param _auction Auction to create
  function _addAuction(uint256 _tokenId, Auction memory _auction) 
    internal 
    virtual
  {
    require(_auction.duration >= 1 minutes, "Duration of the dynamic part of the auction has to be at least one minute");

    tokenIdToAuction[_tokenId] = _auction;

    emit AuctionCreated(
        _tokenId,
        _auction.seller,
        uint256(_auction.startingPrice),
        uint256(_auction.endingPrice),
        uint256(_auction.duration),
        _auction.delayedCancel
    );
  }

  /// @dev Cancels auction of the given NFT and transfers the token to the seller address
  /// @param _tokenId ID of the NFT
  function _cancelAuction(uint256 _tokenId) 
    internal 
  {
    Auction storage auction = tokenIdToAuction[_tokenId];
    address _seller = auction.seller;
    _removeAuction(_tokenId);

    nftContract.transferFrom(address(this), _seller, _tokenId);
    emit AuctionCancelled(_tokenId);
  }

  /// @dev Places bid on an auction
  /// @param _tokenId ID of the NFT
  /// @param _offer value in MBC wei representing which the buyer is willing to pay for the NFT
  /// @param _bidder address of the user who is bidding on the auction
  function _bid(uint256 _tokenId, uint256 _offer, address _bidder)
    internal
  {
    Auction storage auction = tokenIdToAuction[_tokenId];
    require(_isOnAuction(auction), "Can not place the bid. NFT is not on an auction!");

    uint256 price = _currentPrice(auction);
    require(_offer >= price, "Bid amount has to be higher than or equal to the current price!");

    // Remove the auction before sending the fees to the sender so we can't have a reentrancy attack.
    address auctionSeller = auction.seller;
    bool delayedCancel = auction.delayedCancel;
    _removeAuction(_tokenId);

    if (price > 0) {
      // Calculate the auctioneer's cut.
      uint256 auctioneerRevenue = _computeCut(price, delayedCancel);
      uint256 sellerRevenue = price.sub(auctioneerRevenue);

      _pay(marbleCoinContract, price, _bidder, address(this), "Auctioneer's cut from Marble Dutch Auction");
      marbleCoinContract.increaseAllowance(address(erc20Bank), sellerRevenue);
      erc20Bank.deposit(marbleCoinContract, sellerRevenue, auctionSeller, "Seller's cut from Marble Dutch Auction");
    }

    emit AuctionSuccessful(_tokenId, price, _bidder);
  }

  /// @dev Returns true if the auction is valid
  /// @param _auction Auction to check
  function _isOnAuction(Auction storage _auction)
    internal
    view
    returns (bool)
  {
      return (_auction.seller != address(0));
  }

  /// @dev Returns true if the auction is in its dynamic price phase
  /// @param _auction Auction to check.
  function _durationIsOver(Auction storage _auction)
    internal
    view
    returns (bool)
  {
      uint256 secondsPassed = 0;
      secondsPassed = block.timestamp.sub(_auction.startedAt);

      // TODO - what about 30 seconds of tolerated difference of miners clocks??
      return (secondsPassed >= _auction.duration);
  }

  /// @dev Returns current price of the given auction in MBC wei
  /// @param _auction Auction to whose current price is to be computed
  function _currentPrice(Auction storage _auction)
    internal
    view
    returns (uint256)
  {
    uint256 secondsPassed = 0;

    if (block.timestamp > _auction.startedAt) {
        secondsPassed = block.timestamp.sub(_auction.startedAt);
    }

    if (secondsPassed >= _auction.duration) {
        // End of dynamic part of auction.
        return _auction.endingPrice;
    } else {
        // Note - working with int256 not with uint256!! Delta can be negative.
        int256 totalPriceChange = int256(_auction.endingPrice) - int256(_auction.startingPrice);
        int256 currentPriceChange = totalPriceChange * int256(secondsPassed) / int256(_auction.duration);
        int256 currentPrice = int256(_auction.startingPrice) + currentPriceChange;

        return uint256(currentPrice);
    }
  }

  /// @dev Computes auctioneer's cut from a sale
  /// @param _price Sale price of NFT
  /// @param _isCancelDelayed Determines what kind of cut is used for calculation
  function _computeCut(uint256 _price, bool _isCancelDelayed)
    internal
    view
    returns (uint256)
  {

    if (_isCancelDelayed) {
      return _price * auctioneerDelayedCancelCut / 10000;
    }

    return _price * auctioneerCut / 10000;
  }

  /// @dev Removes auction from the given NFT
  /// @param _tokenId ID of the NFT
   function _removeAuction(uint256 _tokenId)
     internal
     virtual
   {
     delete tokenIdToAuction[_tokenId];
   }
}
