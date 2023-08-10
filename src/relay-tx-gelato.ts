import AccountAbstraction, { OperationType } from '@safe-global/account-abstraction-kit-poc'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'

const safeAddress =  "0xe3b35100706f86257372478a2D41C2f317E16c5f";

// dot env
import dotenv from 'dotenv'
dotenv.config()

import L1BridgeInfo from "./abi/L1StandardBridgeProxy.json";


const  SAFE_SIGNER_PRIVATE_KEY =  process.env.OWNER_PRIVATE_KEY!

const RPC_URL = 'https://goerli.infura.io/v3/26251a7744c548a3adbc17880fc70764'
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY;

const user = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY!, provider);

const targetAddress = L1BridgeInfo.address;

const bridgeContract = new ethers.Contract(
  targetAddress,
  L1BridgeInfo.abi,
  user
);

const gasLimit = "8000000"

async function relayTransaction() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
  const signer = new ethers.Wallet(SAFE_SIGNER_PRIVATE_KEY, provider)

  // initialize AA object
  const relayPack = new GelatoRelayPack(GELATO_RELAY_API_KEY)
  const safeAccountAbstraction = new AccountAbstraction(signer)
  const sdkConfig = { relayPack }
  await safeAccountAbstraction.init(sdkConfig)

  // address
  const predictedSafeAddress = await safeAccountAbstraction.getSafeAddress()
  console.log({ predictedSafeAddress })
  const isSafeDeployed = await safeAccountAbstraction.isSafeDeployed()
  console.log({ isSafeDeployed })
  

  // Create a tx from Safe to the target address (depositETH don't work for non-EOA)
  const depositToL2Tx: MetaTransactionData = {
    to: targetAddress,
    data: bridgeContract.interface.encodeFunctionData("bridgeETHTo(address,uint32,bytes)", [predictedSafeAddress, 200000, "0x"]),
    value: ethers.utils.parseEther("0.001").toString(),
    operation: OperationType.Call,
  };

  console.log("depositToL2Data", depositToL2Tx.data)

  
  const options: MetaTransactionOptions = {
    gasLimit,
    isSponsored: true,
  };

  const response = await safeAccountAbstraction.relayTransaction([depositToL2Tx], options)
  
  console.log({ GelatoTaskId: response })
  
  console.log(`https://relay.gelato.digital/tasks/status/${response} `);
}
relayTransaction();