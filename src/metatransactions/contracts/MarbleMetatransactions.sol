// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


import "./EIP712MetaTransaction.sol";
import "./MarbleMetatransactionsInterface.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";



/// @title Metatransactions support for Marble.Card Dapp
/// @dev Since our original contracts do not support metatransactions, we have implemented this wrapper contract
contract MarbleMetatransactions is EIP712MetaTransaction, MarbleMetatransactionsInterface, Ownable {

  /// @notice Address of the marbl nft factory contract
  MarbleNFTFactory public marbleNFTFactoryContract;

  /// @param _marbleNFTFactoryContract Address of the marble nft factory contract
  /// @param transactionsFromChainId Only transactions containing this chain id in their data will be supported.
  constructor(MarbleNFTFactory _marbleNFTFactoryContract, uint transactionsFromChainId) 
    EIP712MetaTransaction("MarbleCards test", "1", transactionsFromChainId) 
  {
		marbleNFTFactoryContract = _marbleNFTFactoryContract;
	}

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
    override 
    external 
  {
    address issuer = msgSender();
    marbleNFTFactoryContract.marbleNFTCandidateContract().createCandidateWithERC20ForUser(uri, erc20Token, issuer);
  }

  /// @notice Executes payment transaction on bank contract
  /// @dev The bank contract used is taken from the page candidate
  /// @param erc20Token Address of the token of the payment
  /// @param amount Amount of tokens t o be paid
  /// @param to Address to which the payment shold be sent
  /// @param note Note for the bank transaction
  function executeBankPayment(address erc20Token, uint256 amount, address to, string calldata note)
    override
    external
  {
    address sender = msgSender();
    MarbleBank bank = marbleNFTFactoryContract.marbleNFTCandidateContract().erc20Bank();
    bank.payByAffiliate(erc20Token, amount, sender, to, note);
  }

  /// @notice Transfer NFT to another address
  /// @dev Transfers nft from its current owner to new owner. This requires that this contract is admin of the NFT contract and that the signer owns the given token
  /// @param toAddress Address of the new owner of the NFT
  /// @param tokenId Id of the token to be transfered
  function transferNft(address toAddress, uint256 tokenId) 
    override 
    external 
  {
    address issuer = msgSender();

    marbleNFTFactoryContract.marbleNFTContract().forceApproval(tokenId, address(this));
    marbleNFTFactoryContract.marbleNFTContract().safeTransferFrom(issuer, toAddress, tokenId);
  }

  /// @notice Sets the marble nft factory contract
  /// @dev Can be called only by the owner of this contract
  function setMarbleFactoryContract(MarbleNFTFactory _marbleNFTFactoryContract) 
    override 
    external 
    onlyOwner 
  {
    marbleNFTFactoryContract = _marbleNFTFactoryContract;
  }

}
