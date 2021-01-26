pragma solidity ^0.4.24;

import "@0xcert/ethereum-erc20/contracts/tokens/ERC20.sol";
import "@0xcert/ethereum-utils/contracts/math/SafeMath.sol";
import "@0xcert/ethereum-utils/contracts/utils/SupportsInterface.sol";
import "@0xcert/ethereum-utils/contracts/utils/AddressUtils.sol";
import "./Adminable.sol";
import "./Priceable.sol";
import "./Pausable.sol";
import "./MarbleNFTCandidateInterface.sol";
import "./MarbleBankInterface.sol";


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

  event CandidateCreated(uint256 index, address owner, uint256 mintingPrice, address paidInToken, string uri, uint256 createdTimestamp);

  struct Candidate {
    uint256 index;

    // possible NFT creator
    address owner;

    // price paid for minting and placing NFT to initial auction
    uint256 mintingPrice;

    // address of the token used to pay for the candidate (0 for payment in chain currency)
    address paidInToken;

    // CANDIDATE'S DNA
    string uri;

    // date of creation
    uint256 created;
  }

  // bank used for payments in tokens
  MarbleBankInterface public erc20Bank;

  // marble metatransactions contract
  address public marbleMetatransactionsContract;

  // minimal price for creating candidate
  uint256 public minimalMintingPrice;

  // minimal price for creating candidate in erc20 token
  mapping(address => uint256) public minimalMintingPriceInToken;

  // index of candidate in candidates is unique candidate id
  mapping(uint256 => Candidate) public uriHashToCandidates;
  uint256[] public uriHashIndex;

  /**
   * @dev charges the user for given amount of given erc20 tokens if the token is accepted for payments
   * @param _erc20 address of the erc20 token
   * @param _amount amount to be paid
   * @param _buyer address of the user/contract to be charged
   */
  modifier tokenPrice(ERC20 _erc20, uint256 _amount, address _buyer, string note) {
    require(minimalMintingPriceInToken[_erc20] > 0, "This token is not accepted for payments");
    require(erc20Bank.hasEnoughTokens(_erc20, _amount, _buyer), "Not enough tokens in the bank.");
    require(erc20Bank.isAffiliate(address(this)), "User cannot be charged by this contract.");
    _;
    erc20Bank.payByAffiliate(_erc20, _amount, _buyer, address(this), note);
  }

  modifier onlyMetatransactionsContract {
    require(msg.sender == marbleMetatransactionsContract, "Can be called only by metatransactions contract");
    _;
  }

  /**
   * @dev Transforms URI to hash.
   * @param _uri URI to be transformed to hash.
   */
  function _getUriHash(string _uri)
    internal
    pure
    returns(uint256 hash_) // `hash` changed to `hash_` - according to review
  {
    return uint256(keccak256(abi.encodePacked(_uri)));
  }

  function _createCandidate(string _uri, address creator, uint256 price, address paidInToken)
    internal
    returns(uint256 index)
  {
    uint256 uriHash = _getUriHash(_uri);

    require(uriHash != _getUriHash(""), "Candidate URI can not be empty!");
    require(!_isCandidate(_uri), "Candidate is already created!");

    uriHashToCandidates[uriHash] = Candidate(uriHashIndex.push(uriHash) - 1, creator, price, paidInToken, _uri, now);
    emit CandidateCreated(uriHashIndex.length - 1, creator, price, paidInToken, _uri, now);

    return uriHashIndex.length - 1;
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

  // TODO: comment + add to interface
  function setMinimalMintingPriceInToken(address token, uint256 price) external onlyAdmin {
    minimalMintingPriceInToken[token] = price;
  }

  function getMinimalMintingPriceInToken(address token) external view returns(uint256) {
    return minimalMintingPriceInToken[token];
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
   * @dev Sets the bank contract used to execute payments with erc20 tokens.
   * @param _bank the contract
   */
  function setBankContract(MarbleBankInterface _bank) 
    external 
    onlyAdmin 
  {
    erc20Bank = _bank;
  }

  /**
   * @dev Sets the metatransactions contract.
   * @param _marbleMetatransactionsContract the contract
   */
  function setMetatransactionsContract(address _marbleMetatransactionsContract) 
    external 
    onlyAdmin 
  {
    marbleMetatransactionsContract = _marbleMetatransactionsContract;
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
   * @dev Creates Marble NFT Candidate. This candidate will go through our processing. If it's suitable, 
   * then Marble NFT is created. It is paid in the chain's currency.
   * @param _uri URI of resource you want to transform to Marble NFT
   */
  function createCandidate(string _uri)
    external
    whenNotPaused
    payable
    minimalPrice(minimalMintingPrice)
    returns(uint256 index)
  {
    return _createCandidate(_uri, msg.sender, msg.value, address(0));
  }

  /**
   * @dev Creates Marble NFT Candidate for given user (cahrging the sender). This candidate will go through our processing. 
   * If it's suitable, then Marble NFT is created. It is paid in the chain's currency.
   * @param _uri URI of resource you want to transform to Marble NFT
   * @param _owner address of the user who will own the candidate
   */
  function createCandidateForUser(string _uri, address _owner)
    external
    whenNotPaused
    payable
    minimalPrice(minimalMintingPrice)
    returns(uint256 index)
  {
    return _createCandidate(_uri, _owner, msg.value, address(0));
  }

  /**
   * @dev Creates Marble NFT Candidate. This candidate will go through our processing. If it's suitable, 
   * then Marble NFT is created. It is paid by the given erc20 token.
   * @param _uri URI of resource you want to transform to Marble NFT
   * @param _erc20 Token in which the creation will be paid
   */
  function createCandidateWithERC20(string _uri, ERC20 _erc20)
    external 
    whenNotPaused
    tokenPrice(_erc20, minimalMintingPriceInToken[_erc20], msg.sender, "Create Marble candidate")
    returns(uint256 index) 
  {
    return _createCandidate(_uri, msg.sender, minimalMintingPriceInToken[_erc20], _erc20);
  }

  /**
   * @dev Creates Marble NFT Candidate for given user (cahrging the user). This candidate will go through our processing. 
   * If it's suitable, then Marble NFT is created. It is paid by the given erc20 token.
   * @param _uri URI of resource you want to transform to Marble NFT
   * @param _erc20 Token in which the creation will be paid
   * @param _owner address of the user who will own the candidate
   */
  function createCandidateWithERC20ForUser(string _uri, ERC20 _erc20, address _owner)
    external 
    whenNotPaused
    onlyMetatransactionsContract
    tokenPrice(_erc20, minimalMintingPriceInToken[_erc20], _owner, "Create Marble candidate")
    returns(uint256 index) 
  {
    return _createCandidate(_uri, _owner, minimalMintingPriceInToken[_erc20], _erc20);
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

    delete uriHashToCandidates[uriHash];
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
