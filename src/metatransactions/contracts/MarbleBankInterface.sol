// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface MarbleBankInterface {

  /// @notice Deposits given amount of given token to the bank
  /// @dev Deposits the tokens to the user's account. If the account does not exists, it is created. Also requires that the user actually has the given amount of tokens. At the end, it emits Deposit event
  /// @param token Address of the token to be deposited
  /// @param amount Amount of tokens to be deposited
  /// @param to Address of a user to whose account the tokens are to be deposited
  /// @param note Note for the bank transaction
  function deposit(ERC20 token, uint256 amount, address to, string memory note) 
    external;

  /// @notice Withdraws the given amount of the given tokens from the user's account
  /// @dev Withdraws token from the user's account. Requires that the user has account for the given token and has at least the withdraw amount tokens stored in it. At the end, it emits Withdrawal event
  /// @param token Address of the token to be withdrawn
  /// @param amount Amount of the tokens to be withdrawn
  /// @param note Note for the bank transaction
  function withdraw(ERC20 token, uint256 amount, string memory note) 
    external;

  /// @notice Pays the given amount of given tokens to the specified address.
  /// @dev Transfers tokens to the given address decreasing balance of the user which is paying. Requires that the paying user has account for the  given token and enough tokens stored there. At the end, it emits Payment event
  /// @param token Address of the token to be paid with
  /// @param amount Amount of tokens to be paid
  /// @param to Address which receives the payment
  /// @param note Note for the bank transaction
  function pay(ERC20 token, uint256 amount, address to, string memory note) 
    external;

  /// @notice Execute payment by affiliate on behalf of a user
  /// @dev Transfers tokens from the specified account to the specified account. Requires that the msg.sender is affiiliate and the user on whose behalf the payment is executed has enough tokens in the bank. At the end, it emits Payment event
  /// @param token Address of the token to be paid with
  /// @param amount Amount of tokens to be paid
  /// @param from Address of the user which is paying
  /// @param to Address which receives the payment
  /// @param note Note for the bank transaction
  function payByAffiliate(ERC20 token, uint256 amount, address from, address to, string memory note) 
    external;

  /// @notice Checks whether the specified user has specified amount of tokens
  /// @dev This can be used by other contracts to check, whether a user has enough tokens to execute a payment.
  /// @param token Address of the tested token
  /// @param amount Amount of tokens to be checked
  /// @param user Address of the tested user
  /// @return hasEnough True, if the user has the corresponding account and specified amount of tokens, false otherwise
  function hasEnoughTokens(ERC20 token, uint256 amount, address user) 
    external 
    view 
    returns(bool hasEnough);

  /// @notice Get balance of the given tokens and the given user
  /// @param token Address of the token whose balance this method will return
  /// @param user Address of the user whose balance this method returns
  /// @return balance Amount of token the user has in his account (or zero if the account does not exist)
  function userBalance(ERC20 token, address user) 
    external 
    view 
    returns(uint256 balance);

  /// @notice Add the specified user to the list of bank's affiliates
  /// @dev Adds new affiliate. If the address already is affiliate, the transaction reverts. Can be executed only by the owner of this contract. At the end, emits AffiliateAdded event
  /// @param newAffiliate Address if the user
  function addAffiliate(address newAffiliate) 
    external;

  /// @notice Remove the specified user from the list of bank's affiliates
  /// @dev Removes the given affiliate. If the address is not affiliate, the transaction reverts. Can be executed only by the owner of this contract. At the end, it emits AffiliateRemoved contract
  /// @param affiliate Address if the user
  function removeAffiliate(address affiliate) 
    external;

  /// @notice Checkes, whether the given user is on the list of bank's affiliates
  /// @param testedAddress Address of the user to be tested
  /// @return addressIsAffiliate True, if the user is affiliate, false otherwise
  function isAffiliate(address testedAddress) 
    external 
    view 
    returns(bool addressIsAffiliate);

}