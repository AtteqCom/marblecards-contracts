// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Marble Dutch Auction Interface
/// @notice Describes all externaly accessible functions neccessery to run Marble Auctions
interface MarbleDutchAuctionInterface {

  /// @notice Sets an addresses of ERC 721 contract owned/admined by same entity.
  /// @param _nftAddress Address of ERC 721 contract
  function setNFTContract(address _nftAddress)
    external;

  /// @notice Creates new auction without special logic. It allows user to sell owned Marble NFTs
  /// @param _tokenId ID of token to be put on the auction, sender must be owner
  /// @param _startingPrice Price of item (in MBC wei) at beginning of the auction
  /// @param _endingPrice Price of item (in MBC wei) at the end of the auction
  /// @param _duration Length if the dynamic phase of the auction (in seconds)
  function createAuction(
    uint256 _tokenId,
    uint256 _startingPrice,
    uint256 _endingPrice,
    uint256 _duration
  )
    external;

  /// @notice Creates new auction without any special logic using metatransaction
  /// @param _tokenId ID of token to auction, sender must be owner
  /// @param _startingPrice Price of the item (in MBC wei) at the beginning of the auction
  /// @param _endingPrice Price of the item (in MBC wei) at the end of the auction
  /// @param _duration Duration of the dynamic price phase of the auction (in seconds)
  /// @param _sender Original sender of the transaction
  function createAuctionByMetatransaction(
    uint256 _tokenId,
    uint256 _startingPrice,
    uint256 _endingPrice,
    uint256 _duration,
    address _sender
  )
    external;

  /// @notice Creates and begins a new minting auction. Minitng auction is initial auction allowing to challenge newly Minted Marble NFT.
  /// If no-one buy NFT during dynamic state of auction, then seller (original creator of NFT) will be allowed to become owner of NFT. It means during dynamic (duration)
  /// state of auction, it won't be possible to use cancelAuction function by seller!
  /// @param _tokenId ID of token to be put on the auction, sender must be owner
  /// @param _startingPrice Price of the item (in MBC wei) at the beginning of the auction
  /// @param _endingPrice Price of the item (in MBC wei) at the end of the auction
  /// @param _duration Length of the dynamic phase of the auction (in seconds)
  /// @param _seller - Seller, if not the message sender
  function createMintingAuction(
    uint256 _tokenId,
    uint256 _startingPrice,
    uint256 _endingPrice,
    uint256 _duration,
    address _seller
  )
    external;

  /// @notice Cancel auction of the given NFT and transfer it back to the owner. Callable by the original NFT owner only
  /// @param _tokenId ID of the token on auction
  function cancelAuction(
    uint256 _tokenId
  )
    external;

  /// @notice It allows seller to cancel auction (by metatransaction) and get back Marble NFT, but it works only when delayedCancel property is false or when auction duratian time is up
  /// @param _tokenId ID of token on auction
  /// @param _sender Original sender of the metatransaction
  function cancelAuctionByMetatransaction(uint256 _tokenId, address _sender)
    external;

  /// @notice Cancel auction of the given NFT and transfer it back to the owner. Callable by the original NFT owner only
  /// @param _tokenId ID of the token on auction
  function cancelAuctionWhenPaused(
    uint256 _tokenId
  )
    external;

  /// @notice Bids on an open auction, completing the auction and transferring ownership of the NFT if enough MBC is paid through the bank.
  /// @param _tokenId ID of the token to bid on
  /// @param _offer Amount of offered MBC wei for the bid
  function bid(
    uint256 _tokenId, 
    uint256 _offer
  )
    external;

  /// @notice Bids on an open auction, completing the auction and transferring ownership of the NFT if enough MBC is paid
  /// @dev Bid can be placed on normal auction any time, but in case of "minting" auction (_delayedCancel == true) it can be placed only when call of _isTimeUp(auction) returns false
  /// @param _tokenId ID of token to bid on
  /// @param _offer Amount of offered MBC wei for the bid
  /// @param _offerBy Address of the user that did the offer
  function bidByMetatransaction(uint256 _tokenId, uint256 _offer, address _offerBy)
    external;

  /// @notice Returns the current price of an auction of the given token
  /// @param _tokenId ID of the token whose price we are checking.
  function getCurrentPrice(uint256 _tokenId)
    external
    view
    returns (uint256);

  /// @notice Returns the count of all existing auctions
  function totalAuctions()
    external
    view
    returns (uint256);

  /// @notice Returns NFT ID by its index
  /// @param _index The counter. has to be less than `totalSupply()`
  function tokenInAuctionByIndex(
    uint256 _index
  )
    external
    view
    returns (uint256);

  /// @notice Returns the n-th NFT ID from the list of user's tokens in auction
  /// @param _seller The user address
  /// @param _index Index number representing n-th token in th users's list of tokens in auction.
  function tokenOfSellerByIndex(
    address _seller,
    uint256 _index
  )
    external
    view
    returns (uint256);

  /// @dev Returns the count of all existing auctions of the given user
  /// @param _seller Address of the queries user
  function totalAuctionsBySeller(
    address _seller
  )
    external
    view
    returns (uint256);

  /// @notice Returns true if the given NFT is on an auction
  /// @param _tokenId ID of the token to be checked
  function isOnAuction(uint256 _tokenId)
    external
    view
    returns (bool isIndeed);

  /// @notice Returns auction info for an NFT on auction
  /// @param _tokenId ID of the NFT to be queried
  function getAuction(uint256 _tokenId)
    external
    view
    returns
  (
    address seller,
    uint256 startingPrice,
    uint256 endingPrice,
    uint256 duration,
    uint256 startedAt,
    bool canBeCanceled
  );

  /// @notice Remove NFT reference from auction conrtact, should be use only when NFT is being burned
  /// @param _tokenId ID of the token on auction
  function removeAuction(
    uint256 _tokenId
  )
    external;

  /// @notice Sets the metatransactions contract
  /// @dev Can be called only by admin
  /// @param _marbleMetatransactionsContract the contract
  function setMetatransactionsContract(address _marbleMetatransactionsContract) 
    external;

  /// @notice Sets the MarbleCoin contract
  /// @dev Can be called only by admin
  /// @param _marbleCoinContract the contract
  function setMarbleCoinContract(ERC20 _marbleCoinContract) 
    external;

}
