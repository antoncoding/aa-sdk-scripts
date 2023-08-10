import AccountAbstraction, { OperationType } from '@safe-global/account-abstraction-kit-poc'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'
import { ethers, Signer } from 'ethers'

// dot env
import dotenv from 'dotenv'
dotenv.config()

import l1BridgeAbi from "../abi/L1StandardBridgeProxy.json";
import usdcAbi from "../abi/usdc.json";

import {signPermit} from "../permit"

const SAFE_SIGNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY!

const RPC_URL = 'https://goerli.infura.io/v3/26251a7744c548a3adbc17880fc70764'
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY;

// This will be connected wallet in Metamask
const user = new ethers.Wallet(SAFE_SIGNER_PRIVATE_KEY, provider);

const gasLimit = "8000000"

// network configs
const mainnetUSDC = '0x07865c6e87b9f70255377e024ace6630c1eaa37f' // goerli
const rollupUSDC = '0x7E07E15D2a87A24492740D16f5bdF58c16db0c4E' // goerli-optimism
const l1StandardBridge = '0x636Af16bf2f682dD3109e60102b8E1A089FedAa8'

// contract instances
const bridgeContract = new ethers.Contract(l1StandardBridge, l1BridgeAbi, user);
const usdcContract = new ethers.Contract(mainnetUSDC, usdcAbi, user);


async function relayTransaction() {
  
  // initialize AA object
  const relayPack = new GelatoRelayPack(GELATO_RELAY_API_KEY)

  // the AA object is controlled by the user!
  const safeAccountAbstraction = new AccountAbstraction(user)
  const sdkConfig = { relayPack }
  await safeAccountAbstraction.init(sdkConfig)

  // address
  const predictedSafeAddress = await safeAccountAbstraction.getSafeAddress()
  
  const depositAmount = "100000000"

  // Build Tx 1: Permit USDC Transfer
  const deadline = Math.floor(Date.now() / 1000) + 86400;
  const permitData = await signPermit(user, mainnetUSDC, predictedSafeAddress,  depositAmount, deadline)
  
  const usdcPermitTx: MetaTransactionData = {
    to: mainnetUSDC,
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
    to: mainnetUSDC,
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
    to: mainnetUSDC,
    data: usdcContract.interface.encodeFunctionData("approve(address,uint256)", [
      l1StandardBridge, 
      depositAmount, // amount
    ]),
    value: '0',
    operation: OperationType.Call,
  };
  
  // Build Tx 4: deposit USDC from Safe to the target address (depositETH don't work for non-EOA)
  const depositToL2Tx: MetaTransactionData = {
    to: l1StandardBridge,
    data: bridgeContract.interface.encodeFunctionData("bridgeERC20To(address,address,address,uint256,uint32,bytes)", [
      mainnetUSDC, // local 
      rollupUSDC,  // remote
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
  const response = await safeAccountAbstraction.relayTransaction([usdcPermitTx, usdcTransferFrom, usdcApprove, depositToL2Tx], options)
  
  console.log({ GelatoTaskId: response })
  
  console.log(`https://relay.gelato.digital/tasks/status/${response} `);
}
relayTransaction();