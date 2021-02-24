// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MarbleBankInterface.sol";


/// @title Bank contract for Marblegame
/// @notice This contract allows depositing and withdrawing any ERC20 type tokens for users. It also allows other Marble contracts to use this one for payments for their services (e.g. creating a page candidate)
contract MarbleBank is MarbleBankInterface, Ownable 
{

  string constant REVERT_TO_NULL_ADDRESS = "Transaction to null address";
  string constant REVERT_NOT_ENOUGH_TOKENS = "Not enough tokens";
  string constant REVERT_USER_ACCOUNT_DOES_NOT_EXIST = "User account does not exist";
  string constant REVERT_USER_DOES_NOT_HAVE_ACCOUNT_FOR_TOKEN = "Token account for the given user does not exist";
  string constant REVERT_AFFILIATE_NULL_ADDRESS = "Null address cannot be affiliate";
  string constant REVERT_USER_NOT_AFFILIATE = "User is not affiliate";
  string constant REVERT_USER_IS_AFFILIATE = "User is affiliate";

  /// @notice Event emited when a user deposits tokens to the bank
  /// @param from Address of the user which deposited the tokens
  /// @param to Address of the user whose account received the deposited tokens
  /// @param token Address of the token which was deposited
  /// @param amount Amount of the deposited tokens
  /// @param note Description of the transaction
  event Deposit(uint256 transactionId, address from, address to, address token, uint256 amount, string note);
  
  /// @notice Event emited when a user withdraws his tokens from the bank
  /// @param user Address of the user which withdrawn the tokens
  /// @param token Address of the token which was withdrawn
  /// @param amount Amount of the withdrawn tokens
  /// @param note Description of the transaction
  event Withdrawal(uint256 transactionId, address user, address token, uint256 amount, string note);

  /// @notice Event emited when a payment in tokens occurs
  /// @param from Address of the paying user
  /// @param to Address of the user which received the payment
  /// @param affiliate Address of the affiliate who executed the transaction
  /// @param token Address of the token in which the payment was executed
  /// @param amount Amount of the tokens transfered during the payment
  /// @param note Description of the transaction
  event Payment(uint256 transactionId, address from, address to, address affiliate, address token, uint256 amount, string note);
  
  /// @notice Event emited when a new affiliate is added
  /// @param affiliate Address of the affiliate
  event AffiliateAdded(address affiliate);

  /// @notice Event emited when an existing affiliate is removed
  /// @param affiliate Address of removed affiliate
  event AffiliateRemoved(address affiliate);

  /// @dev Structure holding information about a transaction
  /// @param id Unique identifier of the transaction
  /// @param from Address of the user from whose account tokens were transfered
  /// @param to Address of the user to whom the tokens were transfered
  /// @param affiliateExecuted Address of the affiliate who executed the transaction
  /// @param token Address of the tokens which were transfered
  /// @param amount Amount of the transfered tokens
  /// @param note Each transaction must contain a note describing the transaction
  /// @param timestamp Timestamp when the transaction was executed
  struct Transaction 
  {
    uint256 id;
    address from;
    address to;
    address affiliateExecuted;
    address token;
    uint256 amount;
    string note;
    uint256 timestamp;
  }

  /// @dev Structure representing user account in the bank
  /// @param userAddress Address of the user to which the account belongs
  /// @param tokenAccounts Subaccounts for each token the user interacted with inside the bank
  /// @param exists Marker variable specifying whether this account exists
  struct UserAccount 
  {
    address userAddress;
    mapping(address => UserTokenAccount) tokenAccounts;
    bool exists;
  }

  /// @dev Structure representing user's account for given token
  /// @param userAddress Address of the user to which the account belongs
  /// @param tokenAddress Address of the token which this account represents
  /// @param balance The amount of the given tokens the given user has in this account
  /// @param transactions History of all the transactions made with this account
  /// @param exists Marker variable specifying whether this account exists
  struct UserTokenAccount 
  {
    address userAddress;
    address tokenAddress;
    uint256 balance;
    uint256[] transactions;
    bool exists;
  }

  /// @dev Allows function call iff the given user has account for the given token
  /// @param user Address of the tested user
  /// @param token Address of the tested token
  modifier hasTokenAccount(address user, address token) 
  {
    require(accounts[user].exists, REVERT_USER_ACCOUNT_DOES_NOT_EXIST);
    require(accounts[user].tokenAccounts[token].exists, REVERT_USER_DOES_NOT_HAVE_ACCOUNT_FOR_TOKEN);
    _;
  }

  /// @dev Allows function call iff the given user is affiliate. Affiliate users have higher permissions, e.g. they can pay on user's behalf
  /// @param user Address of the tested user
  modifier mustBeAffiliate(address user) 
  {
    require(affiliates[user], REVERT_USER_NOT_AFFILIATE);
    _;
  }

  /// @dev Maps user address to his account
  mapping(address => UserAccount) public accounts;

  /// @dev Stores all the transactions executed on this contract
  mapping(uint256 => Transaction) public transactions;

  /// @dev Stores last transaction's id so we can assign unique id to each transaction
  uint256 lastTransactionId = 0;

  /// @dev Dictionary of bank affiliates. Affiliate users have higher permissions, e.g. they can pay on user's behalf. These will be other Marble contracts, so they can charge user for using their services
  mapping(address => bool) affiliates;

  /// @notice Deposits given amount of given token to the bank
  /// @dev Deposits the tokens to the user's account. If the account does not exists, it is created. Also requires that the user actually has the given amount of tokens. At the end, it emits Deposit event
  /// @param token Address of the token to be deposited
  /// @param amount Amount of tokens to be deposited
  /// @param to Address of a user to whose account the tokens are to be deposited
  /// @param note Note for the bank transaction
  function deposit(ERC20 token, uint256 amount, address to, string memory note) 
    override 
    external 
  {
    require(to != address(0), REVERT_TO_NULL_ADDRESS);
    require(token.balanceOf(msg.sender) >= amount, REVERT_NOT_ENOUGH_TOKENS);
    _createUserTokenAccountIfDoesntExist(to, token);
    _deposit(to, token, amount, note);
  }

  /// @notice Withdraws the given amount of the given tokens from the user's account
  /// @dev Withdraws token from the user's account. Requires that the user has account for the given token and has at least the withdraw amount tokens stored in it. At the end, it emits Withdrawal event
  /// @param token Address of the token to be withdrawn
  /// @param amount Amount of the tokens to be withdrawn
  /// @param note Note for the bank transaction
  function withdraw(ERC20 token, uint256 amount, string memory note) 
    override 
    external 
    hasTokenAccount(msg.sender, address(token))
  {
    require(_userBalance(msg.sender, token) >= amount, REVERT_NOT_ENOUGH_TOKENS);
    _withdraw(msg.sender, token, amount, note);
  }


  /// @notice Pays the given amount of given tokens to the specified address
  /// @dev Transfers tokens to the given address, decreasing balance of the user which is paying. Requires that the paying user has account for the  given token and enough tokens stored there. At the end, it emits Payment event
  /// @param token Address of the token to be paid with
  /// @param amount Amount of tokens to be paid
  /// @param to Address which receives the payment
  /// @param note Note for the bank transaction
  function pay(ERC20 token, uint256 amount, address to, string memory note) 
    override 
    external 
    hasTokenAccount(msg.sender, address(token)) 
  {
    require(to != address(0), REVERT_TO_NULL_ADDRESS);
    require(_userBalance(msg.sender, token) >= amount, REVERT_NOT_ENOUGH_TOKENS);
    _pay(msg.sender, to, address(0), token, amount, note);
  }

  /// @notice Execute payment by affiliate on behalf of a user
  /// @dev Transfers tokens from the specified account to the specified account. Requires that the msg.sender is affiiliate and the user on whose behalf the payment is executed has enough tokens in the bank. At the end, it emits Payment event
  /// @param token Address of the token to be paid with
  /// @param amount Amount of tokens to be paid
  /// @param from Address of the user which is paying
  /// @param to Address which receives the payment
  /// @param note Note for the bank transaction
  function payByAffiliate(ERC20 token, uint256 amount, address from, address to, string memory note) 
    override 
    external 
    mustBeAffiliate(msg.sender) 
    hasTokenAccount(from, address(token)) 
  {
    require(to != address(0), REVERT_TO_NULL_ADDRESS);
    require(_userBalance(from, token) >= amount, REVERT_NOT_ENOUGH_TOKENS);
    _pay(from, to, msg.sender, token, amount, note);
  }

  /// @notice Checks whether the specified user has specified amount of tokens
  /// @dev This can be used by other contracts to check, whether a user has enough tokens to execute a payment.
  /// @param token Address of the tested token
  /// @param amount Amount of tokens to be checked
  /// @param user Address of the tested user
  /// @return hasEnough True, if the user has the corresponding account and specified amount of tokens, false otherwise
  function hasEnoughTokens(ERC20 token, uint256 amount, address user) 
    override 
    external 
    view
    returns(bool hasEnough)
  {
    if (!accounts[user].exists || !accounts[user].tokenAccounts[address(token)].exists) 
    {
      return false;
    }

    return accounts[user].tokenAccounts[address(token)].balance >= amount;
  }

  /// @notice Get balance of the given tokens and the given user
  /// @param token Address of the token whose balance this method will return
  /// @param user Address of the user whose balance this method returns
  /// @return balance Amount of token the user has in his account (or zero if the account does not exist)
  function userBalance(ERC20 token, address user) 
    override 
    external 
    view 
    returns(uint256 balance) 
  {
    if (!accounts[user].exists || !accounts[user].tokenAccounts[address(token)].exists) 
    {
      return 0;
    }

    return _userBalance(user, token);
  }

  /// @notice Add the specified user to the list of bank's affiliates
  /// @dev Adds new affiliate. If the address already is affiliate, the transaction reverts. Can be executed only by the owner of this contract. At the end, emits AffiliateAdded event
  /// @param newAffiliate Address if the user
  function addAffiliate(address newAffiliate) 
    override 
    external 
    onlyOwner 
  {
    require(newAffiliate != address(0), REVERT_AFFILIATE_NULL_ADDRESS);
    require(!affiliates[newAffiliate], REVERT_USER_IS_AFFILIATE);
    affiliates[newAffiliate] = true;

    emit AffiliateAdded(newAffiliate);
  }

  /// @notice Remove the specifiied user from the list of bank's affiliates
  /// @dev Removes the given affiliate. If the address is not affiliate, the transaction reverts. Can be executed only by the owner of this contract. At the end, it emits AffiliateRemoved contract
  /// @param affiliate Address if the user
  function removeAffiliate(address affiliate) 
    override 
    external 
    onlyOwner 
  {
    require(affiliates[affiliate], REVERT_USER_NOT_AFFILIATE);
    affiliates[affiliate] = false;

    emit AffiliateRemoved(affiliate);
  }

  /// @notice Checkes, whether the given user is on the list of bank's affiliates
  /// @param testedAddress Address of the user to be tested
  /// @return addressIsAffiliate True, if the user is affiliate, false otherwise
  function isAffiliate(address testedAddress) 
    override 
    external 
    view 
    returns(bool addressIsAffiliate) 
  {
    return affiliates[testedAddress];
  }

  /// @dev Creates account for the given user and given token if it does not exists. Firstly, it creates account for the user (if does not exist) and then the token account (if does not exists)
  /// @param userAddress Address of the user whose account is to be created
  /// @param token Address of the token for which the account is to be created
  function _createUserTokenAccountIfDoesntExist(address userAddress, ERC20 token) 
    private 
  {
    if (!accounts[userAddress].exists) 
    {
      UserAccount storage newUserAccount = accounts[userAddress];
      newUserAccount.userAddress = userAddress;
      newUserAccount.exists = true;
    } 
    
    if (!accounts[userAddress].tokenAccounts[address(token)].exists) 
    {
      UserTokenAccount storage newTokenAccount = accounts[userAddress].tokenAccounts[address(token)];
      newTokenAccount.userAddress = userAddress;
      newTokenAccount.tokenAddress = address(token);
      newTokenAccount.balance = 0;
      newTokenAccount.exists = true;
    }
  }

  /// @dev Deposits given amount of tokens to user's account, transfering them from the msg.sender's address to the bank and increasing balance of the user's account
  /// @param accountAddress Address of the user to whose account the tokens are to be deposited
  /// @param token Address of the tokens which are to be transfered
  /// @param amount Amount of the tokens to be transfered
  /// @param note Note for the bank transaction
  function _deposit(address accountAddress, ERC20 token, uint256 amount, string memory note) 
    private 
  {
    address sender = msg.sender;
    token.transferFrom(sender, address(this), amount);

    accounts[accountAddress].tokenAccounts[address(token)].balance += amount;
    accounts[accountAddress].tokenAccounts[address(token)].transactions.push(
      _createTransaction(sender, accountAddress, address(0), address(token), amount, note)
    );
    
    emit Deposit(lastTransactionId, sender, accountAddress, address(token), amount, note);
  }

  /// @dev Executes payment from specified user's account to the specified user. It transfers toknes from the bank to the user and decreases balance of the paying user
  /// @param from Address of the user from whose account the tokens will be transfered
  /// @param to Address where the tokens are to be transfered
  /// @param paidByAffiliate Address of the affiliate who executed the transaction
  /// @param token Address of the tokens which are to be transfered
  /// @param amount Amount of the tokens to be transfered
  /// @param note Note for the bank transaction
  function _pay(address from, address to, address paidByAffiliate, ERC20 token, uint256 amount, string memory note) 
    private 
  {
    UserTokenAccount storage userTokenAccount = accounts[from].tokenAccounts[address(token)];
    
    token.transfer(to, amount);
    userTokenAccount.balance -= amount;
    userTokenAccount.transactions.push(
      _createTransaction(from, to, paidByAffiliate, address(token), amount, note)
    );

    emit Payment(lastTransactionId, from, to, paidByAffiliate, address(token), amount, note);
  }

  /// @dev Withdraws tokens from the given account. It transfers the tokens from the bank to the user address and decreases the balance on the account
  /// @param user Address of the user from whose account the tokens are to be withdrawn
  /// @param token Address of the tokens to be withdrawn
  /// @param amount Amount of the tokens to be withdrawn
  /// @param note Note for the bank transaction
  function _withdraw(address user, ERC20 token, uint256 amount, string memory note) 
    private 
  {
    UserTokenAccount storage userTokenAccount = accounts[user].tokenAccounts[address(token)];

    token.transfer(user, amount);
    userTokenAccount.balance -= amount;
    userTokenAccount.transactions.push(
      _createTransaction(address(this), user, address(0), address(token), amount, note)
    );

    emit Withdrawal(lastTransactionId, user, address(token), amount, note);
  }

  /// @dev Creates and stores new transaction entry and increases the transactions counter (lastTransactionId)
  /// @param from Address from which's account the tokens are transfered
  /// @param to Address which receives the tokens
  /// @param affiliateExecuted Address of the affiliate who executed the transaction
  /// @param token Address of the transfered token
  /// @param amount Amount of the transfered tokens
  /// @param note Description of the bank transaction
  /// @return transactionId Id of the bank transaction
  function _createTransaction(address from, address to, address affiliateExecuted, address token, uint256 amount, string memory note) 
    private 
    returns (uint256 transactionId)
  {
    uint256 transactionId = ++lastTransactionId;
    transactions[transactionId] = Transaction(
      {
        id: transactionId,
        from: from,
        to: to,
        affiliateExecuted: affiliateExecuted,
        token: token,
        amount: amount,
        note: note,
        timestamp: block.timestamp
      }
    );

    return transactionId;
  }

  /// @dev Checks the amount of tokens stored in the given account
  /// @param userAddress Address of the user whose account is to be queried
  /// @param token Address of the tokens whose amount is to be queried
  /// @return balance Amount of the tokens in the account
  function _userBalance(address userAddress, ERC20 token) 
    private 
    view 
    returns(uint256 balance)
  {
    return accounts[userAddress].tokenAccounts[address(token)].balance;
  }

}