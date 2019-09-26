/*
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract DemoToken is ERC20 {

    string public name = "Demo Token";
    uint8 public decimals = 18;
    string public symbol = "DMO";
    string public version = 'DMO 1.0';

    function mint(uint256 amount) public returns (bool) {
        _mint(msg.sender, amount);
        return true;
    }

}
