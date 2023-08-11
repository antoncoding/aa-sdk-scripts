import { ethers } from 'ethers'
import AccountAbstraction, { OperationType } from '@safe-global/account-abstraction-kit-poc'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'
import { addresses } from '../addresses';

// dot env
import dotenv from 'dotenv'
dotenv.config()

import l1BridgeAbi from "../abi/L1StandardBridgeProxy.json";
import usdcAbi from "../abi/usdc.json";

import {signPermit} from "../permit"

const SAFE_SIGNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY!

const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY;

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!)
const user = new ethers.Wallet(SAFE_SIGNER_PRIVATE_KEY, provider);
// network configs
const networkConfig = addresses.goerli
const gasLimit = "8000000"

// contract instances
const bridgeContract = new ethers.Contract(networkConfig.l1StandardBridge, l1BridgeAbi, user);
const usdcContract = new ethers.Contract(networkConfig.l1USDC, usdcAbi, user);

async function relayTransaction() {
  const depositAmount = "100000000"
  
  // initialize AA object
  const relayPack = new GelatoRelayPack(GELATO_RELAY_API_KEY)

  // the AA object is controlled by the user!
  const safeAccountAbstraction = new AccountAbstraction(user)
  const sdkConfig = { relayPack }
  await safeAccountAbstraction.init(sdkConfig)

  // address
  const predictedSafeAddress = await safeAccountAbstraction.getSafeAddress()

  // Build Tx 1: Permit USDC Transfer
  const deadline = Math.floor(Date.now() / 1000) + 86400;
  const permitData = await signPermit(user, networkConfig.l1USDC, predictedSafeAddress,  depositAmount, deadline)
  
  const usdcPermitTx: MetaTransactionData = {
    to: networkConfig.l1USDC,
    data: usdcContract.interface.encodeFunctionData("permit(address,address,uint256,uint256,uint8,bytes32,bytes32)", [
      user.address, // owner
      predictedSafeAddress,  // spender
      depositAmount, // amount
      deadline, // amount 
      permitData.v,
      permitData.r,
      permitData.s
    ]),
    value: '0',
    operation: OperationType.Call,
  };
  
   // Build Tx 2: Transfer USDC from signer to safe
  const usdcTransferFrom: MetaTransactionData = {
    to: networkConfig.l1USDC,
    data: usdcContract.interface.encodeFunctionData("transferFrom(address,address,uint256)", [
      user.address, // owner
      predictedSafeAddress,  // spender
      depositAmount, // amount
    ]),
    value: '0',
    operation: OperationType.Call,
  };

  // Build Tx 3: approve USDC to bridge
  const usdcApprove: MetaTransactionData = {
    to: networkConfig.l1USDC,
    data: usdcContract.interface.encodeFunctionData("approve(address,uint256)", [
      networkConfig.l1StandardBridge, 
      depositAmount, // amount
    ]),
    value: '0',
    operation: OperationType.Call,
  };
  
  // Build Tx 4: deposit USDC from Safe to the target address (depositETH don't work for non-EOA)
  const depositToL2Tx: MetaTransactionData = {
    to: networkConfig.l1StandardBridge,
    data: bridgeContract.interface.encodeFunctionData("bridgeERC20To(address,address,address,uint256,uint32,bytes)", [
      networkConfig.l1USDC, // local 
      networkConfig.l2USDC,  // remote
      predictedSafeAddress, // to
      depositAmount, // amount 
      200000, // min gas price
      "0x"
    ]),
    value: '0',
    operation: OperationType.Call,
  };

  const options: MetaTransactionOptions = {
    gasLimit,
    isSponsored: true,
  };

  // second signature will be signed here! handled by the SDK
  // if the Safe is not created at this point, it will be handled by the SDK and automatically deploy 1 before the trade
  const response = await safeAccountAbstraction.relayTransaction([usdcPermitTx, usdcTransferFrom, usdcApprove, depositToL2Tx], options)
  
  console.log({ GelatoTaskId: response })
  
  console.log(`https://relay.gelato.digital/tasks/status/${response} `);
}
relayTransaction();