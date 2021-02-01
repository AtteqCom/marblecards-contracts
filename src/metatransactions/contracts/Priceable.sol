pragma solidity ^0.6.0;


import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Priceable
 * @dev Contracts allows to handle ETH resources of the contract.
 */
contract Priceable is Ownable {

  using SafeMath for uint256;

  /**
   * @dev Emits when owner take ETH out of contract
   * @param balance - amount of ETh sent out from contract
   */
  event Withdraw(uint256 balance);

  /**
   * @dev modifier Checks minimal amount, what was sent to function call.
   * @param _minimalAmount - minimal amount neccessary to  continue function call
   */
  modifier minimalPrice(uint256 _minimalAmount) {
    require(msg.value >= _minimalAmount, "Not enough Ether provided.");
    _;
  }

  /**
   * @dev modifier Associete fee with a function call. If the caller sent too much, then is refunded, but only after the function body.
   * This was dangerous before Solidity version 0.4.0, where it was possible to skip the part after `_;`.
   * @param _amount - ether needed to call the function
   */
  modifier price(uint256 _amount) {
    require(msg.value >= _amount, "Not enough Ether provided.");
    _;
    if (msg.value > _amount) {
      msg.sender.transfer(msg.value.sub(_amount));
    }
  }

  /*
   * @dev Remove all Ether from the contract, and transfer it to account of owner
   */
  function withdrawBalance()
    external
    onlyOwner
  {
    uint256 balance = address(this).balance;
    msg.sender.transfer(balance);

    // Tell everyone !!!!!!!!!!!!!!!!!!!!!!
    emit Withdraw(balance);
  }

  // fallback function that allows contract to accept ETH
  fallback() external payable {}
}
