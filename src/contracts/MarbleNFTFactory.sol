pragma solidity ^0.4.24;

import "@0xcert/ethereum-erc721/contracts/tokens/ERC721.sol";
import "@0xcert/ethereum-erc721/contracts/tokens/ERC721Enumerable.sol";
import "@0xcert/ethereum-erc721/contracts/tokens/ERC721Metadata.sol";
import "@0xcert/ethereum-utils/contracts/utils/SupportsInterface.sol";
import "@0xcert/ethereum-utils/contracts/math/SafeMath.sol";
import "./Adminable.sol";
import "./Pausable.sol";
import "./MarbleNFTCandidateInterface.sol";
import "./MarbleDutchAuctionInterface.sol";
import "./MarbleNFT.sol";

/**
 * @title Marble NFT Factory
 * @dev Covers all parts of creating new NFT token. Contains references to all involved contracts and giving possibility of burning NFT corretly.
 */
contract MarbleNFTFactory is
  Adminable,
  Pausable,
  SupportsInterface
{

  using SafeMath for uint256;

  MarbleNFT public marbleNFTContract;
  MarbleNFTCandidateInterface public marbleNFTCandidateContract;
  MarbleDutchAuctionInterface public marbleDutchAuctionContract;

  /**
   * @dev property holding last created NFT ID
   * - it's  separeted from Marble NFT contract in case that we will want to change NFT id strategy in the future. Currently no idea why we would do it! :)
   */
  uint256 public lastMintedNFTId;

  constructor(uint256 _lastMintedNFTId)
    public
  {
    lastMintedNFTId = _lastMintedNFTId;
  }

  /**
   * @dev Emits when new marble when is minted
   */
  event MarbleNFTCreated(
    address indexed _creator,
    uint256 indexed _tokenId
  );

  /**
   * @dev Emits when new marble is minted
   */
  event MarbleNFTBurned(
    uint256 indexed _tokenId,
    address indexed _owner,
    address indexed _creator
  );


  /**
   * @dev Creates Marble NFT from Candidate and returns NFTs owner. Was created, bc of deep stack error over mint function.
   * @param _id ID of Marble NFT
   * @param _uri URI determining Marble NFT, lets say this is our DNA...
   * @param _metadataUri URI pointing to "ERC721 Metadata JSON Schema"
   * @param _candidateUri URI initially provided to user for purposes of creation Marble NFT
   */
  function _mint(
    uint256 _id,
    string _uri,
    string _metadataUri,
    string _candidateUri
  )
    internal
    returns (address owner)
  {
    require(marbleNFTCandidateContract.isCandidate(_candidateUri), "There is no candidate with this URL!!");
    uint256 created;

    (, owner, , , created) = marbleNFTCandidateContract.getCandidate(_candidateUri);

    marbleNFTContract.mint(
      _id,
      owner,
      _uri,
      _metadataUri,
      created
    );
  }

  /**
   * @dev Sets auction contract
   * @param _address Contract address
   */
  function setMarbleDutchAuctionContract(address _address)
     external
     onlyAdmin
     whenNotPaused
  {
      marbleDutchAuctionContract = MarbleDutchAuctionInterface(_address);
  }

  /**
   * @dev Sets Marble NFT contract
   * @param _address Contract address
   */
  function setNFTContract(address _address)
     external
     onlyAdmin
     whenNotPaused
  {
      marbleNFTContract = MarbleNFT(_address);
  }

  /**
   * @dev Sets Candidate contract
   * @param _address Contract address
   */
  function setCandidateContract(address _address)
    external
    onlyAdmin
    whenNotPaused
  {
     marbleNFTCandidateContract = MarbleNFTCandidateInterface(_address);
  }

  /**
   * @dev Creates Marble NFT. Then place it over auction in special fashion and remove candidate entry.
   * NOTE: we are not removing candidates, should we or should we not??
   * @param _uri URI determining Marble NFT, lets say this is our DNA...
   * @param _metadataUri URI pointing to "ERC721 Metadata JSON Schema"
   * @param _candidateUri URI initially provided to user for purposes of creation Marble NFT
   * @param _auctionStartingPrice Starting price of auction.
   * @param _auctionMinimalPrice Ending price of auction.
   * @param _auctionDuration Duration (in seconds) of auction when price is moving, lets say, it determines dynamic part of auction price creation.
   */
  function mint(
    string _uri,
    string _metadataUri,
    string _candidateUri,
    uint256 _auctionStartingPrice,
    uint256 _auctionMinimalPrice,
    uint256 _auctionDuration
  )
    external
    onlyAdmin
    whenNotPaused
  {
    uint256 id = lastMintedNFTId.add(1);

    address owner = _mint(
      id,
      _uri,
      _metadataUri,
      _candidateUri
    );

    marbleDutchAuctionContract.createMintingAuction(
      id,
      _auctionStartingPrice,
      _auctionMinimalPrice,
      _auctionDuration,
      owner
    );

    lastMintedNFTId = id;

    emit MarbleNFTCreated(owner, id);
  }

  /**
   * @dev Creates Marble NFT. Then place it over auction in special fashion and remove candidate entry......hmm removing of candidate is not important and we can remove it from the minting process.
   * NOTE: !! rather careful with this stuff, it burns
   * @param _tokenId Id of Marble NFT to burn
   */
  function burn(
    uint256 _tokenId
  )
    external
    onlyAdmin
    whenNotPaused
  {

    require(marbleNFTContract.ownerOf(_tokenId) != address(0) , "Marble NFT doesnt not exists!");
    address owner;
    address creator;

    // get some info about NFT to tell the world whos NFT we are burning!!
    (, , , owner, creator, ) = marbleNFTContract.getNFT(_tokenId);

    Pausable auctionContractToBePaused = Pausable(address(marbleDutchAuctionContract));

    // If NFT is on our auction contract, we have to remove it first
    if (marbleDutchAuctionContract.isOnAuction(_tokenId)) {
      require(auctionContractToBePaused.paused(), "Auction contract has to be paused!");
      marbleDutchAuctionContract.removeAuction(_tokenId);
    }

    // burn NFT
    marbleNFTContract.burn(_tokenId);

    // Let's everyone to know that we burn things....! :)
    emit MarbleNFTBurned(_tokenId, owner, creator);
  }

}
