// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "./Priceable.sol";


/// @title Refined MarbleCoin seller
/// @notice This contract is tracked by Marble.Card backend, and if someone transfers MBC to it, or chain currency via the payChainCurrency call, it will move equivalent number of MBC to MarbleBank to the user's account.
contract RmbcSeller is Priceable
{

  /// @notice Event emited when a user paid this account chain currency to get RMBC
  /// @param fromAddress Address of the paying user
  /// @param paidAmount Amount paid
  /// @param expectedRmbcAmount Expected amount of received RMBC
  event ChainCurrencyPaid(address fromAddress, uint256 paidAmount, uint256 expectedRmbcAmount);

  /// @dev Minimal accepted amount of chain currency (to prevent draining resources). This initial value is 0.001
  uint256 minimalPaidAmount = 1000000000000000;

  /// @notice Sets the minimal required amount of paid chain currency
  /// @dev Can be called only by the owner
  /// @param _minimalPaidAmount The minimal required chain currency amount
  function setMinimalPaidAmount(uint256 _minimalPaidAmount)
    external
    onlyOwner
  {
    minimalPaidAmount = _minimalPaidAmount;
  }

  /// @notice Pay chain currency to receive MBC from Marble.Cards backend
  /// @dev If the rate of RMBC received for the given chain currency changes, we may return the payment back to the user.
  /// @param expectedRmbcAmount Expected amount of received RMBC. 
  function payChainCurrency(uint256 expectedRmbcAmount) 
    payable 
    external 
    minimalPrice(minimalPaidAmount)
  {
    emit ChainCurrencyPaid(msg.sender, msg.value, expectedRmbcAmount);
  }

}