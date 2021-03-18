// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

/// @title Marble Bank Withdraw Authorization
/// @notice Helper contract which decides which MarbleBank withdrawals can be carried out.
/// @dev This version of contract is based on whitelisting users. This means, that no withdrawals are accepted unless the user issuing the withdrawal is whitelisted. 
interface MarbleBankWithdrawAuthorizationInterface {

  /// @notice Checks, whether the given user can withdraw given amount of given token from the bank
  /// @param userAddress Address of the withdrawing user
  /// @param tokenAddress Address of the token to be withdrawn
  /// @param amount Amount of tokens to be withdrawn
  function canWithdraw(address userAddress, address tokenAddress, uint256 amount)
    external
    view
    returns (bool);

  /// @notice Notifies this contract that a withdrawal was executed. It is up to the bank contract to call this function correctly after each withdrawal
  /// @param userAddress Address of the withdrawing user
  /// @param tokenAddress Address of the withdrawn token
  /// @param amount Amount of the withdrawn tokens
  function withdrawn(address userAddress, address tokenAddress, uint256 amount)
    external;

}
