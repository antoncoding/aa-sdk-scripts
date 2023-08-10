// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IStandardBridge {
    function bridgeERC20To(address localToken, address remoteToken, address to, uint256 amount, uint32 minGasPrice, bytes calldata data) external;
}