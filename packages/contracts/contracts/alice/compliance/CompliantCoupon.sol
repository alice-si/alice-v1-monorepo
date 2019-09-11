/*
Implements ERC20 Token Standard: https://github.com/ethereum/EIPs/issues/20
*/

pragma solidity ^0.5.2;

import '../bonds/Coupon.sol';
import './PreventiveComplianceWrapper.sol';

contract CompliantCoupon is PreventiveComplianceWrapper, Coupon {

    constructor(uint256 _price) public
        PreventiveComplianceWrapper()
        Coupon(_price) {
    }

}
