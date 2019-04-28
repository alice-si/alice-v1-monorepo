# Alice Smart Contracts

This project is a collection of smart contracts used by Alice, a social impact platform built on Ethereum <https://alice.si>.

### Overview

The first application launched by Alice uses smart contracts to implement a "pay for success" donation model, where donors only pay if the charitable projects they give to achieve their goals.

Each charity project encodes a list of "goals" that the charity aims to achieve, and each goal is assigned a price that the charity will receive if/when the goal is provably achieved.

Donors give to projects on the Alice platform using fiat, and the payment logic is implemented on the blockchain using a stablecoin token pegged to the value of their gift. When a donor sends money to a project, the corresponding amount of tokens is minted and credited by the Charity contract.  These tokens are held in escrow until a dedicated Validator confirms that an expected goal pursued by the charity has been achieved. Once this validation has been performed, the price assigned to the goal is then transferred to the charity's account. If the charity does not achieve any goals, outstanding tokens are unlocked and returned to donors. They can then be reused for future donations.

### Installation
This project requires [node-js](https://github.com/nodejs/node) runtime and uses [truffle](https://github.com/trufflesuite/truffle) as the Ethereum smart contract development framework.

In order to run it, install truffle first:

    npm install -g truffle

Then install all of the node-js dependencies

    npm install

Connection to blockchain node is defined in truffle.js:

    networks: {
        dev: {
          network_id: "*",
          gas: 4000000,
          host: 'localhost',
          port: '8545'
        }
    }

We recommend using popular Ethereum test client [ganache](https://www.npmjs.com/package/ganache-cli) as a default node:

    npm install -g ganache-cli

### Demo dApp

We created a demo dApp so you can interact and test the smart contracts in a visual environment rather than hacking console scripts. To run this mode, deploy the smart contracts to your blockchain network:

    truffle migrate

... and then launch a demo server:

    npm run dev

This demo dApp should be available at: http://localhost:8080/ and look like this:
![screenshot](https://s3.eu-west-2.amazonaws.com/alice-res/alice-dApp.png)
