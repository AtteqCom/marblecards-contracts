pragma solidity ^0.4.24;

import "@0xcert/ethereum-erc721/contracts/tokens/ERC721.sol";
import "@0xcert/ethereum-utils/contracts/math/SafeMath.sol";
import "@0xcert/ethereum-utils/contracts/utils/SupportsInterface.sol";
import "@0xcert/ethereum-utils/contracts/utils/AddressUtils.sol";

/**
 * @title Dutch Auction Base
 * @dev Contains model defining Auction, public variables as reference to nftContract. It is expected that auctioneer is owner of the contract. Dutch auction by wiki - https://en.wikipedia.org/wiki/Dutch_auction. Contract is inspired by https://github.com/nedodn/NFT-Auction and https://github.com/dapperlabs/cryptokitties-bounty/tree/master/contracts/Auction/
 * @notice Contract omits a fallback function to prevent accidental eth transfers.
 */
contract DutchAuctionBase is
  SupportsInterface
{

  using SafeMath for uint128;
  using SafeMath for uint256;
  using AddressUtils for address;

  // Model of NFt auction
  struct Auction {
      // Address of person who placed NFT to auction
      address seller;

      // Price (in wei) at beginning of auction
      uint128 startingPrice;

      // Price (in wei) at end of auction
      uint128 endingPrice;

      // Duration (in seconds) of auction when price is moving, lets say, it determines dynamic part of auction price creation.
      uint64 duration;

      // Time when auction started, yep 256, we consider ours NFTs almost immortal!!! :)
      uint256 startedAt;

      // Determine if seller can cancel auction before dynamic part of auction ends!  Let have some hard core sellers!!!
      bool delayedCancel;

  }

  // Owner of the contract is considered as Auctioneer, so it supposed to have some share from successful sale.
  // Value in between 0-10000 (1% is equal to 100)
  uint16 public auctioneerCut;

  // Cut representing auctioneers earnings from auction with delayed cancel
  // Value in between 0-10000 (1% is equal to 100)
  uint16 public auctioneerDelayedCancelCut;

  // Reference to contract tracking NFT ownership
  ERC721 public nftContract;

  // Maps Token ID with Auction
  mapping (uint256 => Auction) public tokenIdToAuction;

  event AuctionCreated(uint256 tokenId, address seller, uint256 startingPrice, uint256 endingPrice, uint256 duration, bool delayedCancel);
  event AuctionSuccessful(uint256 tokenId, uint256 totalPrice, address winner);
  event AuctionCancelled(uint256 tokenId);

  /**
   * @dev Adds new auction and fires AuctionCreated event.
   * @param _tokenId NFT ID
   * @param _auction Auction to add.
   */
  function _addAuction(uint256 _tokenId, Auction _auction) internal {
    // Dynamic part of acution hast to be at least 1 minute
    require(_auction.duration >= 1 minutes);

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

  /**
   * @dev Cancels auction and transfer token to provided address
   * @param _tokenId ID of NFT
   */
  function _cancelAuction(uint256 _tokenId) internal {
    Auction storage auction = tokenIdToAuction[_tokenId];
    address _seller = auction.seller;
    _removeAuction(_tokenId);

    // return Token to seller
    nftContract.transferFrom(address(this), _seller, _tokenId);
    emit AuctionCancelled(_tokenId);
  }

  /**
   * @dev Handles bid placemant. If bid is valid then calculates auctioneers cut and sellers revenue.
   * @param _tokenId ID of NFT
   * @param _offer value in wei representing what buyer is willing to pay for NFT
   */
  function _bid(uint256 _tokenId, uint256 _offer)
      internal
  {
      // Get a reference to the auction struct
      Auction storage auction = tokenIdToAuction[_tokenId];
      require(_isOnAuction(auction), "Can not place bid. NFT is not on auction!");

      // Check that the bid is greater than or equal to the current price
      uint256 price = _currentPrice(auction);
      require(_offer >= price, "Bid amount has to be higher or equal than current price!");

      // Put seller address before auction is deleted.
      address seller = auction.seller;

      // Keep auction type even after auction is deleted.
      bool isCancelDelayed = auction.delayedCancel;

      // Remove the auction before sending the fees to the sender so we can't have a reentrancy attack.
      _removeAuction(_tokenId);

      // Transfer revenue to seller
      if (price > 0) {
          // Calculate the auctioneer's cut.
          uint256 computedCut = _computeCut(price, isCancelDelayed);
          uint256 sellerRevenue = price.sub(computedCut);

          /**
           * NOTE: !! Doing a transfer() in the middle of a complex method is dangerous!!!
           * because of reentrancy attacks and DoS attacks if the seller is a contract with an invalid fallback function. We explicitly
           * guard against reentrancy attacks by removing the auction before calling transfer(),
           * and the only thing the seller can DoS is the sale of their own asset! (And if it's an accident, they can call cancelAuction(). )
           */
          seller.transfer(sellerRevenue);
      }

      // Calculate any excess funds included with the bid. Excess should be transfered back to bidder.
      uint256 bidExcess = _offer.sub(price);

      // Return additional funds. This is not susceptible to a re-entry attack because the auction is removed before any transfers occur.
      msg.sender.transfer(bidExcess);

      emit AuctionSuccessful(_tokenId, price, msg.sender);
  }

  /**
   * @dev Returns true if the NFT is on auction.
   * @param _auction - Auction to check.
   */
  function _isOnAuction(Auction storage _auction)
    internal
    view
    returns (bool)
  {
      return (_auction.seller != address(0));
  }

  /**
   * @dev Returns true if auction price is dynamic
   * @param _auction Auction to check.
   */
  function _durationIsOver(Auction storage _auction)
    internal
    view
    returns (bool)
  {
      uint256 secondsPassed = 0;
      secondsPassed = now.sub(_auction.startedAt);

      // TODO - what about 30 seconds of tolerated difference of miners clocks??
      return (secondsPassed >= _auction.duration);
  }

  /**
   * @dev Returns current price of auction.
   * @param _auction Auction to check current price
   */
  function _currentPrice(Auction storage _auction)
    internal
    view
    returns (uint256)
  {
    uint256 secondsPassed = 0;

    if (now > _auction.startedAt) {
        secondsPassed = now.sub(_auction.startedAt);
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

  /**
   * @dev Computes auctioneer's cut of a sale.
   * @param _price - Sale price of NFT.
   * @param _isCancelDelayed - Determines what kind of cut is used for calculation
   */
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

  /*
   * @dev Removes auction from auction list
   * @param _tokenId NFT on auction
   */
   function _removeAuction(uint256 _tokenId)
     internal
   {
     delete tokenIdToAuction[_tokenId];
   }
}
