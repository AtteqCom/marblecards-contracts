pragma solidity ^0.6.10;

import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
import "@opengsn/gsn/contracts/interfaces/IKnowForwarderAddress.sol";

/**
 * @title MarbleMetatransactions
 * @dev Contracts allows metatransactions over marble contracts.
 */
contract MarbleMetatransactions is BaseRelayRecipient, IKnowForwarderAddress {

  ERC721 public nftContract;

  constructor(address _forwarder) public {
		trustedForwarder = _forwarder;
	}

  function transferNft(address toAddress, uint tokenId) external {
    address issuer = _msgSender();
    nftContract.transferFrom(issuer, toAddress, tokenId);
  }
  
}
