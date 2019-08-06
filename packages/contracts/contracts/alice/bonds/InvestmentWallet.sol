pragma solidity ^0.5.2;

import './ProjectWithBonds.sol';
import './Coupon.sol';
import '../ProjectCatalog.sol';
import '../DonationWallet.sol';

contract InvestmentWallet is DonationWallet {

    event WalletCreated(address indexed owner);


    constructor(ProjectCatalog _projectCatalog) public
        DonationWallet(_projectCatalog) {
        emit WalletCreated(msg.sender);
    }


    function invest(uint _amount, string memory _projectName) public onlyOwner {
        address projectAddress = projectCatalog.getProjectAddress(_projectName);
        require(projectAddress != address(0));
        ERC20 token = ProjectWithBonds(projectAddress).getToken();

        token.approve(projectAddress, _amount);
        ProjectWithBonds(projectAddress).investFromWallet(_amount);
    }


    function redeemCoupons(uint _amount, string memory _projectName) public onlyOwner {
        address projectAddress = projectCatalog.getProjectAddress(_projectName);
        require(projectAddress != address(0));
        ProjectWithBonds project = ProjectWithBonds(projectAddress);
        Coupon coupon = project.getCoupon();
        require(coupon.balanceOf(address(this)) >= _amount);

        require(coupon.approve(address(project), _amount));
        project.redeemCoupons(_amount);
    }

}
