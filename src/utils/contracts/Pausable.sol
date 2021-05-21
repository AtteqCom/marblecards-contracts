// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PausableInterface.sol";

/// @title Pausable
/// @notice Base contract which allows children to implement an emergency stop mechanism for maintainance purposes
contract Pausable is PausableInterface, Ownable {

  /// @notice Specifies whether the contract is paused at the moment
  bool public paused = false;


  /// @notice Modifier to allow actions only when the contract IS paused
  modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
  }

  /// @notice Modifier to allow actions only when the contract IS NOT paused
  modifier whenPaused {
    require(paused, "Contract is not paused");
    _;
  }

  /// @notice Called by the owner to pause, triggers stopped state
  function pause()
    override
    external
    onlyOwner
    whenNotPaused
    returns (bool)
  {
    paused = true;
    emit Pause();
    return true;
  }

  /// @notice Called by the owner to unpause, returns to normal state
  function unpause()
    override
    external
    onlyOwner
    whenPaused
    returns (bool)
  {
    paused = false;
    emit Unpause();
    return true;
  }
}
