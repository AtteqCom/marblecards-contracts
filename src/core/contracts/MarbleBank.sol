pragma solidity ^0.4.24;

import "@0xcert/ethereum-erc20/contracts/tokens/ERC20.sol";
import "@0xcert/ethereum-utils/contracts/ownership/Ownable.sol";
import "./MarbleBankInterface.sol";


contract MarbleBank is MarbleBankInterface, Ownable {

  string constant REVERT_NOT_ENOUGH_TOKENS = "Not enough tokens";
  string constant REVERT_USER_ACCOUNT_DOES_NOT_EXIST = "User account does not exist";
  string constant REVERT_USER_DOES_NOT_HAVE_ACCOUNT_FOR_TOKEN = "Token account for the given user does not exist";
  string constant REVERT_USER_NOT_AFFILIATE = "User is not affiliate";
  string constant REVERT_USER_IS_AFFILIATE = "User is affiliate";

  event Deposit(address from, address token, uint256 amount);
  event Payment(address from, address to, address token, uint256 amount);
  event Withdrawal(address user, address token, uint256 amount);
  event AffiliateAdded(address affiliate);
  event AffiliateRemoved(address affiliate);

  /**
   * Information about a transaction
   */
  struct Transaction {
    uint256 id;
    address from;
    address to;
    string note;
    uint256 timestamp;
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
    require(accounts[user].exists, REVERT_USER_ACCOUNT_DOES_NOT_EXIST);
    require(accounts[user].tokenAccounts[token].exists, REVERT_USER_DOES_NOT_HAVE_ACCOUNT_FOR_TOKEN);
    _;
  }

  modifier mustBeAffiliate(address user) {
    require(affiliates[user], REVERT_USER_NOT_AFFILIATE);
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
    require(token.balanceOf(msg.sender) >= amount, REVERT_NOT_ENOUGH_TOKENS);

    _createUserTokenAccountIfDoesntExist(msg.sender, token);
    _deposit(msg.sender, token, amount, note);
  }

  /**
   * @dev Withdraws givem amount of given tokens of the sender, if the balance permit's it.
   * @param token eddress of the erc20 token to be withdrawn
   * @param amount amount of the tokens to be withdrawn
   * @param note every transaction has its note
   */
  function withdraw(ERC20 token, uint256 amount, string note) external {
    require(_userBalance(msg.sender, token) >= amount, REVERT_NOT_ENOUGH_TOKENS);

    _withdraw(msg.sender, token, amount, note);
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
    return _userBalance(msg.sender, token);
  }

  /**
   * @dev Adds new affiliate. If the address already is affiliate, the transaction reverts.
   */
  function addAffiliate(address newAffiliate) external onlyOwner {
    require(!affiliates[newAffiliate], REVERT_USER_IS_AFFILIATE);
    affiliates[newAffiliate] = true;

    emit AffiliateAdded(newAffiliate);
  }

  /**
   * @dev Removes given affiliate. If the address is not affiliate, the transaction reverts.
   */
  function removeAffiliate(address affiliate) external onlyOwner {
    require(affiliates[affiliate], REVERT_USER_NOT_AFFILIATE);
    affiliates[affiliate] = false;

    emit AffiliateRemoved(affiliate);
  }

  /**
   * @dev Checks whether the given address is affiliate.
   * @param testedAddress address to be tested
   */
  function isAffiliate(address testedAddress) external view returns(bool) {
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
      timestamp: now
    }));
    
    emit Deposit(from, token, amount);
  }

  function _pay(address from, address to, ERC20 token, uint256 amount, string note) private hasTokenAccount(from, token) {
    UserTokenAccount storage userTokenAccount = accounts[from].tokenAccounts[address(token)];
    require(userTokenAccount.balance >= amount, REVERT_NOT_ENOUGH_TOKENS);

    token.transfer(to, amount);
    userTokenAccount.balance -= amount;
    userTokenAccount.transactions.push(Transaction({
      id: ++lastTransactionId,
      from: from,
      to: to,
      note: note,
      timestamp: now
    }));

    emit Payment(from, to, token, amount);
  }

  function _withdraw(address user, ERC20 token, uint256 amount, string note) private {
    UserTokenAccount storage userTokenAccount = accounts[user].tokenAccounts[address(token)];

    token.transfer(user, amount);
    userTokenAccount.balance -= amount;
    userTokenAccount.transactions.push(Transaction({
      id: ++lastTransactionId,
      from: address(this),
      to: user,
      note: note,
      timestamp: now
    }));

    emit Withdrawal(user, token, amount);
  }

  function _userBalance(address userAddress, ERC20 token) private view hasTokenAccount(userAddress, token) returns(uint256) {
    return accounts[userAddress].tokenAccounts[address(token)].balance;
  }

}