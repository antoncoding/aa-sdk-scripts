# AA Examples

## Install

```
npm install
```

## Comparison

Comparing different approaches with AA. Gas should be paid with USDC from the user accounts (Smart wallet contracts).

1. Safe Account Abstraction SDK
2. ZeroDev SDK
3. Biconomy SDK

## High Level AA SDK

### 1.Safe AA SDK (Safe + Gelato)

* Docs: [github](https://github.com/safe-global/safe-core-sdk/tree/main/packages/account-abstraction-kit)
* Use Safe for user and then execute trades. Only difference here is that the safe pay the fee itself
* **No** dependency on [Safe API](https://docs.safe.global/safe-core-api/available-services)
* Extra layer of Gelato Relayers
* Example [tx hash](https://goerli.etherscan.io/tx/0xe17df6c355c712891e59e13ab7b856a4a9d8dbb56a73887b8ff38450d6fef8c2)

Run script
```
npx ts-node examples/aa-tx-examples/gelato-safe.ts
```
* quite some execution delay
* gas cost [transfer ERC20]: 206,673

### 2. ZeroDev SDK (4337)
* Wallet contract: [https://github.com/zerodevapp/kernel](https://github.com/zerodevapp/kernel)
* uses alchemy's sdk in the backend (`@alchemy/aa-core`)
* use their own wallet (Kernel), bundler and paymaster

### 3. Biconomy SDK (4337)

* Wallet contract: [https://github.com/bcnmy/scw-contracts](https://github.com/bcnmy/scw-contracts)
* use their own wallet, bundler and paymaster
* Example [tx](https://goerli.etherscan.io/tx/0x13e11db109e730b3765049224235627f343fe8ee6c19ee136fb2d5746cc05cd5)

```
npx ts-node examples/l2-tx-examples/biconomy.ts
```

## Low level ERC4337 SDK 

### 1. Userop.js
* Github repo: https://github.com/stackup-wallet/userop.js
* can use zerodev kernel or any wallet contracts
* use our own paymaster
* [example tx](https://explorerl2new-staging-9ns7v94tpj.t.conduit.xyz/tx/0x0e638f04e95a32f981714ed6a4aaf573e36157e94b51ac1915bdcb63323cce6c) (no paymaster)

### 2. alchemy AA sdk
* WIP