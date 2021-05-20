// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


/// @dev Partial interface of the MarbleBank contract so that we can easily work with it
abstract contract MarbleBank {
  function payByAffiliate(address token, uint256 amount, address from, address to, string calldata note) external virtual;
}
