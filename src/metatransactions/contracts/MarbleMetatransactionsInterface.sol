// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


import "./EIP712MetaTransaction.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


/// @dev Interface of the MarbleNFT contarct so that we can easily work with it
abstract contract MarbleNFT {
  function forceApproval(uint256 _tokenId, address _approved) external virtual;
  function safeTransferFrom(address from, address to, uint256 tokenId) external virtual;
  function transferFrom(address from, address to, uint256 tokenId) external virtual;
}

/// @dev Interface of the MarbleNFTCandidate contarct so that we can easily work with it
abstract contract MarbleNFTCandidate {
    function createCandidateWithERC20ForUser(string calldata _uri, address _erc20, address _owner) external virtual returns(uint256 index);
}

/// @dev Interface of the MarbleNFTFactory contarct so that we can easily work with it
abstract contract MarbleNFTFactory {
  MarbleNFT public marbleNFTContract;
  MarbleNFTCandidate public marbleNFTCandidateContract;
}


/// @title Metatransactions support for Marble.Card Dapp
/// @dev Since our original contracts do not support metatransactions, we have implemented this wrapper contract
interface MarbleMetatransactionsInterface {

  /// @notice Creates page candidate using erc20 token for payment.
  /// @dev Creates page candidate using the given uri for the given user. The user needs to have enough tokens deposited in the erc20 bank which is used by the candidate contract.
  /// The full chain works as following:
  ///   ---> user A signs the transaction 
  ///   ---> relayer executes this method and extract address of A
  ///   ---> this method initiates candidate creation for A on the candidate contract (requires permission so it cannot be called by anyone and waste someone else's tokens)
  ///   ---> candidate contract issues payment to the bank contract (requires permission so it cannot be issued by anyone and waste someone else's tokens)
  ///   ---> if A has enough tokens in the bank, they are used to pay for the candidate creation (else it reverts)
  /// @param uri Uri of the candidate
  /// @param erc20Token Address of the token in which the candidate creation should be paid
  function createPageCandidateWithERC20(string calldata uri, address erc20Token) 
    external;

  /// @notice Transfer NFT to another address
  /// @dev Transfers nft from its current owner to new owner. This requires that this contract is admin of the NFT contract and that the signer owns the given token
  /// @param toAddress Address of the new owner of the NFT
  /// @param tokenId Id of the token to be transfered
  function transferNft(address toAddress, uint256 tokenId) 
    external;

  /// @notice Sets the marble nft factory contract
  /// @dev Can be called only by the owner of this contract
  function setMarbleFactoryContract(MarbleNFTFactory _marbleNFTFactoryContract) 
    external;

}