pragma solidity ^0.4.24;

import "@0xcert/ethereum-erc20/contracts/tokens/ERC20.sol";
import "./MarbleBankInterface.sol";

/**
 * @title Marble NFT Candidate Contract
 * @dev Contracts allows public audiance to create Marble NFT candidates. All our candidates for NFT goes through our services to figure out if they are suitable for Marble NFT.
 * once their are picked our other contract will create NFT with same owner as candite and plcae it to minting auction. In minitng auction everyone can buy created NFT until duration period.
 * If duration is over, and noone has bought NFT, then creator of candidate can take Marble NFT from minting auction to his collection.
 */
interface MarbleNFTCandidateInterface {

  /**
   * @dev Sets minimal price for creating Marble NFT Candidate
   * @param _minimalMintingPrice Minimal price asked from creator of Marble NFT candidate (weis)
   */
  function setMinimalPrice(uint256 _minimalMintingPrice)
    external;

  /**
   * @dev Sets minimal price in given token for minting. Set 0 to disallow paying with this token.
   * @param token address of the token
   * @param price price of the minting in the given token
   */
  function setMinimalMintingPriceInToken(address token, uint256 price) 
    external;

  /**
   * @dev Sets the metatransactions contract.
   * @param _marbleMetatransactionsContract the contract
   */
  function setMetatransactionsContract(address _marbleMetatransactionsContract) 
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
   * @dev Creates Marble NFT Candidate. This candidate will go through our processing. If it's suitable, 
   * then Marble NFT is created. It is paid in the chain's currency.
   * @param _uri URI of resource you want to transform to Marble NFT
   */
  function createCandidate(string _uri)
    external
    payable
    returns(uint index);

  /**
   * @dev Creates Marble NFT Candidate for given user (cahrging the sender). This candidate will go through our processing. 
   * If it's suitable, then Marble NFT is created. It is paid in the chain's currency.
   * @param _uri URI of resource you want to transform to Marble NFT
   * @param _owner address of the user who will own the candidate
   */
  function createCandidateForUser(string _uri, address _owner)
    external
    payable
    returns(uint256 index);

  /**
   * @dev Creates Marble NFT Candidate. This candidate will go through our processing. If it's suitable, 
   * then Marble NFT is created. It is paid by the given erc20 token.
   * @param _uri URI of resource you want to transform to Marble NFT
   * @param _erc20 Token in which the creation will be paid
   */
  function createCandidateWithERC20(string _uri, ERC20 _erc20)
    external 
    returns(uint256 index);

  /**
   * @dev Creates Marble NFT Candidate for given user (cahrging the user). This candidate will go through our processing. 
   * If it's suitable, then Marble NFT is created. It is paid by the given erc20 token.
   * @param _uri URI of resource you want to transform to Marble NFT
   * @param _erc20 Token in which the creation will be paid
   * @param _owner address of the user who will own the candidate
   */
  function createCandidateWithERC20ForUser(string _uri, ERC20 _erc20, address _owner)
    external 
    returns(uint256 index);

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
