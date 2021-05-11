// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./Adminable.sol";
import "./Priceable.sol";
import "./TokenPriceable.sol";
import "./Pausable.sol";
import "./MarbleNFTCandidateInterface.sol";


/// @title Marble NFT Candidate Contract
/// @dev Contracts allows public audiance to create Marble NFT candidates. All our candidates for NFT goes through our services to figure out if they are suitable for Marble NFT.
/// once their are picked our other contract will create NFT with same owner as candite and plcae it to minting auction. In minitng auction everyone can buy created NFT until duration ends.
/// If duration is over, and noone has bought NFT, then creator of candidate can take Marble NFT from minting auction to his collection.
contract MarbleNFTCandidate is
  ERC165,
  Adminable,
  Pausable,
  Priceable,
  TokenPriceable,
  MarbleNFTCandidateInterface
{

  using SafeMath for uint256;
  using Address for address;

  /// @notice Event emited whenever a new candidate is created
  /// @param index Index of the candidate
  /// @param owner Owner of the new candidate
  /// @param mintingPrice Price for which the candidate was bought (can be number of tokens or chain's main currency)
  /// @param paidInToken Address of the erc20 token used to buy this candidate or zero address if if was bought using chain's main currency
  /// @param uri Uri of the candidate
  /// @param createdTimestamp Timestamp when the candidate was created
  event CandidateCreated(uint256 index, address owner, uint256 mintingPrice, address paidInToken, string uri, uint256 createdTimestamp);

  /// @notice Event thrown when minimal minting price changed
  /// @param mintingPrice New minting price in wei
  /// @param tokenAddress Address of the token, whose price changed. Zero address if ETH price is changed
  event MinimalMintingPriceChanged(uint256 mintingPrice, address tokenAddress);

  /// @dev Structure representing a candidate
  /// @param index Index of the candidate
  /// @param owner Possible NFT creator
  /// @param mintingPrice Price paid for minting and placing NFT to initial auction (either number of tokens or chain's main currency)
  /// @param paidInToken address of the token used to pay for the candidate (zero address for payment in chain's currency)
  /// @param uri Candidate's DNA
  /// @param created Date of creation
  struct Candidate {
    uint256 index;
    address owner;
    uint256 mintingPrice;
    address paidInToken;
    string uri;
    uint256 created;
  }

  /// @notice Marble metatransactions contract
  address public marbleMetatransactionsContract;

  /// @notice Minimal price for creating candidate
  uint256 public minimalMintingPrice;

  /// @notice Minimal prices for creating candidate in erc20 token
  /// @dev If the price is set to zero, it means that candidates cannot be bought using that token
  mapping(address => uint256) public minimalMintingPriceInToken;

  /// @notice Index of candidate in candidates is unique candidate id
  mapping(uint256 => Candidate) public uriHashToCandidates;

  uint256[] public uriHashIndex;

  /// @notice Allows executing the function only if the givene token is allowed to use to buy candidate
  /// @param token Address of the tested token
  modifier tokenAccepted(ERC20 token) 
  {
    require(minimalMintingPriceInToken[address(token)] > 0, "This token is not accepted for payments");
    _;
  }

  /// @notice Allows execute the function only if it was executed by the marble metatransaction contract
  modifier onlyMetatransactionsContract 
  {
    require(msg.sender == marbleMetatransactionsContract, "Can be called only by metatransactions contract");
    _;
  }

  /// @dev Transforms URI to hash
  /// @param _uri URI to be transformed to hash
  /// @return hash_ The hash of the uri
  function _getUriHash(string memory _uri)
    internal
    pure
    returns(uint256 hash_) // `hash` changed to `hash_` - according to review
  {
    return uint256(keccak256(abi.encodePacked(_uri)));
  }

  /// @dev Creates the given candidate
  /// @param _uri Uri of the candidate
  /// @param creator Address of the creator of the candidate
  /// @param price Price of the candidate (either number of tokens or chain's currency)
  /// @param paidInToken Address of the token in which the candidate creation was paid (or zero address if it was paid in chain's currency)
  /// @return index Index of the newly created candidate
  function _createCandidate(string memory _uri, address creator, uint256 price, address paidInToken)
    internal
    returns(uint256 index)
  {
    uint256 uriHash = _getUriHash(_uri);

    require(uriHash != _getUriHash(""), "Candidate URI can not be empty!");
    require(!_isCandidate(_uri), "Candidate is already created!");

    uriHashIndex.push(uriHash);
    uint candidatesLength = uriHashIndex.length;
    uriHashToCandidates[uriHash] = Candidate(candidatesLength - 1, creator, price, paidInToken, _uri, block.timestamp);
    emit CandidateCreated(uriHashIndex.length - 1, creator, price, paidInToken, _uri, block.timestamp);

    return uriHashIndex.length - 1;
  }

  /// @notice Checks, whether a candidate with the given uri exists already
  /// @param _uri URI to check
  /// @return isIndeed True if URI is already a candidate, false otherwise
  function _isCandidate(string memory _uri)
    internal
    view
    returns(bool isIndeed)
  {
    if(uriHashIndex.length == 0) return false;

    uint256 uriHash = _getUriHash(_uri);
    return (uriHashIndex[uriHashToCandidates[uriHash].index] == uriHash);
  }

  /// @notice Sets minimal price in given token for minting. Set 0 to disallow paying with this token.
  /// @param token Address of the token
  /// @param price Price of the minting in the given token
  function setMinimalMintingPriceInToken(address token, uint256 price) 
    override 
    external 
    onlyAdmin 
  {
    minimalMintingPriceInToken[token] = price;
    emit MinimalMintingPriceChanged(price, token);
  }

  /// @notice Sets minimal price for creating Marble NFT Candidate
  /// @param _minimalMintingPrice Minimal price asked from creator of Marble NFT candidate
  function setMinimalPrice(uint256 _minimalMintingPrice)
    override
    external
    onlyAdmin
  {
    minimalMintingPrice = _minimalMintingPrice;
    emit MinimalMintingPriceChanged(_minimalMintingPrice, address(0));
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

  /// @notice Checks, whether a candidate with the given uri exists already
  /// @param _uri URI to check
  /// @return isIndeed True if URI is already a candidate, false otherwise
  function isCandidate(string memory _uri)
    override
    external
    view
    returns(bool isIndeed)
  {
    return _isCandidate(_uri);
  }

  /// @notice Creates Marble NFT Candidate. This candidate will go through our processing. If it's suitable, 
  /// then Marble NFT is created. It is paid in the chain's currency.
  /// @param _uri URI of resource you want to transform to Marble NFT
  /// @return index Index of the newly created candidate
  function createCandidate(string memory _uri)
    override
    external
    whenNotPaused
    payable
    minimalPrice(minimalMintingPrice)
    returns(uint256 index)
  {
    return _createCandidate(_uri, msg.sender, msg.value, address(0));
  }

  /// @notice Creates Marble NFT Candidate for given user (cahrging the sender). This candidate will go through our processing. 
  /// If it's suitable, then Marble NFT is created. It is paid in the chain's currency.
  /// @param _uri URI of resource you want to transform to Marble NFT
  /// @param _owner Address of the user who will own the candidate
  /// @return index Index of the newly created candidate
  function createCandidateForUser(string memory _uri, address _owner)
    override
    external
    whenNotPaused
    payable
    minimalPrice(minimalMintingPrice)
    returns(uint256 index)
  {
    return _createCandidate(_uri, _owner, msg.value, address(0));
  }

  /// @notice Creates Marble NFT Candidate. This candidate will go through our processing. If it's suitable, 
  /// then Marble NFT is created. It is paid by the given erc20 token.
  /// @param _uri URI of resource you want to transform to Marble NFT
  /// @param _erc20 Token in which the creation will be paid
  /// @return index Index of the newly created candidate
  function createCandidateWithERC20(string memory _uri, ERC20 _erc20)
    override
    external 
    whenNotPaused
    tokenAccepted(_erc20)
    tokenPrice(_erc20, minimalMintingPriceInToken[address(_erc20)], msg.sender, "Create Marble candidate")
    returns(uint256 index) 
  {
    return _createCandidate(_uri, msg.sender, minimalMintingPriceInToken[address(_erc20)], address(_erc20));
  }

  /// @notice Creates Marble NFT Candidate for given user (cahrging the user). This candidate will go through our processing. 
  /// If it's suitable, then Marble NFT is created. It is paid by the given erc20 token.
  /// @param _uri URI of resource you want to transform to Marble NFT
  /// @param _erc20 Token in which the creation will be paid
  /// @param _owner Address of the user who will own the candidate
  /// @return index Index of the newly created candidate
  function createCandidateWithERC20ForUser(string memory _uri, ERC20 _erc20, address _owner)
    override
    external 
    whenNotPaused
    onlyMetatransactionsContract
    tokenAccepted(_erc20)
    tokenPrice(_erc20, minimalMintingPriceInToken[address(_erc20)], _owner, "Create Marble candidate")
    returns(uint256 index) 
  {
    return _createCandidate(_uri, _owner, minimalMintingPriceInToken[address(_erc20)], address(_erc20));
  }

  /// @notice Removes URI from candidate list
  /// @dev Can be execute only by admin
  /// @param _uri URI to be removed from candidate list
  function removeCandidate(string memory _uri)
    override
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
    uriHashIndex.pop();
  }

  /// @notice Returns total count of candidates
  function getCandidatesCount()
    override
    external
    view
    returns(uint256 count)
  {
    return uriHashIndex.length;
  }

  /// @notice Transforms URI to hash
  /// @param _uri URI to be transformed to hash
  /// @return hash The hash
  function getUriHash(string memory _uri)
    override
    external
    pure
    returns(uint256 hash)
  {
    return _getUriHash(_uri);
  }


  /// @notice Returns Candidate model by URI
  /// @param _uri URI representing candidate
  /// @return index Index of the candidate
  /// @return owner Onwer of the candidate
  /// @return mintingPrice Price used to buy the candidate (either number of tokens or chain's currency)
  /// @return uri Candidate's URI
  /// @return created Date of the candidate creation
  function getCandidate(string memory _uri)
    override
    external
    view
    returns(
    uint256 index,
    address owner,
    uint256 mintingPrice,
    string memory uri,
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
