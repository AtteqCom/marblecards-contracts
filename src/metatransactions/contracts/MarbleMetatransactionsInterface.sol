// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


import "./marble/MarbleNFTFactory.sol";
import "./MarbleAuctionMetatransactionsInterface.sol";
import "./MarbleBankMetatransactionsInterface.sol";
import "./MarbleCandidateMetatransactionsInterface.sol";
import "./MarbleNFTMetatransactionsInterface.sol";


/// @title Metatransactions support for Marble.Card Dapp
/// @dev Since our original contracts do not support metatransactions, we have implemented this wrapper contract
interface MarbleMetatransactionsInterface is MarbleAuctionMetatransactionsInterface, 
  MarbleBankMetatransactionsInterface, MarbleCandidateMetatransactionsInterface, 
  MarbleNFTMetatransactionsInterface 
{

  /// @notice Sets the marble nft factory contract
  /// @dev Can be called only by the owner of this contract
  function setMarbleFactoryContract(MarbleNFTFactory _marbleNFTFactoryContract) 
    external;

}
