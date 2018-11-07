pragma solidity ^0.4.24;

import "@0xcert/ethereum-erc721/contracts/tokens/ERC721.sol";
import "@0xcert/ethereum-utils/contracts/utils/ERC165.sol";
import "./DutchAuctionEnumerable.sol";
import "./MarbleNFTInterface.sol";
import "./Adminable.sol";
import "./Priceable.sol";
import "./Pausable.sol";
import "./MarbleDutchAuctionInterface.sol";

/**
 * @title Dutch auction for non-fungible tokens created by Marble.Cards.
 */
contract MarbleDutchAuction is
  MarbleDutchAuctionInterface,
  Priceable,
  Adminable,
  Pausable,
  DutchAuctionEnumerable
{

  /**
   * @dev The ERC-165 interface signature for ERC-721.
   *  Ref: https://github.com/ethereum/EIPs/issues/165
   *  Ref: https://github.com/ethereum/EIPs/issues/721
   */
  bytes4 constant InterfaceSignature_ERC721 = 0x80ac58cd;

  /**
   * @dev Reports change of auctioneer cut.
   * @param _auctioneerCut Number between 0-10000 (1% is equal to 100)
   */
  event AuctioneerCutChanged(uint256 _auctioneerCut);

  /**
   * @dev Reports removal of NFT from auction cotnract
   * @param _tokenId ID of token to auction, sender must be owner.
   */
  event AuctionRemoved(uint256 _tokenId);

  /**
   * @dev Creates new auction.
   * NOTE: !! Doing a dangerous stuff here!!! changing owner of NFT, be careful where u call this one !!!
   * TODO: in case of replacing forceApproval we can add our contracts as operators, but there is problem in possiblity of changing auction contract and we will be unable to transfer kards to new one
   * @param _tokenId ID of token to auction, sender must be owner.
   * @param _startingPrice Price of item (in wei) at beginning of auction.
   * @param _endingPrice Price of item (in wei) at end of auction.
   * @param _duration Length of time to move between starting
   * @param _delayedCancel If false seller can cancel auction any time, otherwise only after times up
   * @param _seller Seller, if not the message sender
   */
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

      // lets auctioneer to own NFT for purposes of auction
      nftContract.transferFrom(_seller, address(this), _tokenId);

      Auction memory auction = Auction(
        _seller,
        uint128(_startingPrice),
        uint128(_endingPrice),
        uint64(_duration),
        uint256(now),
        bool(_delayedCancel)
      );

      _addAuction(_tokenId, auction);
  }

  /**
   * @dev Sets new auctioneer cut, in case we are to cheap :))
   * @param _cut Percent cut the auctioneer takes on each auction, must be between 0-10000. Values 0-10,000 map to 0%-100%.
   */
  function setAuctioneerCut(uint256 _cut)
    external
    onlyAdmin
  {
    require(_cut <= 10000, "Cut should be in interval of 0-10000");
    auctioneerCut = uint16(_cut);

    emit AuctioneerCutChanged(auctioneerCut);
  }

  /**
   * @dev Sets an addresses of ERC 721 contract owned/admined by same entity.
   * @param _nftAddress Address of ERC 721 contract
   */
  function setNFTContract(address _nftAddress)
    external
    onlyAdmin
  {
    ERC165 nftContractToCheck = ERC165(_nftAddress);
    require(nftContractToCheck.supportsInterface(InterfaceSignature_ERC721)); // ERC721 == 0x80ac58cd
    nftContract = ERC721(_nftAddress);
  }

  /**
   * @dev Creates and begins a new minting auction. Minitng auction is initial auction allowing to challenge newly Minted Marble NFT.
   * If no-one buy NFT during its dynamic state, then seller (original creator of NFT) will be allowed to become owner of NFT. It means during dynamic (duration)
   * state of auction, it won't be possible to use cancelAuction function by seller!
   * @param _tokenId ID of token to auction, sender must be owner.
   * @param _startingPrice Price of item (in wei) at beginning of auction.
   * @param _endingPrice Price of item (in wei) at end of auction.
   * @param _duration Length of time to move between starting price and ending price (in seconds).
   * @param _seller Seller, if not the message sender
   */
  function createMintingAuction(
      uint256 _tokenId,
      uint256 _startingPrice,
      uint256 _endingPrice,
      uint256 _duration,
      address _seller
  )
      external
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
        true, // seller can NOT cancel auction only after time is up! and bidders can be just over duration
        _seller
      );
  }

  /**
   * @dev Creates new auction without special logic.
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
      external
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

  /**
   * @dev Bids on an open auction, completing the auction and transferring ownership of the NFT if enough Ether is supplied.
   * NOTE: Bid can be placed on normal auction any time,
   * but in case of "minting" auction (_delayedCancel == true) it can be placed only when call of _isTimeUp(auction) returns false
   * @param _tokenId ID of token to bid on.
   */
  function bid(uint256 _tokenId)
      external
      payable
      whenNotPaused
  {
    Auction storage auction = tokenIdToAuction[_tokenId];
    require(_isOnAuction(auction), "NFT is not on this auction!");
    require(!auction.delayedCancel || !_durationIsOver(auction), "You can not bid on this auction, because it has delayed cancel policy actived and after times up it belongs once again to seller!");

    // _bid will throw if the bid or funds transfer fails
    _bid(_tokenId, msg.value);

    // change the ownership of NFT
    nftContract.transferFrom(address(this), msg.sender, _tokenId);
  }

  /**
   * @dev It allows seller to cancel auction and get back Marble NFT, but it works only when delayedCancel property is false or when auction duratian time is up.
   * @param _tokenId ID of token on auction
   */
  function cancelAuction(uint256 _tokenId)
    external
    whenNotPaused
  {
      Auction storage auction = tokenIdToAuction[_tokenId];
      require(_isOnAuction(auction), "NFT is not auctioned over our contract!");
      require((!auction.delayedCancel || _durationIsOver(auction)) && msg.sender == auction.seller, "You have no rights to cancel this auction!");

      _cancelAuction(_tokenId);
  }

  /**
   * @dev Cancels an auction when the contract is paused.
   *  Only the admin may do this, and NFTs are returned to the seller. This should only be used in emergencies like moving to another auction contract.
   * @param _tokenId ID of the NFT on auction to cancel.
   */
  function cancelAuctionWhenPaused(uint256 _tokenId)
    external
    whenPaused
    onlyAdmin
  {
      Auction storage auction = tokenIdToAuction[_tokenId];
      require(_isOnAuction(auction), "NFT is not auctioned over our contract!");
      _cancelAuction(_tokenId);
  }

  /**
   * @dev Returns true if NFT is placed as auction over this contract, otherwise false.
   * @param _tokenId ID of NFT to check.
   */
  function isOnAuction(uint256 _tokenId)
    external
    view
    returns (bool isIndeed)
  {
    Auction storage auction = tokenIdToAuction[_tokenId];
    return _isOnAuction(auction);
  }

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

  /**
   * @dev Returns the current price of an auction.
   * @param _tokenId ID of the token price we are checking.
   */
  function getCurrentPrice(uint256 _tokenId)
      external
      view
      returns (uint256)
  {
      Auction storage auction = tokenIdToAuction[_tokenId];
      require(_isOnAuction(auction), "NFT is not auctioned over our contract!");
      return _currentPrice(auction);

  }

  /**
   * @dev remove NFT reference from auction conrtact, should be use only when NFT is being burned
   * @param _tokenId ID of token on auction
   */
  function removeAuction(
    uint256 _tokenId
  )
    external
    whenPaused
    onlyAdmin
  {
    _removeAuction(_tokenId);

    emit AuctionRemoved(_tokenId);
  }
}
