// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {BasePaymaster} from "@account-abstraction/contracts/core/BasePaymaster.sol";
import {UserOperation} from "@account-abstraction/contracts/interfaces/UserOperation.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";


contract DumbPaymaster is BasePaymaster {

    constructor() BasePaymaster(IEntryPoint(0x33a07c35557De1e916B26a049e1165D47d462f6B)) {}

    function _validatePaymasterUserOp(
      UserOperation calldata userOp, 
      bytes32 userOpHash, 
      uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {

      // todo: verify userOp.callData selector is whitelisted target

      // todo: make sure userOp.sender as not sent too much tx in the last 24h

      // do no verification
      return ("", 0);
    }
}