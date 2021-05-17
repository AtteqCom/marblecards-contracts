// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@0xcert/ethereum-erc721/contracts/tokens/NFTokenMetadata.sol";
// import "@0xcert/ethereum-erc721/contracts/tokens/NFTokenEnumerable.sol";
import "./Adminable.sol";

/**
 * @title MARBLE NFT CONTRACT for testing
 * @notice This is used only for tests for auction contract! this is not the deployed version, its in the `original` project.
 */
contract TestMarbleNFT is
  Adminable,
  ERC721
{

  /*
   * @dev structure storing additional information about created NFT
   * uri: URI used as source/key/representation of NFT, it can be considered as tokens DNA
   * creator:  address of candidate creator - a.k.a. address of person who initialy provided source URI
   * created: date of NFT creation
   */
  struct MarbleNFTSource {

    // URI used as source/key of NFT, we can consider it as tokens DNA
    string uri;

    // address of candidate creator - a.k.a. address of person who initialy provided source URI
    address creator;

    // date of NFT creation
    uint256 created;
  }

  /**
   * @dev Mapping from NFT ID to marble NFT source.
   */
  mapping (uint256 => MarbleNFTSource) public idToMarbleNFTSource;
  /**
   * @dev Mapping from marble NFT source uri hash TO NFT ID .
   */
  mapping (uint256 => uint256) public sourceUriHashToId;

  constructor() ERC721("MARBLE-NFT", "MRBLNFT")
  {
  }

  /**
   * @dev Mints a new NFT.
   * @param _tokenId The unique number representing NFT
   * @param _owner Holder of Marble NFT
   * @param _creator Creator of Marble NFT
   * @param _uri URI representing NFT
   * @param _metadataUri URI pointing to "ERC721 Metadata JSON Schema"
   * @param _created date of creation of NFT candidate
   */
  function mint(
    uint256 _tokenId,
    address _owner,
    address _creator,
    string calldata _uri,
    string calldata _metadataUri,
    uint256 _created
  )
    external
    onlyAdmin
  {
    uint256 uriHash = _getSourceUriHash(_uri);

    require(uriHash != _getSourceUriHash(""), "NFT URI can not be empty!");
    require(sourceUriHashToId[uriHash] == 0, "NFT with same URI already exists!");

    _mint(_owner, _tokenId);
    _setTokenURI(_tokenId, _metadataUri);

    idToMarbleNFTSource[_tokenId] = MarbleNFTSource(_uri, _creator, _created);
    sourceUriHashToId[uriHash] = _tokenId;
  }

  /**
   * @dev Burns NFT. Sadly, trully.. ...probably someone marbled something ugly!!!! :)
   * @param _tokenId ID of ugly NFT
   */
  function burn(
    uint256 _tokenId
  )
    external
    onlyAdmin
  {
    MarbleNFTSource memory marbleNFTSource = idToMarbleNFTSource[_tokenId];

    if (bytes(marbleNFTSource.uri).length != 0) {
      uint256 uriHash = _getSourceUriHash(marbleNFTSource.uri);
      delete sourceUriHashToId[uriHash];
      delete idToMarbleNFTSource[_tokenId];
    }

    _burn(_tokenId);
  }

  /**
   * @dev Tool to manage misstreated NFTs or to be able to extend our services for new cool stuff like auctions, weird games and so on......
   * @param _tokenId ID of the NFT to be update.
   * @param _approved Address to replace current approved address on NFT
   */
  function forceApproval(
    uint256 _tokenId,
    address _approved
  )
    external
    onlyAdmin
  {
    address tokenOwner = ownerOf(_tokenId);
    require(_approved != tokenOwner,"Owner can not be become new owner!");

    super.approve(_approved, _tokenId);
    emit Approval(tokenOwner, _approved, _tokenId);
  }

  /**
   * @dev Returns model of Marble NFT source properties
   * @param _tokenId ID of the NFT
   */
  function tokenSource(uint256 _tokenId)
    external
    view
    returns (
      string memory uri,
      address creator,
      uint256 created)
  {
    MarbleNFTSource memory marbleNFTSource = idToMarbleNFTSource[_tokenId];
    return (marbleNFTSource.uri, marbleNFTSource.creator, marbleNFTSource.created);
  }

  /**
   * @dev Returns token ID related to provided source uri
   * @param _uri URI representing created NFT
   */
  function tokenBySourceUri(string calldata _uri)
    external
    view
    returns (uint256 tokenId)
  {
    return sourceUriHashToId[_getSourceUriHash(_uri)];
  }

  /**
   * @dev Returns whole Marble NFT model
   * --------------------
   *   MARBLE NFT MODEL
   * --------------------
   * uint256 id NFT unique identification
   * string uri NFT source URI, source is whole site what was proccessed by marble to create this NFT, it is URI representation of NFT (call it DNA)
   * string metadataUri  URI pointint to token NFT metadata shcema
   * address owner Current NFT owner
   * address creator First NFT owner
   * uint256 created Date of NFT candidate creation
   *
   * (id, uri, metadataUri, owner, creator, created)
   */
  function getNFT(uint256 _tokenId)
    external
    view
    returns(
      uint256 id,
      string memory uri,
      string memory metadataUri,
      address owner,
      address creator,
      uint256 created
    )
  {

    MarbleNFTSource memory marbleNFTSource = idToMarbleNFTSource[_tokenId];

    return (
      _tokenId,
      marbleNFTSource.uri,
      tokenURI(_tokenId),
      ownerOf(_tokenId),
      marbleNFTSource.creator,
      marbleNFTSource.created);
  }


  /**
   * @dev Transforms URI to hash.
   * @param _uri URI to be transformed to hash.
   */
  function getSourceUriHash(string calldata _uri)
    external
    pure
    returns(uint256 hash)
  {
    return _getSourceUriHash(_uri);
  }

  /**
   * @dev Transforms URI to hash.
   * @param _uri URI to be transformed to hash.
   */
  function _getSourceUriHash(string memory _uri)
    internal
    pure
    returns(uint256 hash)
  {
    return uint256(keccak256(abi.encodePacked(_uri)));
  }
}
