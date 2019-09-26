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

    function investAndRedeem(uint _amount, string memory _projectName) public onlyOwner {
        invest(_amount, _projectName);

        address projectAddress = projectCatalog.getProjectAddress(_projectName);
        ERC20 couponToken = ProjectWithBonds(projectAddress).getCoupon();
        couponToken.transfer(msg.sender, couponToken.balanceOf(address(this)));
    }

}
