# Comparison

Comparing different approaches with AA. Gas should be paid with USDC from the user accounts (Smart wallet contracts).

1. Safe Account Abstraction SDK
2. Biconomy SDK
3. Alchemy SDK 
2. ZeroDev SDK


## 1.Safe AA SDK

* Docs: [github](https://github.com/safe-global/safe-core-sdk/tree/main/packages/account-abstraction-kit)
* Identical to our "relay-safe" L1 deposit example where we deploy Safe for user and then execute trades
* Use Safe core SDK for getting address and deployment status (`getSignerAddress`)
* Extra layer of Gelato Relayers
* Example [tx hash](https://goerli.etherscan.io/tx/0x86aab56761cf29284bdaed471ef5c039ec579d7ef4a6511552098d963e946a0e)

Run script
```
npx ts-node examples/l2-tx-examples/gelato-safe.ts

```
* quite some execution delay

## 2.Alchemy SDK