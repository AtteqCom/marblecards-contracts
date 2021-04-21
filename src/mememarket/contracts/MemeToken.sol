// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import {BancorFormula} from "./bancor/BancorFormula.sol";

contract MemeToken is ERC20 {
    event Purchase(address _buyer, uint256 _memeTokenAmount, uint256 _reserveTokenSpent, uint256 _newPrice, uint256 _newTotalSupply);
    event Sale(address _seller, uint256 _memeTokenAmount, uint256 _reserveTokenRefund, uint256 _newPrice, uint256 _newTotalSupply);

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
        emit Purchase(msg.sender, memeTokenBoughtAmount, _reserveTokenAmount, 1, totalSupply());
    }

    function sell(uint256 _continuousTokenAmount) public {
        uint256 returnReserveTokenAmount = _continuousBurn(_continuousTokenAmount);
        require(
            reserveToken.transfer(msg.sender, returnReserveTokenAmount),
            "burn() ERC20.transfer failed."
        );
        emit Sale(msg.sender, _continuousTokenAmount, returnReserveTokenAmount, 1, totalSupply());
    }

    function reserveBalance() public view returns (uint256) {
        return reserveToken.balanceOf(address(this));
    }

    function estimateTokenBuy(uint256 _reserveTokenAmount) public view returns (uint256) {
        return _computeContinuousMintReward(_reserveTokenAmount, totalSupply());
    }

    function estimateTokenSale(uint256 _continouesTokenAmount) public view returns (uint256) {
        return _computeContinuousBurnRefund(_continouesTokenAmount, totalSupply());
    }

    function _continuousMint(uint256 _deposit) internal returns (uint256) {
        require(_deposit > 0, "Deposit must be non-zero.");

        uint256 rewardAmount = _computeContinuousMintReward(_deposit, totalSupply());
        _mint(msg.sender, rewardAmount);
        return rewardAmount;
    }

    function _continuousBurn(uint256 _amountToBurn) internal returns (uint256) {
        require(_amountToBurn > 0, "Amount must be non-zero.");
        require(
            balanceOf(msg.sender) >= _amountToBurn,
            "Insufficient tokens to burn."
        );

        uint256 refundAmount = _computeContinuousBurnRefund(_amountToBurn, totalSupply());
        _burn(msg.sender, _amountToBurn);
        return refundAmount;
    }

    /**
    Computing mint reward when the price formula is: price = 0.1 * currentTotalSupply
     */
    function _computeContinuousMintReward(uint256 _reserveTokenDeposit, uint256 _currentTotalSupply)
        internal pure
        returns (uint256)
    {
        return (sqrt(20 * _reserveTokenDeposit / (_currentTotalSupply**2) + 1) - 1) * _currentTotalSupply;
        // return _reserveTokenDeposit;
            // calculatePurchaseReturn(
            //     totalSupply(),
            //     reserveBalance(),
            //     reserveWeight,
            //     _reserveTokenDeposit
            // );
    }

    /**
    Computing burn refund when the price formula is: price = 0.1 * currentTotalSupply
     */
    function _computeContinuousBurnRefund(uint256 _continuousTokenAmountToBurn, uint256 _currentTotalSupply)
        internal pure
        returns (uint256)
    {
        require(_currentTotalSupply >= _continuousTokenAmountToBurn, "Token amount to burn have to be smaller than current total supply.");
        return (_continuousTokenAmountToBurn * _currentTotalSupply - _continuousTokenAmountToBurn ** 2 / 2) / 10;
        // return _continuousTokenAmountToBurn;
            // calculateSaleReturn(
            //     totalSupply(),
            //     reserveBalance(),
            //     reserveWeight,
            //     _continuousTokenAmountToBurn
            // );
    }

    /// @notice Calculates the square root of x, rounding down.
    /// @dev Uses the Babylonian method https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method.
    /// @param x The uint256 number for which to calculate the square root.
    /// @return result The result as an uint256.
    function sqrt(uint256 x) internal pure returns (uint256 result) {
        if (x == 0) {
            return 0;
        }

        // Calculate the square root of the perfect square of a power of two that is the closest to x.
        uint256 xAux = uint256(x);
        result = 1;
        if (xAux >= 0x100000000000000000000000000000000) {
            xAux >>= 128;
            result <<= 64;
        }
        if (xAux >= 0x10000000000000000) {
            xAux >>= 64;
            result <<= 32;
        }
        if (xAux >= 0x100000000) {
            xAux >>= 32;
            result <<= 16;
        }
        if (xAux >= 0x10000) {
            xAux >>= 16;
            result <<= 8;
        }
        if (xAux >= 0x100) {
            xAux >>= 8;
            result <<= 4;
        }
        if (xAux >= 0x10) {
            xAux >>= 4;
            result <<= 2;
        }
        if (xAux >= 0x8) {
            result <<= 1;
        }

        // The operations can never overflow because the result is max 2^127 when it enters this block.
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1;
        result = (result + x / result) >> 1; // Seven iterations should be enough
        uint256 roundedDownResult = x / result;
        return result >= roundedDownResult ? roundedDownResult : result;
    }
}
