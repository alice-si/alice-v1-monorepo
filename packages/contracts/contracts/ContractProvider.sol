pragma solidity ^0.5.2;

contract ContractProvider {
    function contracts(bytes32 contractName) public returns (address addr);
}
