pragma solidity ^0.5.2;

import './InvestmentWallet.sol';
import '../ProjectCatalog.sol';
import '../DemoToken.sol';

contract DemoInvestmentWallet is InvestmentWallet {

    constructor(ProjectCatalog _projectCatalog) public
        InvestmentWallet(_projectCatalog) {
    }

    function requestTokens(DemoToken _token, uint _amount) public onlyOwner {
        _token.mint(_amount);
    }

}
