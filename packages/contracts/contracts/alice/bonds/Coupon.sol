/*
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract Coupon is ERC20Mintable, ERC20Burnable, Ownable {
    using SafeMath for uint256;

    string public name = "Alice Coupon";
    uint8 public decimals = 2;
    string public symbol = "ALC";
    string public version = 'ALC 1.0';

    uint256 public nominalPrice;

    constructor(uint256 _price) public {
        nominalPrice = _price;
    }
}
