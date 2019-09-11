/*
This contract wraps the standard ERC20 token mediating all of the transfer operation
to assure they are compliant with previously defined rules.
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './ITransferChecker.sol';


contract PreventiveComplianceWrapper is ERC20 {

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

    /**
     * Wraps the transfer function delegating checks if the transaction is compliant
     */
    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(checkTransfer(recipient, amount), 'Transfer is not compliant');
        bool executed =  super.transfer(recipient, amount);
        notifyAfterTransfer(recipient, amount, executed);
        return executed;
    }

    function checkTransfer(address to, uint256 amount) internal view returns (bool) {
        bool isCompliant = true;
        for(uint8 i=0; i < checkers.length; i++) {
            isCompliant = isCompliant && checkers[i].canTransfer(this, msg.sender, to, amount);
        }
        return isCompliant;
    }

    function notifyAfterTransfer(address to, uint256 amount, bool executed) internal {
        for(uint8 i=0; i < checkers.length; i++) {
            checkers[i].afterTransfer(this, msg.sender, to, amount, executed);
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
