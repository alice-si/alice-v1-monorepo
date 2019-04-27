# Alice Smart Contracts

[![Join the chat at https://gitter.im/alice-si/Lobby](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/alice-si/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This project is a collection of smart contracts used by Alice, a social impact platform built on Ethereum <https://alice.si>.

### Overview

The first application launched by Alice uses smart contracts to implement a "pay for success" donation model, where donors only pay if the charitable projects they give to achieve their goals.

Each charity project encodes a list of "goals" that the charity aims to achieve, and each goal is assigned a price that the charity will receive if/when the goal is provably achieved.

Donors give to projects on the Alice platform using fiat, and the payment logic is implemented on the blockchain using a stablecoin token pegged to the value of their gift. When a donor sends money to a project, the corresponding amount of tokens is minted and credited by the Charity contract.  These tokens are held in escrow until a dedicated Validator confirms that an expected goal pursued by the charity has been achieved. Once this validation has been performed, the price assigned to the goal is then transferred to the charity's account. If the charity does not achieve any goals, outstanding tokens are unlocked and returned to donors. They can then be reused for future donations.

### Installation

After following the top-level installation procedure for the monorepo, you
should already have everything you need installed.

### Running tests

To run all of the smart contract tests, use the following truffle command in your console:

    npx truffle test

If you are using the testrpc client, remember to start it with a sufficient number of test accounts:

    npx ganache-cli -a 100

You can also use an automated test script instead of the previous two commands:

    npm run test

## Contributions

All comments and ideas for improvements and pull requests are welcomed. We want to improve the project based on feedback from the community.
