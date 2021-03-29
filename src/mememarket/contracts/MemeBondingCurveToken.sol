// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import {BancorFormula} from "./bancor/BancorFormula.sol";

contract MemeBondingCurveToken is ERC20 {
    event Purchase(address _buyer, uint256 _memeTokenAmount, uint256 _reserveTokenSpent, uint256 _newPrice);
    event Sale(address _seller, uint256 _memeTokenAmount, uint256 _reserveTokenRefund, uint256 _newPrice);

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
        uint256 memeTokenBoughtAmount = _continuousMint(_reserveTokenAmount);
        require(
            reserveToken.transferFrom(
                msg.sender,
                address(this),
                _reserveTokenAmount
            ),
            "mint() ERC20.transferFrom failed."
        );
        emit Purchase(msg.sender, memeTokenBoughtAmount, _reserveTokenAmount, 1);
    }

    function sell(uint256 _continuousTokenAmount) public {
        uint256 returnReserveTokenAmount = _continuousBurn(_continuousTokenAmount);
        require(
            reserveToken.transfer(msg.sender, returnReserveTokenAmount),
            "burn() ERC20.transfer failed."
        );
        emit Sale(msg.sender, _continuousTokenAmount, returnReserveTokenAmount, 1);
    }

    function reserveBalance() public view returns (uint256) {
        return reserveToken.balanceOf(address(this));
    }

    function _continuousMint(uint256 _deposit) internal returns (uint256) {
        require(_deposit > 0, "Deposit must be non-zero.");

        uint256 rewardAmount = _computeContinuousMintReward(_deposit);
        _mint(msg.sender, rewardAmount);
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
        return refundAmount;
    }

    function _computeContinuousMintReward(uint256 _reserveTokenDeposit)
        internal
        returns (uint256)
    {
        return _reserveTokenDeposit;
            // calculatePurchaseReturn(
            //     totalSupply(),
            //     reserveBalance(),
            //     reserveWeight,
            //     _reserveTokenDeposit
            // );
    }

    function _computeContinuousBurnRefund(uint256 _continuousTokenAmountToBurn)
        internal
        returns (uint256)
    {
        return _continuousTokenAmountToBurn;
            // calculateSaleReturn(
            //     totalSupply(),
            //     reserveBalance(),
            //     reserveWeight,
            //     _continuousTokenAmountToBurn
            // );
    }
}
