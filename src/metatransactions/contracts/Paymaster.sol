pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@opengsn/gsn/contracts/forwarder/IForwarder.sol";
import "@opengsn/gsn/contracts/BasePaymaster.sol";

// NOTE: This paymaster is naive because it is not a secure implementation. It can be blocked by sending enough requests to drain the account. A more sophisticated paymaster would use captcha or maybe hashcash.
contract Paymaster is BasePaymaster {

  address public nftContract;

  constructor(address _nftContract) public {
		nftContract = _nftContract;
	}

  function preRelayedCall(
	  GSNTypes.RelayRequest calldata relayRequest,
	  bytes calldata signature,
    bytes calldata approvalData,
    uint256 maxPossibleGas
  ) external override returns (bytes memory context, bool rejectOnRecipientRevert) {
    _verifyForwarder(relayRequest);
    require(relayRequest.target == nftContract);

    return (abi.encode(now), false);
  }

  function postRelayedCall(
    bytes calldata context,
    bool success,
    uint256 gasUseWithoutPost,
    GsnTypes.RelayData calldata relayData
  ) external relayHubOnly override {
    (success, preRetVal, gasUseExceptUs, gasData);
    emit PostRelayed(abi.decode(context, (uint)));
  }

  function versionPaymaster() external virtual view override returns (string memory) {
    return "0.1";
  }


}