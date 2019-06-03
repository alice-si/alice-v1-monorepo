/*
Implements ERC20 Token Standard: https://github.com/ethereum/EIPs/issues/20
*/

pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract DigitalEURToken is ERC20Mintable, ERC20Burnable, Ownable {
  using SafeMath for uint256;

  string public name = "DigitalEUR Token";
  uint8 public decimals = 2;
  string public symbol = "DEUR";
  string public version = 'DEUR 1.0';

}
