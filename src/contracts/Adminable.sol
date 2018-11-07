pragma solidity ^0.4.24;

import "@0xcert/ethereum-utils/contracts/ownership/Claimable.sol";

/**
 * @title Adminable
 * @dev Allows to manage privilages to special contract functionality.
 */
contract Adminable is Claimable {
  mapping(address => uint) public adminsMap;
  address[] public adminList;

  /**
   * @dev Returns true, if provided address has special privilages, otherwise false
   * @param adminAddress - address to check
   */
  function isAdmin(address adminAddress)
    public
    constant
    returns(bool isIndeed)
  {
    if (adminAddress == owner) return true;

    if (adminList.length == 0) return false;
    return (adminList[adminsMap[adminAddress]] == adminAddress);
  }

  /**
   * @dev Grants special rights for address holder
   * @param adminAddress - address of future admin
   */
  function addAdmin(address adminAddress)
    public
    onlyOwner
    returns(uint index)
  {
    require(!isAdmin(adminAddress), "Address already has admin rights!");

    adminsMap[adminAddress] = adminList.push(adminAddress)-1;

    return adminList.length-1;
  }

  /**
   * @dev Removes special rights for provided address
   * @param adminAddress - address of current admin
   */
  function removeAdmin(address adminAddress)
    public
    onlyOwner
    returns(uint index)
  {
    // we can not remove owner from admin role
    require(owner != adminAddress, "Owner can not be removed from admin role!");
    require(isAdmin(adminAddress), "Provided address is not admin.");

    uint rowToDelete = adminsMap[adminAddress];
    address keyToMove = adminList[adminList.length-1];
    adminList[rowToDelete] = keyToMove;
    adminsMap[keyToMove] = rowToDelete;
    adminList.length--;

    return rowToDelete;
  }

  /**
   * @dev modifier Throws if called by any account other than the owner.
   */
  modifier onlyAdmin() {
    require(isAdmin(msg.sender), "Can be executed only by admin accounts!");
    _;
  }
}
