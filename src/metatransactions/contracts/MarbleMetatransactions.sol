pragma solidity ^0.5.13;

// import "@openzeppelin/contracts/GSN/GSNRecipient.sol";
import "./EIP712MetaTransaction.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MarbleMetatransactions
 * @dev Contracts allows metatransactions over marble contracts.
 */
contract MarbleMetatransactions is EIP712MetaTransaction {

  address public marbleNFTFactoryContract;
  address public marbleNFTContract;

  /**
   * @param transactionsFromChainId only transactions from this chain will be supported.
   */
  constructor(address _marbleNFTFactoryContract, address _marbleNFTContract, uint transactionsFromChainId) public EIP712MetaTransaction("MarbleCards test", "1", transactionsFromChainId) {
		marbleNFTFactoryContract = _marbleNFTFactoryContract;
    marbleNFTContract = _marbleNFTContract;
    // (bool success, bytes memory returnData) = marbleNFTFactoryContract.call(abi.encodeWithSignature("marbleNFTContract"));
    // marbleNFTContract = bytesToAddress(returnData);
	}

  function transferNft(address toAddress, uint256 tokenId) external {
    address issuer = msgSender();
    
    (bool success, bytes memory returnData) = marbleNFTContract.call(abi.encodeWithSignature("forceApproval(uint256,address)", tokenId, address(this)));
    require(success, "Could not get approval for the transfer");
    (success, returnData) = marbleNFTContract.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", issuer, toAddress, tokenId));
    require(success, "Transfer execution reverted");
    // marbleNftContract.forceApproval(tokenId, address(this));
    // marbleNftContract.transferFrom(issuer, toAddress, tokenId);
  }

  function bytesToAddress(bytes memory bys) private pure returns (address addr) {
    assembly {
      addr := mload(add(bys,20))
    } 
  }

  /** SOME TEST FUNCTIONS */

  function testDoNothing() external {

  }

  function testReturnValue() external returns (uint256) {
    return 435353535;
  }

  function testGetMsgSender() external returns (address) {
    address issuer = msgSender();
    return issuer;
  }

  function testDoNothingPure() external pure {

  }

  function testReturnValuePure() external pure returns (uint256) {
    return 5;
  }

  function testGetMsgSenderView() external view returns (address) {
    address issuer = msgSender();
    return issuer;
  }

}


// 0x16E8a6081dC2044fa80E392be6830f754886c39F