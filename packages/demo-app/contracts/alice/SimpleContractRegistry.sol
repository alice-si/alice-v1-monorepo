pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract SimpleContractRegistry is Ownable {

  mapping (bytes32 => address) public contracts;

  function registerContract(bytes32 _name, address _contractAddress) public onlyOwner {
    contracts[_name] = _contractAddress;
  }

}