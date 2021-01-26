pragma solidity ^0.4.24;

import "@0xcert/ethereum-erc20/contracts/tokens/ERC20.sol";
import "@0xcert/ethereum-utils/contracts/ownership/Claimable.sol";
import "./MarbleBankInterface.sol";


contract TokenPriceable is Claimable {

  event TokensWithdrawal(ERC20 token, uint256 amount);

  // bank used for payments in tokens
  MarbleBankInterface public erc20Bank;

  /**
   * @dev charges the user for given amount of given erc20 tokens if the token is accepted for payments
   * @param _erc20 address of the erc20 token
   * @param _amount amount to be paid
   * @param _buyer address of the user/contract to be charged
   */
  modifier tokenPrice(ERC20 _erc20, uint256 _amount, address _buyer, string note) {
    require(erc20Bank.hasEnoughTokens(_erc20, _amount, _buyer), "Not enough tokens in the bank.");
    require(erc20Bank.isAffiliate(address(this)), "User cannot be charged by this contract.");
    _;
    erc20Bank.payByAffiliate(_erc20, _amount, _buyer, address(this), note);
  }

  /**
   * @dev Sets the bank contract used to execute payments with erc20 tokens.
   * @param _bank the contract
   */
  function setBankContract(MarbleBankInterface _bank) 
    external 
    onlyOwner 
  {
    erc20Bank = _bank;
  }

  /**
   * @dev Withdraws all tokens of given type.
   * @param _token type of the token
   */
  function withdrawTokens(ERC20 _token) external onlyOwner 
  {
    uint256 tokensAmount = _token.balanceOf(address(this));

    _token.transferFrom(address(this), owner, tokensAmount);

    emit TokensWithdrawal(_token, tokensAmount);   
  }

}