// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


/// @dev Partial interface of the MarbleNFT contract so that we can easily work with it
abstract contract MarbleNFT {
  function forceApproval(uint256 _tokenId, address _approved) external virtual;
  function safeTransferFrom(address from, address to, uint256 tokenId) external virtual;
  function transferFrom(address from, address to, uint256 tokenId) external virtual;
}

/// @dev Partial interface of the MarbleNFTCandidate contract so that we can easily work with it
abstract contract MarbleNFTCandidate {
  MarbleBank public erc20Bank;
  function createCandidateWithERC20ForUser(string calldata _uri, address _erc20, address _owner) external virtual returns(uint256 index);
}

/// @dev Partial interface of the MarbleNFTFactory contract so that we can easily work with it
abstract contract MarbleNFTFactory {
  MarbleNFT public marbleNFTContract;
  MarbleNFTCandidate public marbleNFTCandidateContract;
}

/// @dev Partial interface of the MarbleBank contract so that we can easily work with it
abstract contract MarbleBank {
  function payByAffiliate(address token, uint256 amount, address from, address to, string calldata note) external virtual;
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

  /// @notice Executes payment transaction on bank contract
  /// @dev The bank contract used is taken from the page candidate
  /// @param erc20Token Address of the token of the payment
  /// @param amount Amount of tokens t o be paid
  /// @param to Address to which the payment shold be sent
  /// @param note Note for the bank transaction
  function executeBankPayment(address erc20Token, uint256 amount, address to, string calldata note)
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