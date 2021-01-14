pragma solidity ^0.5.13;

// import "@openzeppelin/contracts/GSN/GSNRecipient.sol";
import "./EIP712MetaTransaction.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MarbleMetatransactions
 * @dev Contracts allows metatransactions over marble contracts.
 */
contract MarbleMetatransactions is EIP712MetaTransaction {

  ERC721 public marbleNftContract;

  /**
   * @param transactionsFromChainId only transactions from this chain will be supported.
   */
  // TODO: change marble nft contract to marble nft factory contract
  constructor(ERC721 _marbleNftContract, uint transactionsFromChainId) public EIP712MetaTransaction("MarbleCards test", "1", transactionsFromChainId) {
		marbleNftContract = _marbleNftContract;
	}

  function transferNft(address toAddress, uint tokenId) external {
    address issuer = msgSender();
    marbleNftContract.transferFrom(issuer, toAddress, tokenId);
  }

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