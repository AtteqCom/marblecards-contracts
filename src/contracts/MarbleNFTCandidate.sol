pragma solidity ^0.4.24;

import "@0xcert/ethereum-utils/contracts/math/SafeMath.sol";
import "@0xcert/ethereum-utils/contracts/utils/SupportsInterface.sol";
import "@0xcert/ethereum-utils/contracts/utils/AddressUtils.sol";
import "./Adminable.sol";
import "./Priceable.sol";
import "./Pausable.sol";
import "./MarbleNFTCandidateInterface.sol";

/**
 * @title Marble NFT Candidate Contract
 * @dev Contracts allows public audiance to create Marble NFT candidates. All our candidates for NFT goes through our services to figure out if they are suitable for Marble NFT.
 * once their are picked our other contract will create NFT with same owner as candite and plcae it to minting auction. In minitng auction everyone can buy created NFT until duration ends.
 * If duration is over, and noone has bought NFT, then creator of candidate can take Marble NFT from minting auction to his collection.
 */
contract MarbleNFTCandidate is
  SupportsInterface,
  Adminable,
  Pausable,
  Priceable,
  MarbleNFTCandidateInterface
{

  using SafeMath for uint256;
  using AddressUtils for address;

  struct Candidate {
    uint256 index;

    // possible NFT creator
    address owner;

    // price paid for minting and placiing NFT to initial auction
    uint256 mintingPrice;

    // CANDIDATES DNA
    string uri;

    // date of creation
    uint256 created;
  }

  // minimal price for creating candidate
  uint256 public minimalMintingPrice;

  // index of candidate in candidates is unique candidate id
  mapping(uint256 => Candidate) public uriHashToCandidates;
  uint256[] public uriHashIndex;


  /**
   * @dev Transforms URI to hash.
   * @param _uri URI to be transformed to hash.
   */
  function _getUriHash(string _uri)
    internal
    pure
    returns(uint256 hash)
  {
    return uint256(keccak256(abi.encodePacked(_uri)));
  }

  /**
   * @dev Returns true if URI is already a candidate. Otherwise false.
   * @param _uri URI to check
   */
  function _isCandidate(string _uri)
    internal
    view
    returns(bool isIndeed)
  {
    if(uriHashIndex.length == 0) return false;

    uint256 uriHash = _getUriHash(_uri);
    return (uriHashIndex[uriHashToCandidates[uriHash].index] == uriHash);
  }

  /**
   * @dev Sets minimal price for creating Marble NFT Candidate
   * @param _minimalMintingPrice Minimal price asked from creator of Marble NFT candidate
   */
  function setMinimalPrice(uint256 _minimalMintingPrice)
    external
    onlyAdmin
  {
    minimalMintingPrice = _minimalMintingPrice;
  }

  /**
   * @dev Returns true if URI is already a candidate. Otherwise false.
   * @param _uri URI to check
   */
  function isCandidate(string _uri)
    external
    view
    returns(bool isIndeed)
  {
    return _isCandidate(_uri);
  }

  /**
   * @dev Creates Marble NFT Candidate. This candidate will go through our processing. If it's suitable, then Marble NFT is created.
   * @param _uri URI of resource you want to transform to Marble NFT
   */
  function createCandidate(string _uri)
    external
    whenNotPaused
    payable
    mintingPrice(minimalMintingPrice)
    returns(uint256 index)
  {
    uint256 uriHash = _getUriHash(_uri);

    require(uriHash != _getUriHash(""), "Candidate URI can not be empty!");
    require(!_isCandidate(_uri), "Candidate is already created!");

    uriHashToCandidates[uriHash] = Candidate(uriHashIndex.push(uriHash)-1, msg.sender, msg.value, _uri, now);
    return uriHashIndex.length -1;
  }


  /**
   * @dev Removes URI from candidate list.
   * @param _uri URI to be removed from candidate list.
   */
  function removeCandidate(string _uri)
    external
    onlyAdmin
  {
    require(_isCandidate(_uri), "Candidate is not present!");

    uint256 uriHash = _getUriHash(_uri);

    uint256 rowToDelete = uriHashToCandidates[uriHash].index;
    uint256 keyToMove = uriHashIndex[uriHashIndex.length-1];
    uriHashIndex[rowToDelete] = keyToMove;
    uriHashToCandidates[keyToMove].index = rowToDelete;
    uriHashIndex.length--;
  }

  /**
   * @dev Returns total count of candidates.
   */
  function getCandidatesCount()
    external
    view
    returns(uint256 count)
  {
    return uriHashIndex.length;
  }

  /**
   * @dev Transforms URI to hash.
   * @param _uri URI to be transformed to hash.
   */
  function getUriHash(string _uri)
    external
    view
    returns(uint256 hash)
  {
    return _getUriHash(_uri);
  }


  /**
   * @dev Returns Candidate model by URI
   * @param _uri URI representing candidate
   */
  function getCandidate(string _uri)
    external
    view
    returns(
    uint256 index,
    address owner,
    uint256 mintingPrice,
    string uri,
    uint256 created)
  {
    Candidate memory candidate = uriHashToCandidates[_getUriHash(_uri)];

    return (
      candidate.index,
      candidate.owner,
      candidate.mintingPrice,
      candidate.uri,
      candidate.created);
  }

}
