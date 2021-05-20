// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


import "./MarbleMetatransactionsBase.sol";
import "./MarbleMetatransactionsInterface.sol";
import "./MarbleAuctionMetatransactions.sol";
import "./MarbleBankMetatransactions.sol";
import "./MarbleCandidateMetatransactions.sol";
import "./MarbleNFTMetatransactions.sol";
import "./Ownable.sol";
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";


/// @title Metatransactions support for Marble.Card Dapp
/// @dev Since our original contracts do not support metatransactions, we have implemented this wrapper contract. 
///   We also need to use custom Ownable contract, because Ownable from openzeppelin contains _msgSender function which 
///   clashes with the one from BaseRelayRecipient contract.
contract MarbleMetatransactions is MarbleMetatransactionsBase, MarbleMetatransactionsInterface, 
  MarbleAuctionMetatransactions, MarbleBankMetatransactions, MarbleCandidateMetatransactions,
  MarbleNFTMetatransactions
{

  /// @param _trustedForwarder Address of the forwarder which we trust (has permissions to execute functions on this contract)
  /// @param _marbleNFTFactoryContract Address of the marble nft factory contract
  constructor(address _trustedForwarder, MarbleNFTFactory _marbleNFTFactoryContract)
    public
  {
    trustedForwarder = _trustedForwarder;
		marbleNFTFactoryContract = _marbleNFTFactoryContract;
	}

  /// @notice Sets the marble nft factory contract
  /// @dev Can be called only by the owner of this contract
  function setMarbleFactoryContract(MarbleNFTFactory _marbleNFTFactoryContract) 
    override(MarbleMetatransactionsBase, MarbleMetatransactionsInterface)
    external 
    onlyOwner 
  {
    marbleNFTFactoryContract = _marbleNFTFactoryContract;
  }

}
