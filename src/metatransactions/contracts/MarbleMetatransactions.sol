pragma solidity ^0.5.13;


import "./EIP712MetaTransaction.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract MarbleNFT {
  function forceApproval(uint256 _tokenId, address _approved) external;
  function safeTransferFrom(address from, address to, uint256 tokenId) external;
  function transferFrom(address from, address to, uint256 tokenId) external;
}

contract MarbleNFTFactory {
  MarbleNFT public marbleNFTContract;
}

/**
 * @title MarbleMetatransactions
 * @dev Contracts allows metatransactions over marble contracts.
 */
contract MarbleMetatransactions is EIP712MetaTransaction {

  MarbleNFTFactory public marbleNFTFactoryContract;
  MarbleNFT public marbleNFTContract;

  /**
   * @param transactionsFromChainId only transactions from this chain will be supported.
   */
  constructor(MarbleNFTFactory _marbleNFTFactoryContract, uint transactionsFromChainId) public EIP712MetaTransaction("MarbleCards test", "1", transactionsFromChainId) {
		marbleNFTFactoryContract = _marbleNFTFactoryContract;
    marbleNFTContract = _marbleNFTFactoryContract.marbleNFTContract();
	}

  function transferNft(address toAddress, uint256 tokenId) external {
    address issuer = msgSender();
    
    marbleNFTContract.forceApproval(tokenId, address(this));
    marbleNFTContract.safeTransferFrom(issuer, toAddress, tokenId);
  }

  /** TEST FUNCTION */
  function testDoNothing() external {

  }

  function getContracts() external view returns (address, address) {
    return (address(marbleNFTFactoryContract), address(marbleNFTContract));
  }

}
