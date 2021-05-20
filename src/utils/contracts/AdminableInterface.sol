// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


/// @title Adminable interface
/// @dev Allows to manage privilages to special contract functionality.
interface AdminableInterface {

  /// @notice Checks whether the given address is admin
  /// @param adminAddress Address to check
  /// @return isIndeed True, if provided address has special privilages, otherwise false
  function isAdmin(address adminAddress)
    external
    view
    returns(bool isIndeed);

  /// @notice Grants special rights for address holder
  /// @dev Adds the address to the list of admins
  /// @param adminAddress Address of future admin
  /// @return index Admin's number
  function addAdmin(address adminAddress)
    external
    returns(uint index);

  /// @notice Removes special rights for provided address
  /// @dev Removes the address from the list of admins
  /// @param adminAddress Address of current admin
  /// @return index Number of the removed admin
  function removeAdmin(address adminAddress)
    external
    returns(uint index);

}
