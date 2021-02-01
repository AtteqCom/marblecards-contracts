pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface MarbleBankInterface {

  /**
   * @dev Deposits given amount of given erc20 token to the bank.
   * @param token address of the erc20 token to be deposited
   * @param amount amount of tokens to be deposited
   * @param note every transaction has its note
   */
  function deposit(ERC20 token, uint256 amount, string memory note) external;

  /**
   * @dev Withdraws givem amount of given tokens of the sender, if the balance permit's it.
   * @param token eddress of the erc20 token to be withdrawn
   * @param amount amount of the tokens to be withdrawn
   * @param note every transaction has its note
   */
  function withdraw(ERC20 token, uint256 amount, string memory note) external;

  /**
   * @dev Pays given amount of given tokens.
   * @param token address of the erc20 token to be paid with
   * @param amount amount of tokens to be paid
   * @param to address which receives the payment
   * @param note every transaction has its note
   */
  function pay(ERC20 token, uint256 amount, address to, string memory note) external;

  /**
   * @dev Execute payment of a user by affiliate.
   * @param token address of the erc20 token to be paid with
   * @param amount amount of tokens to be paid
   * @param from user which is paying
   * @param to address which receives the payment
   * @param note every transaction has its note
   */
  function payByAffiliate(ERC20 token, uint256 amount, address from, address to, string memory note) external;

  /**
   * @dev Get balance of given tokens of the sender of this transaction.
   * @param token token whose balance this method will return
   */
  function userBalance(ERC20 token) external view returns(uint256);

  /**
   * @dev Checks whether the user has given amount of given tokens deposited in the bank.
   * @param token address of the erc20 token
   * @param amount amount of tokens to be checked
   * @param user the user whose deposit is to be checked
   */
  function hasEnoughTokens(ERC20 token, uint256 amount, address user) external view returns(bool);

  /**
   * @dev Adds new affiliate. If the address already is affiliate, the transaction reverts.
   */
  function addAffiliate(address newAffiliate) external;

  /**
   * @dev Removes given affiliate. If the address is not affiliate, the transaction reverts.
   */
  function removeAffiliate(address affiliate) external;

  /**
   * @dev Checks whether the given address is affiliate.
   * @param testedAddress address to be tested
   */
  function isAffiliate(address testedAddress) external view returns(bool);

}