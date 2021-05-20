// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../../bank/contracts/MarbleBankInterface.sol";


/// @title TokenPriceable
/// @notice This contract adds functionality to charge callees in ERC20 tokens
contract TokenPriceable is Ownable {

  /// @notice Event emitted when tokens of given amount are withdrawn from the contract (by owner)
  /// @param token Address of the tokens which were withdrawn
  /// @param amount Amount of the withdrawn tokens
  event TokensWithdrawal(ERC20 token, uint256 amount);

  /// @notice Address of the bank contract
  /// @dev This contract is used to handle the token transactions
  MarbleBankInterface public erc20Bank;

  /// @notice Charges the user for given amount of given erc20 tokens. Reverts if the user does not have enough tokens in the bank
  /// @param erc20 Address of the erc20 token
  /// @param amount Amount of tokens to be paid
  /// @param buyer Address of the user/contract to be charged
  /// @param note Note for the bank to store with the transaction
  modifier tokenPrice(ERC20 erc20, uint256 amount, address buyer, string memory note) 
  {
    require(erc20Bank.hasEnoughTokens(erc20, amount, buyer), "Not enough tokens in the bank.");
    require(erc20Bank.isAffiliate(address(this)), "User cannot be charged by this contract.");
    _;
    erc20Bank.payByAffiliate(erc20, amount, buyer, address(this), note);
  }

  /// @notice Sets the bank contract used to execute payments with erc20 tokens
  /// @param bank The contract address
  function setBankContract(MarbleBankInterface bank) 
    external 
    onlyOwner 
  {
    erc20Bank = bank;
  }

  /// @dev Executes payment from one adress to another using bank contract
  /// @param erc20 Address of the erc20 token
  /// @param amount Amount of tokens to be paid
  /// @param from Address of the user/contract to be charged
  /// @param to Address of the user/contract to receive the tokens
  /// @param note Note for the bank to store with the transaction
  function _pay(ERC20 erc20, uint256 amount, address from, address to, string memory note)
    internal
  {
    require(erc20Bank.hasEnoughTokens(erc20, amount, from), "Not enough tokens in the bank.");
    require(erc20Bank.isAffiliate(address(this)), "User cannot be charged by this contract.");
    erc20Bank.payByAffiliate(erc20, amount, from, to, note);
  }

  /// @notice Withdraws all tokens of the given type
  /// @dev Transfer all tokens of the given type to the owner of this contract
  /// @param token Address of the token
  function withdrawTokens(ERC20 token) 
    external 
    onlyOwner 
  {
    uint256 tokensAmount = token.balanceOf(address(this));

    token.transfer(owner(), tokensAmount);

    emit TokensWithdrawal(token, tokensAmount);   
  }

}