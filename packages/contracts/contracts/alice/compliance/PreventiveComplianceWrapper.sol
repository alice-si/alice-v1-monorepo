/*
This contract wraps the standard ERC20 token mediating all of the transfer operation
to assure they are compliant with previously defined rules.
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './TransferPolicy.sol';


contract PreventiveComplianceWrapper is ERC20 {

    address public operator;
    TransferPolicy public policy;

    modifier onlyOperator() {
        require(msg.sender == operator, "Caller is not an operator");
        _;
    }

    constructor() public {
        operator = msg.sender;
    }

    function setPolicy(TransferPolicy _policy) public onlyOperator {
        policy = _policy;
    }

    /**
     * Wraps the transfer function delegating checks if the transaction is compliant
     */
    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(policy.canTransfer(this, msg.sender, recipient, amount), 'Transfer is not compliant');
        bool executed =  super.transfer(recipient, amount);
        policy.notifyAfterTransfer(msg.sender, recipient, amount, executed);
        return executed;
    }

}
