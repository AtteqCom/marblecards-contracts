pragma solidity ^0.4.24;

/**
 * @title Marble NFT Candidate Contract
 * @dev Contracts allows public audiance to create Marble NFT candidates. All our candidates for NFT goes through our services to figure out if they are suitable for Marble NFT.
 * once their are picked our other contract will create NFT with same owner as candite and plcae it to minting auction. In minitng auction everyone can buy created NFT until duration period.
 * If duration is over, and noone has bought NFT, then creator of candidate can take Marble NFT from minting auction to his collection.
 */
interface MarbleNFTCandidateInterface {

  /**
   * @dev Sets minimal price for creating Marble NFT Candidate
   * @param _minimalMintingPrice Minimal price asked from creator of Marble NFT candidate
   */
  function setMinimalPrice(uint256 _minimalMintingPrice)
    external;

  /**
   * @dev Returns true if URI is already a candidate. Otherwise false.
   * @param _uri URI to check
   */
  function isCandidate(string _uri)
    external
    view
    returns(bool isIndeed);


  /**
   * @dev Creates Marble NFT Candidate. This candidate will go through our processing. If it's suitable, then Marble NFT is created.
   * @param _uri URI of resource you want to transform to Marble NFT
   */
  function createCandidate(string _uri)
    external
    payable
    returns(uint index);

  /**
   * @dev Removes URI from candidate list.
   * @param _uri URI to be removed from candidate list.
   */
  function removeCandidate(string _uri)
    external;

  /**
   * @dev Returns total count of candidates.
   */
  function getCandidatesCount()
    external
    view
    returns(uint256 count);

  /**
   * @dev Transforms URI to hash.
   * @param _uri URI to be transformed to hash.
   */
  function getUriHash(string _uri)
    external
    view
    returns(uint256 hash);

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
    string url,
    uint256 created);
}
