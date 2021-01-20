pragma solidity ^0.5.13;


import "./EIP712MetaTransaction.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract MarbleNFT {
  function forceApproval(uint256 _tokenId, address _approved) external;
  function safeTransferFrom(address from, address to, uint256 tokenId) external;
  function transferFrom(address from, address to, uint256 tokenId) external;
}

contract MarbleNFTCandidate {
  function createCandidate(string calldata _uri) external payable returns(uint256 index);
  
  // not implemented in the candidate yet :(
  function createCandidateWithMBCFor(string calldata _uri, address _creator) external returns(uint256 index);
}

contract MarbleNFTFactory {
  MarbleNFT public marbleNFTContract;
  MarbleNFTCandidate public marbleNFTCandidateContract;
}

/**
 * @title MarbleMetatransactions
 * @dev Contract allowing metatransactions for Marble Dapp.
 */
contract MarbleMetatransactions is EIP712MetaTransaction {

  MarbleNFTFactory public marbleNFTFactoryContract;

  /**
   * @param transactionsFromChainId only transactions from this chain will be supported.
   */
  constructor(MarbleNFTFactory _marbleNFTFactoryContract, uint transactionsFromChainId) public EIP712MetaTransaction("MarbleCards test", "1", transactionsFromChainId) {
		marbleNFTFactoryContract = _marbleNFTFactoryContract;
	}

  function createPageCandidateWithMBC(string calldata uri, address creator) external {
    marbleNFTFactoryContract.marbleNFTCandidateContract().createCandidateWithMBCFor(uri, creator);
  }

  function transferNft(address toAddress, uint256 tokenId) external {
    address issuer = msgSender();
    
    marbleNFTFactoryContract.marbleNFTContract().forceApproval(tokenId, address(this));
    marbleNFTFactoryContract.marbleNFTContract().safeTransferFrom(issuer, toAddress, tokenId);
  }

  /** TEST FUNCTION */
  function testDoNothing() external {

  }

  function getContracts() external view returns (address, address) {
    return (address(marbleNFTFactoryContract), address(marbleNFTFactoryContract.marbleNFTContract()));
  }

}
