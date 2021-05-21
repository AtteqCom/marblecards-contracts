// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


/// @title Priceable interface
/// @notice Contract allows to handle ETH resources of the contract
interface PriceableInterface {

   /// @notice Emits when owner take ETH out of contract
   /// @param balance Amount of ETh sent out from contract
  event Withdraw(uint256 balance);

  /// @notice Remove all Ether from the contract, and transfer it to account of owner
  function withdrawBalance()
    external;

  // fallback functions that allows contract to accept ETH
  fallback() external payable;
  receive() external payable;

}
