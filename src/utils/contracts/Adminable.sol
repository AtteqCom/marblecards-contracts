// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AdminableInterface.sol";

/// @title Adminable
/// @dev Allows to manage privilages to special contract functionality.
contract Adminable is AdminableInterface, Ownable {

  /// @notice Maps admin address to the admin's number
  mapping(address => uint) public adminsMap;

  /// @notice List of admins
  address[] public adminList;

  /// @notice Checks whether the given address is admin
  /// @param adminAddress Address to check
  /// @return isIndeed True, if provided address has special privilages, otherwise false
  function isAdmin(address adminAddress)
    override
    public
    view
    returns(bool isIndeed)
  {
    if (adminAddress == owner()) return true;

    if (adminList.length == 0) return false;
    return (adminList[adminsMap[adminAddress]] == adminAddress);
  }

  /// @notice Grants special rights for address holder
  /// @dev Adds the address to the list of admins
  /// @param adminAddress Address of future admin
  /// @return index Admin's number
  function addAdmin(address adminAddress)
    override
    public
    onlyOwner
    returns(uint index)
  {
    require(!isAdmin(adminAddress), "Address already has admin rights!");

    adminList.push(adminAddress);
    uint adminsCount = adminList.length;
    adminsMap[adminAddress] = adminsCount-1;

    return adminsCount-1;
  }

  /// @notice Removes special rights for provided address
  /// @dev Removes the address from the list of admins
  /// @param adminAddress Address of current admin
  /// @return index Number of the removed admin
  function removeAdmin(address adminAddress)
    override
    public
    onlyOwner
    returns(uint index)
  {
    // we can not remove owner from admin role
    require(owner() != adminAddress, "Owner can not be removed from admin role!");
    require(isAdmin(adminAddress), "Provided address is not admin.");

    uint rowToDelete = adminsMap[adminAddress];
    address keyToMove = adminList[adminList.length-1];
    adminList[rowToDelete] = keyToMove;
    adminsMap[keyToMove] = rowToDelete;
    adminList.pop();

    return rowToDelete;
  }

  /// @dev Throws if called by any account other than the owner.
  modifier onlyAdmin() {
    require(isAdmin(msg.sender), "Can be executed only by admin accounts!");
    _;
  }
}
