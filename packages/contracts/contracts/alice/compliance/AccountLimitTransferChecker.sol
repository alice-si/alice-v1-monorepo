/*
This contract implements the ITransferChecker interface.
It's a implementation that allows the operator to set a limit per account
and tracks the total value of tokens transferred by an individual account.
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './BaseTransferChecker.sol';


contract AccountLimitTransferChecker is BaseTransferChecker {
    using SafeMath for uint256;

    uint256 public limit;

    mapping(address => mapping(address => uint256)) private transferred;

    constructor(uint256 _limit) public {
        limit = _limit;
    }

    function canTransfer(ERC20 token, address from, address to, uint256 value) public view returns(bool) {
        return transferred[address(token)][from] + value <= limit;
    }

    function afterTransfer(ERC20 token, address from, address to, uint256 value, bool executed) public {
        transferred[address(token)][from] += value;
    }

    function getTransferred(ERC20 token, address from) public view returns(uint256) {
        return transferred[address(token)][from];
    }
}
