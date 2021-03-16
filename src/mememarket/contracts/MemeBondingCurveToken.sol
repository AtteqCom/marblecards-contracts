// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {BancorFormula} from "./bancor/BancorFormula.sol";

contract MemeBondingCurveToken is ERC20, BancorFormula {
    event Minted(address sender, uint256 amount, uint256 deposit);
    event Burned(address sender, uint256 amount, uint256 refund);

    ERC20 private reserveToken;

    // bancor bonding curve parameter
    uint32 private reserveWeight;

    constructor(ERC20 _reserveToken, string memory _memeTokenName, string memory _memeTokenSymbol) ERC20(_memeTokenName, _memeTokenSymbol) {
        reserveToken = _reserveToken;
        reserveWeight = 100000;

        uint256 initialTotalSupply = 10;
        _mint(msg.sender, initialTotalSupply);
    }

    function buy(uint256 _reserveTokenAmount) public {
        _continuousMint(_reserveTokenAmount);
        require(
            reserveToken.transferFrom(
                msg.sender,
                address(this),
                _reserveTokenAmount
            ),
            "mint() ERC20.transferFrom failed."
        );
    }

    function sell(uint256 _continuousTokenAmount) public {
        uint256 returnAmount = _continuousBurn(_continuousTokenAmount);
        require(
            reserveToken.transfer(msg.sender, returnAmount),
            "burn() ERC20.transfer failed."
        );
    }

    function reserveBalance() public view returns (uint256) {
        return reserveToken.balanceOf(address(this));
    }

    function _continuousMint(uint256 _deposit) internal returns (uint256) {
        require(_deposit > 0, "Deposit must be non-zero.");

        uint256 rewardAmount = _computeContinuousMintReward(_deposit);
        _mint(msg.sender, rewardAmount);
        emit Minted(msg.sender, rewardAmount, _deposit);
        return rewardAmount;
    }

    function _continuousBurn(uint256 _amountToBurn) internal returns (uint256) {
        require(_amountToBurn > 0, "Amount must be non-zero.");
        require(
            balanceOf(msg.sender) >= _amountToBurn,
            "Insufficient tokens to burn."
        );

        uint256 refundAmount = _computeContinuousBurnRefund(_amountToBurn);
        _burn(msg.sender, _amountToBurn);
        emit Burned(msg.sender, _amountToBurn, refundAmount);
        return refundAmount;
    }

    function _computeContinuousMintReward(uint256 _reserveTokenDeposit)
        internal
        returns (uint256)
    {
        return
            calculatePurchaseReturn(
                totalSupply(),
                reserveBalance(),
                reserveWeight,
                _reserveTokenDeposit
            );
    }

    function _computeContinuousBurnRefund(uint256 _continuousTokenAmountToBurn)
        internal
        returns (uint256)
    {
        return
            calculateSaleReturn(
                totalSupply(),
                reserveBalance(),
                reserveWeight,
                _continuousTokenAmountToBurn
            );
    }
}
