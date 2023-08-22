# Comparison

Comparing different approaches with AA. Gas should be paid with USDC from the user accounts (Smart wallet contracts).

1. Safe Account Abstraction SDK
2. ZeroDev SDK
2. Biconomy SDK
3. Alchemy SDK 


## 1.Safe AA SDK

* Docs: [github](https://github.com/safe-global/safe-core-sdk/tree/main/packages/account-abstraction-kit)
* Very similar to our "relay-safe" L1 deposit example where we deploy Safe for user and then execute trades. Only difference here is that the safe pay the fee itself
* **No** dependency on [Safe API](https://docs.safe.global/safe-core-api/available-services)
* Extra layer of Gelato Relayers
* Example [tx hash](https://goerli.etherscan.io/tx/0xe17df6c355c712891e59e13ab7b856a4a9d8dbb56a73887b8ff38450d6fef8c2)

Run script
```
npx ts-node examples/l2-tx-examples/gelato-safe.ts

```
* quite some execution delay
* gas cost [transfer ERC20]: 206,673

## 2. ZeroDev SDK 
* Wallet contract: [https://github.com/zerodevapp/kernel](https://github.com/zerodevapp/kernel)
* uses alchemy's sdk in the backend (`@alchemy/aa-core`)

## 3. Biconomy SDK (4337)

* Wallet contract: [https://github.com/bcnmy/scw-contracts](https://github.com/bcnmy/scw-contracts)
* Example [tx](https://goerli.etherscan.io/tx/0x13e11db109e730b3765049224235627f343fe8ee6c19ee136fb2d5746cc05cd5)

```
npx ts-node examples/l2-tx-examples/biconomy.ts
```

### Low level SDK we can tailer for L2 4337

## 1. Userop.js
* Github repo: https://github.com/stackup-wallet/userop.js
* can use zerodev kernel contracts

## 2. alchemy aa sdk



## * Infinitism
* Entrypoint Contract: [https://github.com/eth-infinitism/account-abstraction/tree/develop](https://github.com/eth-infinitism/account-abstraction/tree/develop)


## ERC4337 Bundlers

To support 4337 transactions on our network, we will need to run a bundler which accept the new RPC calls defined in ERC4337.

* infinitism: https://github.com/eth-infinitism/bundler
* Stackup: https://github.com/stackup-wallet/stackup-bundler
* Alchemy service
