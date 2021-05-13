// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/introspection/ERC165.sol";
import "./DutchAuctionEnumerable.sol";
import "./MarbleNFTInterface.sol";
import "./Adminable.sol";
import "./TokenPriceable.sol";
import "./Pausable.sol";
import "./MarbleDutchAuctionInterface.sol";

/// @title Dutch auction for non-fungible tokens created by Marble.Cards.
contract MarbleDutchAuction is
  ERC165,
  Adminable,
  Pausable,
  MarbleDutchAuctionInterface,
  DutchAuctionEnumerable,
  TokenPriceable
{

  /// @dev The ERC-165 interface signature for ERC-721.
  ///  Ref: https://github.com/ethereum/EIPs/issues/165
  ///  Ref: https://github.com/ethereum/EIPs/issues/721
  bytes4 constant InterfaceSignature_ERC721 = 0x80ac58cd;

  /// @notice Reports removal of NFT from auction contract
  /// @param _tokenId ID of token to auction, sender must be owner.
  event AuctionRemoved(uint256 _tokenId);

  /// @notice Marble metatransactions contract
  address public marbleMetatransactionsContract;

  /// @notice
  ERC20 public marbleCoinContract;

  /// @notice Allows to execute the function only if it was executed by the marble metatransaction contract
  modifier onlyMetatransactionsContract 
  {
    require(msg.sender == marbleMetatransactionsContract, "Can be called only by metatransactions contract");
    _;
  }

  /// @notice Creates a new auction
  /// @dev Doing a dangerous stuff here!!! changing owner of NFT, be careful where u call this one
  /// TODO: in case of replacing forceApproval we can add our contracts as operators, but there is problem in possiblity of changing auction contract and we will be unable to transfer kards to new one
  /// @param _tokenId ID of token to auction, sender must be owner
  /// @param _startingPrice Price of the item (in MBC wei) at the beginning of the auction
  /// @param _endingPrice Price of the item (in MBC wei) at the end of the auction
  /// @param _duration Duration of the dynamic price phase of the auction
  /// @param _delayedCancel If false seller can cancel auction at any time, otherwise only after time's up
  /// @param _seller Seller, if not the message sender
  function _createAuction(
      uint256 _tokenId,
      uint256 _startingPrice,
      uint256 _endingPrice,
      uint256 _duration,
      bool _delayedCancel,
      address _seller
  )
      internal
      whenNotPaused
  {
      MarbleNFTInterface marbleNFT = MarbleNFTInterface(address(nftContract));

      // Sanity check that no inputs overflow how many bits we've allocated
      // to store them as auction model.
      require(_startingPrice == uint256(uint128(_startingPrice)), "Starting price is too high!");
      require(_endingPrice == uint256(uint128(_endingPrice)), "Ending price is too high!");
      require(_duration == uint256(uint64(_duration)), "Duration exceeds allowed limit!");

      /**
       * NOTE: !! Doing a dangerous stuff here !!
       * before calling this should be clear that seller is owner of NFT
       */
      marbleNFT.forceApproval(_tokenId, address(this));

      // Makes the auctioneer the owner of the NFT
      nftContract.transferFrom(_seller, address(this), _tokenId);

      Auction memory auction = Auction(
        _seller,
        uint128(_startingPrice),
        uint128(_endingPrice),
        uint64(_duration),
        uint256(block.timestamp),
        bool(_delayedCancel)
      );

      super._addAuction(_tokenId, auction);
  }

  /// @notice Sets an addresses of ERC 721 contract owned/admined by same entity.
  /// @param _nftAddress Address of ERC 721 contract
  function setNFTContract(address _nftAddress)
    external
    override
    onlyAdmin
  {
    ERC165 nftContractToCheck = ERC165(_nftAddress);
    require(nftContractToCheck.supportsInterface(InterfaceSignature_ERC721));
    nftContract = ERC721(_nftAddress);
  }

  /// @notice Creates and begins a new minting auction. Minitng auction is initial auction allowing to challenge newly Minted Marble NFT.
  /// If no-one buy NFT during its dynamic state, then seller (original creator of NFT) will be allowed to become owner of NFT. It means during dynamic (duration)
  /// state of auction, it won't be possible to use cancelAuction function by seller!
  /// @param _tokenId ID of token to auction, sender must be owner
  /// @param _startingPrice Price of the item (in MBC wei) at the beginning of the auction
  /// @param _endingPrice Price of the item (in MBC wei) at the end of the auction
  /// @param _duration Duration of the auction (in seconds)
  /// @param _seller Seller, if not the message sender
  function createMintingAuction(
      uint256 _tokenId,
      uint256 _startingPrice,
      uint256 _endingPrice,
      uint256 _duration,
      address _seller
  )
      external
      override
      whenNotPaused
      onlyAdmin
  {
    // TODO minitingPrice vs mintintgFee require(_endingPrice > _mintingFee, "Ending price of minitng auction has to be bigger than minting fee!");

    // Sale auction throws if inputs are invalid and clears
    _createAuction(
      _tokenId,
      _startingPrice,
      _endingPrice,
      _duration,
      true, // delayed cancel
      _seller
    );
  }

  /// @notice Creates new auction without any special logic
  /// @param _tokenId ID of token to auction, sender must be owner
  /// @param _startingPrice Price of the item (in MBC wei) at the beginning of the auction
  /// @param _endingPrice Price of the item (in MBC wei) at the end of the auction
  /// @param _duration Duration of the dynamic price phase of the auction (in seconds)
  function createAuction(
      uint256 _tokenId,
      uint256 _startingPrice,
      uint256 _endingPrice,
      uint256 _duration
  )
      external
      override
      whenNotPaused
  {
    require(nftContract.ownerOf(_tokenId) == msg.sender, "Only owner of the token can create auction!");
    // Sale auction throws if inputs are invalid and clears
    _createAuction(
      _tokenId,
      _startingPrice,
      _endingPrice,
      _duration,
      false, // seller can cancel auction any time
      msg.sender
    );
  }

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
    external
    override
    whenNotPaused
    onlyMetatransactionsContract
  {
    require(nftContract.ownerOf(_tokenId) == _sender, "Only owner of the token can create auction");

    _createAuction(
      _tokenId,
      _startingPrice,
      _endingPrice,
      _duration,
      false, // seller can cancel auction any time
      _sender
    );
  }

  /// @notice Bids on an open auction (using metatransaction), completing the auction and transferring ownership of the NFT if enough MBC is offered
  /// @dev Bid can be placed on normal auction any time, but in case of "minting" auction (_delayedCancel == true) it can be placed only when call of _isTimeUp(auction) returns false
  /// @param _tokenId ID of token to bid on
  /// @param _offer Amount of offered MBC wei for the bid
  function bid(uint256 _tokenId, uint256 _offer)
    external
    override
    whenNotPaused
    tokenPrice(marbleCoinContract, _offer, msg.sender, "Bid on an auction")
  {
    Auction storage auction = tokenIdToAuction[_tokenId];
    require(_isOnAuction(auction), "NFT is not on this auction!");
    require(!auction.delayedCancel || !_durationIsOver(auction), "You can not bid on this auction, because it has delayed cancel policy actived and after times up it belongs once again to seller!");

    _bid(_tokenId, _offer);

    nftContract.transferFrom(address(this), msg.sender, _tokenId);
  }

  /// @notice Bids on an open auction, completing the auction and transferring ownership of the NFT if enough MBC is paid
  /// @dev Bid can be placed on normal auction any time, but in case of "minting" auction (_delayedCancel == true) it can be placed only when call of _isTimeUp(auction) returns false
  /// @param _tokenId ID of token to bid on
  /// @param _offer Amount of offered MBC wei for the bid
  /// @param _offerBy Address of the user that did the offer
  function bidByMetatransaction(uint256 _tokenId, uint256 _offer, address _offerBy)
    external
    override
    whenNotPaused
    onlyMetatransactionsContract
    tokenPrice(marbleCoinContract, _offer, _offerBy, "Bid on an auction")
  {
    Auction storage auction = tokenIdToAuction[_tokenId];
    require(_isOnAuction(auction), "NFT is not on this auction!");
    require(!auction.delayedCancel || !_durationIsOver(auction), "You can not bid on this auction, because it has delayed cancel policy actived and after times up it belongs once again to seller!");

    _bid(_tokenId, _offer);

    nftContract.transferFrom(address(this), _offerBy, _tokenId);
  }

  /// @notice It allows seller to cancel auction and get back Marble NFT, but it works only when delayedCancel property is false or when auction duratian time is up
  /// @param _tokenId ID of token on auction
  function cancelAuction(uint256 _tokenId)
    external
    override
    whenNotPaused
  {
    Auction storage auction = tokenIdToAuction[_tokenId];
    require(_isOnAuction(auction), "NFT is not auctioned over our contract!");
    require((!auction.delayedCancel || _durationIsOver(auction)) && msg.sender == auction.seller, "You have no rights to cancel this auction!");

    _cancelAuction(_tokenId);
  }

  /// @notice It allows seller to cancel auction (by metatransaction) and get back Marble NFT, but it works only when delayedCancel property is false or when auction duratian time is up
  /// @param _tokenId ID of token on auction
  /// @param _sender Original sender of the metatransaction
  function cancelAuctionByMetatransaction(uint256 _tokenId, address _sender)
    external
    override
    whenNotPaused
    onlyMetatransactionsContract
  {
    Auction storage auction = tokenIdToAuction[_tokenId];
    require(_isOnAuction(auction), "NFT is not auctioned over our contract!");
    require((!auction.delayedCancel || _durationIsOver(auction)) && _sender == auction.seller, "You have no rights to cancel this auction!");

    _cancelAuction(_tokenId);
  }

  /// @dev Cancels an auction when the contract is paused
  ///  Only the admin may do this, and NFTs are returned to the seller. This should only be used in emergencies like moving to another auction contract.
  /// @param _tokenId ID of the NFT on auction to cancel
  function cancelAuctionWhenPaused(uint256 _tokenId)
    external
    override
    whenPaused
    onlyAdmin
  {
      Auction storage auction = tokenIdToAuction[_tokenId];
      require(_isOnAuction(auction), "NFT is not auctioned over our contract!");
      _cancelAuction(_tokenId);
  }

  /// @notice Returns true if NFT is placed as auction over this contract, otherwise false
  /// @param _tokenId ID of NFT to check
  function isOnAuction(uint256 _tokenId)
    external
    override
    view
    returns (bool isIndeed)
  {
    Auction storage auction = tokenIdToAuction[_tokenId];
    return _isOnAuction(auction);
  }

  /// @dev Returns auction info for an NFT on auction.
  /// @param _tokenId ID of NFT which is queried
  function getAuction(uint256 _tokenId)
    external
    override
    view
    returns
  (
    address seller,
    uint256 startingPrice,
    uint256 endingPrice,
    uint256 duration,
    uint256 startedAt,
    bool delayedCancel
  ) {
    Auction storage auction = tokenIdToAuction[_tokenId];
    require(_isOnAuction(auction), "NFT is not auctioned over our contract!");

    return (
        auction.seller,
        auction.startingPrice,
        auction.endingPrice,
        auction.duration,
        auction.startedAt,
        auction.delayedCancel
    );
  }

  /// @notice Returns the current price of an auction
  /// @param _tokenId ID of the token price we are checking
  function getCurrentPrice(uint256 _tokenId)
    external
    override
    view
    returns (uint256)
  {
    Auction storage auction = tokenIdToAuction[_tokenId];
    require(_isOnAuction(auction), "NFT is not auctioned over our contract!");
    return _currentPrice(auction);
  }

  /// @notice Remove NFT reference from auction conrtact, should be use only when NFT is being burned
  /// @param _tokenId ID of the token on auction
  function removeAuction(
    uint256 _tokenId
  )
    external
    override
    whenPaused
    onlyAdmin
  {
    _removeAuction(_tokenId);

    emit AuctionRemoved(_tokenId);
  }

  /// @notice Sets the metatransactions contract
  /// @dev Can be called only by admin
  /// @param _marbleMetatransactionsContract the contract
  function setMetatransactionsContract(address _marbleMetatransactionsContract) 
    override
    external 
    onlyAdmin 
  {
    marbleMetatransactionsContract = _marbleMetatransactionsContract;
  }

  /// @notice Sets the MarbleCoin contract
  /// @dev Can be called only by admin
  /// @param _marbleCoinContract the contract
  function setMarbleCoinContract(ERC20 _marbleCoinContract) 
    override
    external 
    onlyAdmin 
  {
    marbleCoinContract = _marbleCoinContract;
  }

  // NOTE: the following functions must be here because they are inherited from 2 sources

  /// @notice Returns NFT ID by its index
  /// @param _index The counter. has to be less than `totalSupply()`
  function tokenInAuctionByIndex(
    uint256 _index
  )
    public
    override(DutchAuctionEnumerable, MarbleDutchAuctionInterface)
    view
    returns (uint256) 
  {
    return DutchAuctionEnumerable.tokenInAuctionByIndex(_index);
  }

  /// @notice Returns the n-th NFT ID from the list of user's tokens in auction
  /// @param _seller The user address
  /// @param _index Index number representing n-th token in th users's list of tokens in auction.
  function tokenOfSellerByIndex(
    address _seller,
    uint256 _index
  )
    public
    override(DutchAuctionEnumerable, MarbleDutchAuctionInterface)
    view
    returns (uint256)
  {
    return DutchAuctionEnumerable.tokenOfSellerByIndex(_seller, _index);
  }

  /// @notice Returns the count of all existing auctions.
  function totalAuctionsBySeller(
    address _seller
  )
    public
    override(DutchAuctionEnumerable, MarbleDutchAuctionInterface)
    view
    returns (uint256)
  {
    return DutchAuctionEnumerable.totalAuctionsBySeller(_seller);
  }

  /// @notice Returns the count of all existing auctions
  function totalAuctions()
    public
    override(DutchAuctionEnumerable, MarbleDutchAuctionInterface)
    view
    returns (uint256)
  {
    return DutchAuctionEnumerable.totalAuctions();
  }

}
