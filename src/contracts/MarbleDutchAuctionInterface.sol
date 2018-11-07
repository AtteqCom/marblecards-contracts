pragma solidity ^0.4.24;

/**
 * @title Marble Dutch Auction Interface
 * @dev describes all externaly accessible functions neccessery to run Marble Auctions
 */
interface MarbleDutchAuctionInterface {

  /**
   * @dev Sets new auctioneer cut, in case we are to cheap :))
   * @param _cut - percent cut the auctioneer takes on each auction, must be between 0-100. Values 0-10,000 map to 0%-100%.
   */
  function setAuctioneerCut(
    uint256 _cut
  )
   external;

  /**
   * @dev Sets an addresses of ERC 721 contract owned/admined by same entity.
   * @param _nftAddress Address of ERC 721 contract
   */
  function setNFTContract(address _nftAddress)
    external;


  /**
   * @dev Creates new auction without special logic. It allows user to sell owned Marble NFTs
   * @param _tokenId ID of token to auction, sender must be owner.
   * @param _startingPrice Price of item (in wei) at beginning of auction.
   * @param _endingPrice Price of item (in wei) at end of auction.
   * @param _duration Length of time to move between starting price and ending price (in seconds) - it determines dynamic state of auction
   */
  function createAuction(
    uint256 _tokenId,
    uint256 _startingPrice,
    uint256 _endingPrice,
    uint256 _duration
  )
    external;

  /**
   * @dev Creates and begins a new minting auction. Minitng auction is initial auction allowing to challenge newly Minted Marble NFT.
   * If no-one buy NFT during dynamic state of auction, then seller (original creator of NFT) will be allowed to become owner of NFT. It means during dynamic (duration)
   * state of auction, it won't be possible to use cancelAuction function by seller!
   * @param _tokenId - ID of token to auction, sender must be owner.
   * @param _startingPrice - Price of item (in wei) at beginning of auction.
   * @param _endingPrice - Price of item (in wei) at end of auction.
   * @param _duration - Length of time to move between starting price and ending price (in seconds).
   * @param _seller - Seller, if not the message sender
   */
  function createMintingAuction(
    uint256 _tokenId,
    uint256 _startingPrice,
    uint256 _endingPrice,
    uint256 _duration,
    address _seller
  )
    external;

  /**
   * @dev It allows seller to cancel auction and get back Marble NFT.
   * @param _tokenId ID of token on auction
   */
  function cancelAuction(
    uint256 _tokenId
  )
    external;

  /**
   * @dev It allows seller to cancel auction and get back Marble NFT.
   * @param _tokenId ID of token on auction
   */
  function cancelAuctionWhenPaused(
    uint256 _tokenId
  )
    external;

  /**
   * @dev Bids on an open auction, completing the auction and transferring ownership of the NFT if enough Ether is supplied.
   * @param _tokenId ID of token to bid on.
   */
  function bid(
    uint256 _tokenId
  )
    external
    payable;

  /**
   * @dev Returns the current price of an auction.
   * @param _tokenId ID of the token price we are checking.
   */
  function getCurrentPrice(uint256 _tokenId)
    external
    view
    returns (uint256);

  /**
   * @dev Returns the count of all existing auctions.
   */
  function totalAuctions()
    external
    view
    returns (uint256);

  /**
   * @dev Returns NFT ID by its index.
   * @param _index A counter less than `totalSupply()`.
   */
  function tokenInAuctionByIndex(
    uint256 _index
  )
    external
    view
    returns (uint256);

  /**
   * @dev Returns the n-th NFT ID from a list of owner's tokens.
   * @param _seller Token owner's address.
   * @param _index Index number representing n-th token in owner's list of tokens.
   */
  function tokenOfSellerByIndex(
    address _seller,
    uint256 _index
  )
    external
    view
    returns (uint256);

  /**
   * @dev Returns the count of all existing auctions.
   */
  function totalAuctionsBySeller(
    address _seller
  )
    external
    view
    returns (uint256);

  /**
   * @dev Returns true if the NFT is on auction.
   * @param _tokenId ID of the token to be checked.
   */
  function isOnAuction(uint256 _tokenId)
    external
    view
    returns (bool isIndeed);

  /**
   * @dev Returns auction info for an NFT on auction.
   * @param _tokenId ID of NFT placed in auction
   */
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

  /**
   * @dev remove NFT reference from auction conrtact, should be use only when NFT is being burned
   * @param _tokenId ID of token on auction
   */
  function removeAuction(
    uint256 _tokenId
  )
    external;
}
