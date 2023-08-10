// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {ERC2771Context} from "@gelatonetwork/relay-context/contracts/vendor/ERC2771Context.sol";

import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IStandardBridge} from "./interfaces/IStandardBridge.sol";

contract LyraForwarder is ERC2771Context {

    address immutable public usdcLocal;

    address immutable public usdcRemote;

    address immutable public bridge;

    struct PermitData {
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    
    // ERC2771Context: setting the immutable trustedForwarder variable
    constructor(address _trustedForwarder, address _usdcLocal, address _usdcRemote,  address _bridge) ERC2771Context(_trustedForwarder) {
        usdcLocal = _usdcLocal;
        usdcRemote = _usdcRemote;
        bridge = _bridge;
        
        IERC20(_usdcLocal).approve(bridge, type(uint).max);
    }

    function forwardUSDCToL2(PermitData calldata permit, uint256 depositAmount, address l2Receiver, uint32 minGasPrice) external {
        // step 1 (optional) call permit
        if (permit.value != 0) {
            IERC20Permit(usdcLocal).permit(_msgSender(), address(this), permit.value, permit.deadline, permit.v, permit.r, permit.s);
        }

        // step 2: transferFrom msg.sender to this contract
        IERC20(usdcLocal).transferFrom(_msgSender(), address(this), depositAmount);

        // step 3: calculate target SafeAddress (todo: is this necessary?)


        // step 4: call bridge to L2
        IStandardBridge(bridge).bridgeERC20To(usdcLocal, usdcRemote, l2Receiver,  depositAmount, minGasPrice, "");
    }
}
