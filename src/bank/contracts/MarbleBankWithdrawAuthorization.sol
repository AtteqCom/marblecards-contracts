// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MarbleBankWithdrawAuthorizationInterface.sol";

/// @title Marble Bank Withdraw Authorization
/// @notice Helper contract which decides which MarbleBank withdrawals can be carried out.
/// @dev This version of contract is based on whitelisting users. This means, that no withdrawals are accepted unless the user issuing the withdrawal is whitelisted. 
contract MarbleBankWithdrawAuthorization is MarbleBankWithdrawAuthorizationInterface, Ownable {

  /// @notice Event emitted when an address is added to whitelist
  /// @param userAddress address of the added user
  event AddedToWhitelist(address userAddress);

  /// @notice Event emitted when an address is removed from whitelist
  /// @param userAddress address of the removed user
  event RemovedFromWhitelist(address userAddress);

  /// @notice Addresses with whitelist value set to true can withdraw any amount of any tokens
  mapping(address => bool) public whitelist;

  /// @notice Checks, whether the given user can withdraw given amount of given token from the bank
  /// @param userAddress Address of the withdrawing user
  function canWithdraw(address userAddress, address, uint256) 
    override
    external
    view
    returns (bool)
  {
    return whitelist[userAddress];
  }

  /// @notice Notifies this contract that a withdrawal was executed. It is up to the bank contract to call this function correctly after each withdrawal
  /// @param userAddress Address of the withdrawing user
  /// @param tokenAddress Address of the withdrawn token
  /// @param amount Amount of the withdrawn tokens
  function withdrawn(address userAddress, address tokenAddress, uint256 amount)
    override
    external
  {

  }

  /// @notice Adds address to the whitelist. Emits AddedToWhitelist event when successful
  /// @dev Can be executed only by the owner
  /// @param userAddress The address to be added
  function addToWhitelist(address userAddress)
    external
    onlyOwner
  {
    require(whitelist[userAddress] == false, "User already whitelisted");
    whitelist[userAddress] = true;

    emit AddedToWhitelist(userAddress);
  }

  /// @notice Removes address from the whitelist. Emits RemovedFromWhitelist event when successful
  /// @dev Can be executed only by the owner
  /// @param userAddress The address to be removed
  function removeFromWhitelist(address userAddress)
    external
    onlyOwner
  {
    require(whitelist[userAddress] == true, "User not whitelisted");
    whitelist[userAddress] = false;

    emit RemovedFromWhitelist(userAddress);
  }

}
