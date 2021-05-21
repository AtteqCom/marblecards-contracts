// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


import "./MarbleMetatransactionsBase.sol";
import "./marble/MarbleBank.sol";
import "./MarbleBankMetatransactionsInterface.sol";


/// @title Metatransactions support for bank contract of Marble.Cards Dapp
contract MarbleBankMetatransactions is MarbleMetatransactionsBase, MarbleBankMetatransactionsInterface {

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
    address sender = _msgSender();
    MarbleBank bank = marbleNFTFactoryContract.marbleNFTCandidateContract().erc20Bank();
    bank.payByAffiliate(erc20Token, amount, sender, to, note);
  }

}
