// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {ERC2771Context} from "@gelatonetwork/relay-context/contracts/vendor/ERC2771Context.sol";

import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IStandardBridge} from "./interfaces/IStandardBridge.sol";

/**
 * @title LyraForwarder
 * @notice this contract help onboarding users with only USDC in their wallet to our custom rollup, with help of Gelato Relayer
 */
contract LyraForwarder is ERC2771Context {

    ///@dev L1 USDC address.
    address immutable public usdcLocal;

    ///@dev L2 USDC address. 
    address immutable public usdcRemote;

    ///@dev L1StandardBridge address.
    address immutable public bridge;

    struct PermitData {
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    
    /**
     * @param _trustedForwarder GelatoRelay1BalanceERC2771 forwarder (0xd8253782c45a12053594b9deB72d8e8aB2Fca54c) for all non-zkSync-EVM
     **/
    constructor(address _trustedForwarder, address _usdcLocal, address _usdcRemote,  address _bridge) ERC2771Context(_trustedForwarder) {
        usdcLocal = _usdcLocal;
        usdcRemote = _usdcRemote;
        bridge = _bridge;
        
        IERC20(_usdcLocal).approve(bridge, type(uint).max);
    }

    /**
     * @notice Deposit USDC to L2
     * @dev This function use _msgSender() to be compatible with ERC2771. 
     *      Users can either interact directly with this contract (to do permit + deposit in one go),
     *      or sign a Gelato relay request, and let the GelatoRelay1BalanceERC2771 contract forward the call to this contract.
     *      With the latter, _msgSender() will be the signer which is verified by GelatoRelay1BalanceERC2771
     */
    function forwardUSDCToL2(PermitData calldata permit, uint256 depositAmount, address l2Receiver, uint32 minGasPrice) external {
        // step 1 (optional) call permit
        if (permit.value != 0) {
            IERC20Permit(usdcLocal).permit(_msgSender(), address(this), permit.value, permit.deadline, permit.v, permit.r, permit.s);
        }

        // step 2: transferFrom msg.sender to this contract
        IERC20(usdcLocal).transferFrom(_msgSender(), address(this), depositAmount);

        // step 3: call bridge to L2
        IStandardBridge(bridge).bridgeERC20To(usdcLocal, usdcRemote, l2Receiver,  depositAmount, minGasPrice, "");
    }
}
