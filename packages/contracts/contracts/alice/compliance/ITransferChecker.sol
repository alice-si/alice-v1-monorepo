pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

/*
This interface defines how the implementation checks if a token transfer is compliant.
It decouples the legal requirements from a token implementation allowing the same checkers
to be connected to different tokens.
The implementation may be connected to a preventive compliance wrapper and aggregated with other checkers.
*/
interface ITransferChecker {

    /**
     * Checks if a transfer is compliant and can be executed
     */
    function canTransfer(ERC20 token, address from, address to, uint256 value) external view returns(bool);

    /**
     * Notifies checker about the transfer execution
     */
    function afterTransfer(ERC20 token, address from, address to, uint256 value, bool executed) external;
}
