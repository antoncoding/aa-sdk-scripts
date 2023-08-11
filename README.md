# Gelato Relayer Example

* ethers version: v5.7.2

## Contract
* `LyraForwarder` rely on the `GelatoRelay1Balance` contract to forward the tx, where we parse the verified payload and only pull funds from the user 

## Example scripts

### L1 Deposit

Examples in `examples/l1-deposit`: combine Gelato relayer with different approaches to achieve gasless ERC20 deposit for users.

- `relay-safe`: use account abstraction SDK from Safe: which deploys a Safe contract for a new user under the hood, and execute multiple transactions from the Safe
- `relay-lyra-wrapper`: we route tx through our costume `LyraForwarder` contract.


### L2 Transactions (AA)

The default solution is we go with gelato relayer, which is identical to the `relay-safe` example in `example/l1-deposit`, only replace the `MetaTransactionData` array with transactions users sign

- `own-executor`: if we don't want to use gelato relayer, we might need something similar to this to execute signed safe transaction for the users on the server side. (fully based on Safe sdk).
