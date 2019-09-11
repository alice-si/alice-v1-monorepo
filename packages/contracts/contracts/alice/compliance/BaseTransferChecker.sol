/*
This contract implements the ITransferChecker interface.
It's a base implementation that could be used as a parent contract
to simplify the checkers code.
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './BaseTransferChecker.sol';


contract BaseTransferChecker {

    function canTransfer(ERC20 token, address from, address to, uint256 value) public view returns(bool) {
        return true;
    }

    function afterTransfer(ERC20 token, address from, address to, uint256 value, bool executed) public {

    }
}
