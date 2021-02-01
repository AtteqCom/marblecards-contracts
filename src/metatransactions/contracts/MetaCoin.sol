// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MetaCoin is ERC20 {
  constructor() ERC20("Meta coin", "MTC")
  {
    _mint(msg.sender, 1000);
  }
}
