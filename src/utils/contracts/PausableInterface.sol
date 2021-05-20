// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


/// @title Pausable interface
/// @notice Base contract which allows children to implement an emergency stop mechanism for maintainance purposes
interface PausableInterface {
  event Pause();
  event Unpause();

  /// @notice Called by the owner to pause, triggers stopped state
  function pause()
    external
    returns (bool);

  /// @notice Called by the owner to unpause, returns to normal state
  function unpause()
    external
    returns (bool);

}
