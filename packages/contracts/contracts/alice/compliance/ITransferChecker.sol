/*
This contract wraps the standard ERC20 token mediating all of the transfer operation
to assure they are compliant with previously defined rules.
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';


interface ITransferChecker {

    function canTransfer(ERC20 token, address from, address to, uint256 value) external view returns(bool);
}
