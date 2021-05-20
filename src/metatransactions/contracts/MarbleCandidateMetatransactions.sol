// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


import "./MarbleMetatransactionsBase.sol";
import "./MarbleCandidateMetatransactionsInterface.sol";


/// @title Metatransactions support for candidate contract of Marble.Cards Dapp
contract MarbleCandidateMetatransactions is MarbleMetatransactionsBase, MarbleCandidateMetatransactionsInterface
{
  
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
    address issuer = _msgSender();
    marbleNFTFactoryContract.marbleNFTCandidateContract().createCandidateWithERC20ForUser(uri, erc20Token, issuer);
  }

}
