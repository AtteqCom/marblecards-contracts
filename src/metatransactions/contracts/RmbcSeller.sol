// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "./Priceable.sol";


/// @title Refined MarbleCoin seller
/// @notice This contract is tracked by Marble.Card backend, and if someone transfers MBC to it, or ETH via the payEth call, it will move equivalent number of MBC to MarbleBank to the user's account.
contract RmbcSeller is Priceable
{

  /// @notice Event emited when a user paid this account ETH to get RMBC
  /// @param fromAddress Address of the paying user
  /// @param ethAmount Amount paid
  /// @param expectedRmbcAmount Expected amount of received RMBC
  event EthPaid(address fromAddress, uint256 ethAmount, uint256 expectedRmbcAmount);

  /// @dev Minimal accepted amount of ETH (to prevent draining resources). This initial value is 0.001 ETH
  uint256 minimalEthAmount = 1000000000000000;

  /// @notice Sets the minimal required amount of paid ETH
  /// @dev Can be called only by the owner
  /// @param _minimalEthAmount The minimal required ETH amount
  function setMinimalEthAmount(uint256 _minimalEthAmount)
    external
    onlyOwner
  {
    minimalEthAmount = _minimalEthAmount;
  }

  /// @notice Pay eth to receive MBC from Marble.Cards backend
  /// @dev If the rate of RMBC received for the given ETH changes, we may return the payment back to the user.
  /// @param expectedRmbcAmount Expected amount of received RMBC. 
  function payEth(uint256 expectedRmbcAmount) 
    payable 
    external 
    minimalPrice(minimalEthAmount)
  {
    emit EthPaid(msg.sender, msg.value, expectedRmbcAmount);
  }

}