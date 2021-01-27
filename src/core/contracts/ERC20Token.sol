pragma solidity ^0.4.24;


import "@0xcert/ethereum-erc20/contracts/tokens/Token.sol";


contract ERC20Token is Token {

  constructor()
    public
  {
    tokenName = "My Token";
    tokenSymbol = "MTK";
    tokenDecimals = 2;
    tokenTotalSupply = 10000;
    balances[msg.sender] = tokenTotalSupply; // Give the owner of the contract the whole balance
  }

}