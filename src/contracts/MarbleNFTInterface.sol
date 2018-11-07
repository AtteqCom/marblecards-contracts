pragma solidity ^0.4.24;

/**
 * @title Marble NFT Interface
 * @dev Defines Marbles unique extension of NFT.
 * ...It contains methodes returning core properties what describe Marble NFTs and provides management options to create,
 * burn NFT or change approvals of it.
 */
interface MarbleNFTInterface {

  /**
   * @dev Mints Marble NFT.
   * @notice This is a external function which should be called just by the owner of contract or any other user who has priviladge of being resposible
   * of creating valid Marble NFT. Valid token contains all neccessary information to be able recreate marble card image.
   * @param _tokenId The ID of new NFT.
   * @param _owner Address of the NFT owner.
   * @param _uri Unique URI proccessed by Marble services to be sure it is valid NFTs DNA. Most likely it is URL pointing to some website address.
   * @param _metadataUri URI pointing to "ERC721 Metadata JSON Schema"
   * @param _tokenId ID of the NFT to be burned.
   */
  function mint(
    uint256 _tokenId,
    address _owner,
    string _uri,
    string _metadataUri,
    uint256 _created
  )
    external;

  /**
   * @dev Burns Marble NFT. Should be fired only by address with proper authority as contract owner or etc.
   * @param _tokenId ID of the NFT to be burned.
   */
  function burn(
    uint256 _tokenId
  )
    external;

  /**
   * @dev Allowes to change approval for change of ownership even when sender is not NFT holder. Sender has to have special role granted by contract to use this tool.
   * @notice Careful with this!!!! :))
   * @param _tokenId ID of the NFT to be updated.
   * @param _approved ETH address what supposed to gain approval to take ownership of NFT.
   */
  function forceApproval(
    uint256 _tokenId,
    address _approved
  )
    external;

  /**
   * @dev Returns properties used for generating NFT metadata image (a.k.a. card).
   * @param _tokenId ID of the NFT.
   */
  function tokenSource(uint256 _tokenId)
    external
    view
    returns (
      string uri,
      address creator,
      uint256 created
    );

  /**
   * @dev Returns ID of NFT what matches provided source URI.
   * @param _uri URI of source website.
   */
  function tokenBySourceUri(string _uri)
    external
    view
    returns (uint256 tokenId);

  /**
   * @dev Returns all properties of Marble NFT. Lets call it Marble NFT Model with properties described below:
   * @param _tokenId ID  of NFT
   * Returned model:
   * uint256 id ID of NFT
   * string uri  URI of source website. Website is used to mine data to crate NFT metadata image.
   * string metadataUri URI to NFT metadata assets. In our case to our websevice providing JSON with additional information based on "ERC721 Metadata JSON Schema".
   * address owner NFT owner address.
   * address creator Address of creator of this NFT. It means that this addres placed sourceURI to candidate contract.
   * uint256 created Date and time of creation of NFT candidate.
   *
   * (id, uri, metadataUri, owner, creator, created)
   */
  function getNFT(uint256 _tokenId)
    external
    view
    returns(
      uint256 id,
      string uri,
      string metadataUri,
      address owner,
      address creator,
      uint256 created
    );
}
