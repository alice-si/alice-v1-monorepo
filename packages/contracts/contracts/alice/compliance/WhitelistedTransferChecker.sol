/*
This contract implements the ITransferChecker interface.
This implementation maintains a registry of whitelisted accounts
and allows transfer only between accounts that have been previously whitelisted.
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './BaseTransferChecker.sol';


contract WhitelistedTransferChecker is BaseTransferChecker, Ownable {
    using SafeMath for uint256;

    mapping(address => bool) private registry;

    function canTransfer(ERC20 token, address from, address to, uint256 value) public view returns(bool) {
        return isWhitelisted(from) && isWhitelisted(to);
    }

    function whitelist(address _address) public onlyOwner {
        registry[_address] = true;
    }

    function isWhitelisted(address _address) public view returns(bool) {
        return registry[_address];
    }
}
