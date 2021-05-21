// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./MarbleBankInterface.sol";

/**
 * @title Marble NFT Candidate Contract
 * @dev Contracts allows public audiance to create Marble NFT candidates. All our candidates for NFT goes through our services to figure out if they are suitable for Marble NFT.
 * once their are picked our other contract will create NFT with same owner as candite and plcae it to minting auction. In minitng auction everyone can buy created NFT until duration period.
 * If duration is over, and noone has bought NFT, then creator of candidate can take Marble NFT from minting auction to his collection.
 */
interface MarbleNFTCandidateInterface {

  /// @notice Sets minimal price for creating Marble NFT Candidate
  /// @param _minimalMintingPrice Minimal price asked from creator of Marble NFT candidate
  function setMinimalPrice(uint256 _minimalMintingPrice)
    external;

  /// @notice Sets minimal price in given token for minting. Set 0 to disallow paying with this token.
  /// @param token Address of the token
  /// @param price Price of the minting in the given token
  function setMinimalMintingPriceInToken(address token, uint256 price) 
    external;

  /// @notice Sets the metatransactions contract
  /// @dev Can be called only by admin
  /// @param _marbleMetatransactionsContract the contract
  function setMetatransactionsContract(address _marbleMetatransactionsContract) 
    external;

  /// @notice Checks, whether a candidate with the given uri exists already
  /// @param _uri URI to check
  /// @return isIndeed True if URI is already a candidate, false otherwise
  function isCandidate(string memory _uri)
    external
    view
    returns(bool isIndeed);


  /// @notice Creates Marble NFT Candidate. This candidate will go through our processing. If it's suitable, 
  /// then Marble NFT is created. It is paid in the chain's currency.
  /// @param _uri URI of resource you want to transform to Marble NFT
  /// @return index Index of the newly created candidate
  function createCandidate(string memory _uri)
    external
    payable
    returns(uint index);

  /// @notice Creates Marble NFT Candidate for given user (cahrging the sender). This candidate will go through our processing. 
  /// If it's suitable, then Marble NFT is created. It is paid in the chain's currency.
  /// @param _uri URI of resource you want to transform to Marble NFT
  /// @param _owner Address of the user who will own the candidate
  /// @return index Index of the newly created candidate
  function createCandidateForUser(string memory _uri, address _owner)
    external
    payable
    returns(uint256 index);

  /// @notice Creates Marble NFT Candidate. This candidate will go through our processing. If it's suitable, 
  /// then Marble NFT is created. It is paid by the given erc20 token.
  /// @param _uri URI of resource you want to transform to Marble NFT
  /// @param _erc20 Token in which the creation will be paid
  /// @return index Index of the newly created candidate
  function createCandidateWithERC20(string memory _uri, ERC20 _erc20)
    external 
    returns(uint256 index);

  /// @notice Creates Marble NFT Candidate for given user (cahrging the user). This candidate will go through our processing. 
  /// If it's suitable, then Marble NFT is created. It is paid by the given erc20 token.
  /// @param _uri URI of resource you want to transform to Marble NFT
  /// @param _erc20 Token in which the creation will be paid
  /// @param _owner Address of the user who will own the candidate
  /// @return index Index of the newly created candidate
  function createCandidateWithERC20ForUser(string memory _uri, ERC20 _erc20, address _owner)
    external 
    returns(uint256 index);

  /// @notice Removes URI from candidate list
  /// @dev Can be execute only by admin
  /// @param _uri URI to be removed from candidate list
  function removeCandidate(string memory _uri)
    external;

  /// @notice Returns total count of candidates
  function getCandidatesCount()
    external
    view
    returns(uint256 count);

  /// @notice Transforms URI to hash
  /// @param _uri URI to be transformed to hash
  /// @return hash The hash
  function getUriHash(string memory _uri)
    external
    view
    returns(uint256 hash);

  /// @notice Returns Candidate model by URI
  /// @param _uri URI representing candidate
  /// @return index Index of the candidate
  /// @return owner Onwer of the candidate
  /// @return mintingPrice Price used to buy the candidate (either number of tokens or chain's currency)
  /// @return url Candidate's URI
  /// @return created Date of the candidate creation
  function getCandidate(string memory _uri)
    external
    view
    returns(
    uint256 index,
    address owner,
    uint256 mintingPrice,
    string memory url,
    uint256 created);
}
