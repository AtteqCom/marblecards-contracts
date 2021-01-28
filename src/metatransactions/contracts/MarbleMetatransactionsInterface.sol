pragma solidity ^0.5.13;


import "./EIP712MetaTransaction.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface MarbleMetatransactionsInterface {

  /**
   * @dev Creates page candidate using the given uri for the given user. The user needs to have enough tokens
   * deposited in the erc20 bank which is used by the candidate contract.
   * @param uri candidate's uri
   * @param erc20Token token in which the candidate creation should be paid 
   */
  function createPageCandidateWithERC20(string calldata uri, address erc20Token) external;

  /**
   * @dev Transfers nft from its current owner to new owner. This requires that this contract is admin of the NFT contract.
   * @param toAddress new owner of the NFT
   * @param tokenId id of the token to be transfered
   */
  function transferNft(address toAddress, uint256 tokenId) external;

}