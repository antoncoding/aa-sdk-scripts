# Scripts

`src/l1-deposit`: deposit scripts

* `relay-aa-gelato`: use account abstraction SDK from Gelato: user just need to sign permit + sign relay transaction, we will deploy a Safe contract for all users under the hood if it's not created before (with AA sdk) 
* `relay-forwarder-gelato`: we route tx through our costume `LyraL2Forwarder` contract`: our contract call permit, transfer from and deposit to after verifying the signer is mapped to the 