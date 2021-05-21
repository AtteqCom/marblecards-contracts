// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../bank/contracts/MarbleBankInterface.sol";


/// @title TokenPriceableInterface
/// @notice This contract adds functionality to charge callees in ERC20 tokens
interface TokenPriceableInterface {

  /// @notice Event emitted when tokens of given amount are withdrawn from the contract (by owner)
  /// @param token Address of the tokens which were withdrawn
  /// @param amount Amount of the withdrawn tokens
  event TokensWithdrawal(ERC20 token, uint256 amount);

  /// @notice Sets the bank contract used to execute payments with erc20 tokens
  /// @param bank The contract address
  function setBankContract(MarbleBankInterface bank) 
    external;

  /// @notice Withdraws all tokens of the given type
  /// @dev Transfer all tokens of the given type to the owner of this contract
  /// @param token Address of the token
  function withdrawTokens(ERC20 token) 
    external;

}