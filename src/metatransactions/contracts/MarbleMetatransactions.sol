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

  constructor(ERC721 _marbleNftContract) public EIP712MetaTransaction("MarbleCards test", "1") {
		marbleNftContract = _marbleNftContract;
	}

  function transferNft(address toAddress, uint tokenId) external {
    address issuer = msgSender();
    marbleNftContract.transferFrom(issuer, toAddress, tokenId);
  }
  
}


// 0x16E8a6081dC2044fa80E392be6830f754886c39F