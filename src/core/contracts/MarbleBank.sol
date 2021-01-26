pragma solidity ^0.4.24;

import "@0xcert/ethereum-erc20/contracts/tokens/ERC20.sol";
import "@0xcert/ethereum-utils/contracts/ownership/Ownable.sol";
import "./MarbleBankInterface.sol";


contract MarbleBank is MarbleBankInterface, Ownable {

  event Deposit(address from, address token, uint256 amount);
  event Payment(address from, address to, address token, uint256 amount);
  event AffiliateAdded(address affiliate);
  event AffiliateRemoved(address affiliate);

  /**
   * Information about a transactio
   */
  struct Transaction {
    uint256 id;
    address from;
    address to;
    string note;
    uint256 timestamp;
    bool isDeposit;
  }

  struct UserAccount {
    address userAddress;
    mapping(address => UserTokenAccount) tokenAccounts;
    bool exists;
  }

  struct UserTokenAccount {
    address userAddress;
    address tokenAddress;
    uint256 balance;
    Transaction[] transactions;
    bool exists;
  }

  modifier hasTokenAccount(address user, address token) {
    require(accounts[user].exists, "User account does not exist");
    require(accounts[user].tokenAccounts[token].exists, "Token account for the given user does not exist");
    _;
  }

  modifier mustBeAffiliate(address user) {
    require(affiliates[user], "User is not affiliate");
    _;
  }

  // maps user address to his deposits
  mapping(address => UserAccount) accounts;

  // stores last transaction id
  uint256 public lastTransactionId = 0;

  // stores which addresses are affiliates
  mapping(address => bool) affiliates;

  /**
   * @dev Deposits given amount of given erc20 token to the bank.
   * @param token address of the erc20 token to be deposited
   * @param amount amount of tokens to be deposited
   * @param note every transaction has its note
   */
  function deposit(ERC20 token, uint256 amount, string note) external {
    require(token.balanceOf(msg.sender) >= amount, "Not enough tokens");

    _createUserTokenAccountIfDoesntExist(msg.sender, token);
    _deposit(msg.sender, token, amount, note);
  }


  /**
   * @dev Pays given amount of given tokens.
   * @param token address of the erc20 token to be paid with
   * @param amount amount of tokens to be paid
   * @param to address which receives the payment
   * @param note every transaction has its note
   */
  function pay(ERC20 token, uint256 amount, address to, string note) external {
    _pay(msg.sender, to, token, amount, note);
  }

  /**
   * @dev Execute payment of a user by affiliate.
   * @param token address of the erc20 token to be paid with
   * @param amount amount of tokens to be paid
   * @param from user which is paying
   * @param to address which receives the payment
   * @param note every transaction has its note
   */
  function payByAffiliate(ERC20 token, uint256 amount, address from, address to, string note) external mustBeAffiliate(msg.sender) {
    _pay(from, to, token, amount, note);
  }

  /**
   * @dev Checks whether the user has given amount of given tokens deposited in the bank.
   * @param token address of the erc20 token
   * @param amount amount of tokens to be checked
   * @param user the user whose deposit is to be checked
   */
  function hasEnoughTokens(ERC20 token, uint256 amount, address user) external view hasTokenAccount(user, token) returns(bool) {
    return accounts[user].tokenAccounts[address(token)].balance >= amount;
  }

  /**
   * @dev Get balance of given tokens of the sender of this transaction.
   * @param token token whose balance this method will return
   */
  function userBalance(ERC20 token) external view hasTokenAccount(msg.sender, token) returns(uint256) {
    return accounts[msg.sender].tokenAccounts[address(token)].balance;
  }

  /**
   * @dev Adds new affiliate. If the address already is affiliate, the transaction reverts.
   */
  function addAffiliate(address newAffiliate) external onlyOwner {
    require(!affiliates[newAffiliate], "The address is already affiliate");
    affiliates[newAffiliate] = true;

    emit AffiliateAdded(newAffiliate);
  }

  /**
   * @dev Removes given affiliate. If the address is not affiliate, the transaction reverts.
   */
  function removeAffiliate(address affiliate) external onlyOwner {
    require(affiliates[affiliate], "The address is not affiliate");
    affiliates[affiliate] = false;

    emit AffiliateRemoved(affiliate);
  }

  /**
   * @dev Checks whether the given address is affiliate.
   * @param testedAddress address to be tested
   */
  function isAffiliate(address testedAddress) external view returns(bool){
    return affiliates[testedAddress];
  }

  function _createUserTokenAccountIfDoesntExist(address userAddress, ERC20 token) private {
    if (!accounts[userAddress].exists) {
      accounts[userAddress] = UserAccount({
        userAddress: userAddress,
        exists: true
      });
    } 
    
    if (!accounts[userAddress].tokenAccounts[address(token)].exists) {
      UserTokenAccount storage newTokenAccount = accounts[userAddress].tokenAccounts[address(token)];
      newTokenAccount.userAddress = userAddress;
      newTokenAccount.tokenAddress = address(token);
      newTokenAccount.balance = 0;
      newTokenAccount.exists = true;
    }
  }

  function _deposit(address from, ERC20 token, uint256 amount, string note) private {
    token.transferFrom(from, address(this), amount);
    accounts[from].tokenAccounts[address(token)].balance += amount;
    accounts[from].tokenAccounts[address(token)].transactions.push(Transaction({
      id: ++lastTransactionId,
      from: from,
      to: address(this),
      note: note,
      timestamp: now,
      isDeposit: true
    }));
    
    emit Deposit(from, token, amount);
  }

  function _pay(address from, address to, ERC20 token, uint256 amount, string note) private hasTokenAccount(from, token) {
    UserTokenAccount storage userTokenAccount = accounts[from].tokenAccounts[address(token)];
    require(userTokenAccount.balance >= amount, "Not enough tokens for the payment");

    token.transferFrom(from, to, amount);
    userTokenAccount.balance += amount;
    userTokenAccount.transactions.push(Transaction({
      id: ++lastTransactionId,
      from: from,
      to: to,
      note: note,
      timestamp: now,
      isDeposit: false
    }));

    emit Payment(from, to, token, amount);
  }

}