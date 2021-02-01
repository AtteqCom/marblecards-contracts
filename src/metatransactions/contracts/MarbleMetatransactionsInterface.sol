// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


import "./EIP712MetaTransaction.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


abstract contract MarbleNFT {
  function forceApproval(uint256 _tokenId, address _approved) external virtual;
  function safeTransferFrom(address from, address to, uint256 tokenId) external virtual;
  function transferFrom(address from, address to, uint256 tokenId) external virtual;
}

abstract contract MarbleNFTCandidate {
    function createCandidateWithERC20ForUser(string calldata _uri, address _erc20, address _owner) external virtual returns(uint256 index);
}

abstract contract MarbleNFTFactory {
  MarbleNFT public marbleNFTContract;
  MarbleNFTCandidate public marbleNFTCandidateContract;
}


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

  /**
   * @dev Sets the marble nft factory contract.
   */
  function setMarbleFactoryContract(MarbleNFTFactory _marbleNFTFactoryContract) external;

}