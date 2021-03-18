// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


/// @title ERC20 token
/// @dev This is used only for unit tests
contract MetaCoin is ERC20 {
  constructor() ERC20("Meta coin", "MTC")
  {
    uint256 mtc = 1e18;
    _mint(msg.sender, mtc * 10000);
  }
}
