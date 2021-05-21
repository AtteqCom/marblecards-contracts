// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PriceableInterface.sol";

/// @title Priceable
/// @notice Contract allows to handle ETH resources of the contract
contract Priceable is PriceableInterface, Ownable {

  using SafeMath for uint256;

  /// @notice Checks minimal amount, that was sent to function call
  /// @param _minimalAmount Minimal amount neccessary to  continue function call
  modifier minimalPrice(uint256 _minimalAmount) 
  {
    require(msg.value >= _minimalAmount, "Not enough Ether provided.");
    _;
  }

  /// @notice Associete fee with a function call. If the caller sent too much, then is refunded, but only after the function body
  /// @dev This was dangerous before Solidity version 0.4.0, where it was possible to skip the part after `_;`.
  /// @param _amount Ether needed to call the function
  modifier price(uint256 _amount) 
  {
    require(msg.value >= _amount, "Not enough Ether provided.");
    _;
    if (msg.value > _amount) 
    {
      msg.sender.transfer(msg.value.sub(_amount));
    }
  }

  /// @notice Remove all Ether from the contract, and transfer it to account of owner
  function withdrawBalance()
    override
    external
    onlyOwner
  {
    uint256 balance = address(this).balance;
    msg.sender.transfer(balance);

    // Tell everyone !!!!!!!!!!!!!!!!!!!!!!
    emit Withdraw(balance);
  }

  // fallback functions that allows contract to accept ETH
  fallback() override external payable {}
  receive() override external payable {}

}
