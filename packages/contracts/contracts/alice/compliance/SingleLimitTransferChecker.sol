/*
This contract implements the ITransferChecker interface.
It's a basic implementations checking if a transfer is below a specified limit.
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './BaseTransferChecker.sol';


contract SingleLimitTransferChecker is BaseTransferChecker {

    uint256 public limit;

    constructor(uint256 _limit) public {
        limit = _limit;
    }

    function canTransfer(ERC20 token, address from, address to, uint256 value) public view returns(bool) {
        return value <= limit;
    }
}
