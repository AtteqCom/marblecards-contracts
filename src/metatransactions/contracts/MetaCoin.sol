pragma solidity ^0.6.0;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MetaCoin is ERC20 {
  constructor() ERC20("Meta coin", "MTC")
    public
  {
    _mint(msg.sender, 1000);
  }
}
