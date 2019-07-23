pragma solidity ^0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './CuratedWithWarnings.sol';


/**
 * @title Vault
 * @dev The Vault contract is a container for token storage that implements extra security measures.
 */
contract Vault is CuratedWithWarnings {

    constructor(address[] memory _whistleblowers, address _curator, address[] memory _proposers, address[] memory _validators)
        CuratedWithWarnings(_whistleblowers, _curator, _proposers, _validators) public {
    }

}
