/*
This contract groups the checkers that contains rules controlling token transfers
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './ITransferChecker.sol';


contract TransferPolicy is ERC20 {

    address public operator;
    ITransferChecker[] public checkers;

    /**
     * Emitted when a new checker is added by the operator
     */
    event CheckerAdded(address indexed checker);

    /**
     * Emitted when an existing checker is removed by the operator
     */
    event CheckerRemoved(address indexed checker);

    modifier onlyOperator() {
        require(msg.sender == operator, "Caller is not an operator");
        _;
    }

    constructor() public {
        operator = msg.sender;
    }

    function canTransfer(ERC20 token, address from, address to, uint256 amount) public view returns (bool) {
        bool isCompliant = true;
        for(uint8 i=0; i < checkers.length; i++) {
            isCompliant = isCompliant && checkers[i].canTransfer(token, from, to, amount);
        }
        return isCompliant;
    }

    function notifyAfterTransfer(address from, address to, uint256 amount, bool executed) public {
        for(uint8 i=0; i < checkers.length; i++) {
            checkers[i].afterTransfer(ERC20(msg.sender), from, to, amount, executed);
        }
    }

    function addChecker(ITransferChecker _checker) public onlyOperator {
        require(checkers.length < 16, 'Cannot define more than 16 checkers');
        checkers.push(_checker);
        emit CheckerAdded(address(_checker));
    }

    function removeChecker(ITransferChecker _checker) public onlyOperator {
        for(uint8 i=0; i < checkers.length; i++) {
            if (checkers[i] == _checker) {
                checkers[i] = checkers[checkers.length -1];
                delete checkers[checkers.length-1];
                checkers.length--;
            }
        }
        emit CheckerRemoved(address(_checker));
    }

}
