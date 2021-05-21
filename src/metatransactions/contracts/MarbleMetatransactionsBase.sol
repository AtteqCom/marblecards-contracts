// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


import "./marble/MarbleNFTFactory.sol";
import "./Ownable.sol";
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";

/// @title Base contract for all metatransaction contracts for Marble.Cards
abstract contract MarbleMetatransactionsBase is BaseRelayRecipient, Ownable {

  /// @notice Address of the marble nft factory contract
  MarbleNFTFactory public marbleNFTFactoryContract;

  /// @notice Sets the trusted forwarder which has permissions to execute functions on this contract
  /// @param _trustedForwarder Address of the trusted forwarder
  function setTrustedForwarder(address _trustedForwarder)
    external
    onlyOwner
  {
    trustedForwarder = _trustedForwarder;
  }

  /// @notice Get version of this metatransactions contract
  /// @return The version
  function versionRecipient() 
    override
    external 
    view
    returns (string memory) 
  {
    return "1";
  }

  /// @notice Sets the marble nft factory contract
  /// @dev Can be called only by the owner of this contract
  function setMarbleFactoryContract(MarbleNFTFactory _marbleNFTFactoryContract) 
    virtual
    external 
    onlyOwner 
  {
    marbleNFTFactoryContract = _marbleNFTFactoryContract;
  }

}
