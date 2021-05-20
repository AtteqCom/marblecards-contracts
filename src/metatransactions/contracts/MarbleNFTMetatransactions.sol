// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


import "./MarbleMetatransactionsBase.sol";
import "./MarbleNFTMetatransactionsInterface.sol";


/// @title Metatransactions support for Marble.Card Dapp
/// @dev Since our original contracts do not support metatransactions, we have implemented this wrapper contract. 
///   We also need to use custom Ownable contract, because Ownable from openzeppelin contains _msgSender function which 
///   clashes with the one from BaseRelayRecipient contract.
contract MarbleNFTMetatransactions is MarbleMetatransactionsBase, MarbleNFTMetatransactionsInterface {

  /// @notice Transfer NFT to another address
  /// @dev Transfers nft from its current owner to new owner. This requires that this contract is admin of the NFT contract and that the signer owns the given token
  /// @param toAddress Address of the new owner of the NFT
  /// @param tokenId Id of the token to be transfered
  function transferNft(address toAddress, uint256 tokenId) 
    override 
    external 
  {
    address issuer = _msgSender();
    marbleNFTFactoryContract.marbleNFTContract().forceApproval(tokenId, address(this));
    marbleNFTFactoryContract.marbleNFTContract().safeTransferFrom(issuer, toAddress, tokenId);
  }

}
