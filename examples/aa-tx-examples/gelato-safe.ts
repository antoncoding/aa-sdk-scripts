import { ethers } from 'ethers'
import AccountAbstraction, { OperationType } from '@safe-global/account-abstraction-kit-poc'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'
import { addresses } from '../addresses';

// dot env
import dotenv from 'dotenv'
dotenv.config()

import usdcAbi from "../abi/usdc.json";

const SAFE_SIGNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY!
const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY;

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!)
const user = new ethers.Wallet(SAFE_SIGNER_PRIVATE_KEY, provider);
// network configs
const networkConfig = addresses.goerli
const gasLimit = "8000000"

// contract instances
const usdcContract = new ethers.Contract(networkConfig.l1USDC, usdcAbi, user);

// main: 
async function transferWithGelato(transferAmount: string) {
  
  // initialize AA object
  console.log("start transferring...")
  const relayPack = new GelatoRelayPack(GELATO_RELAY_API_KEY)

  // the AA object is controlled by the user!
  const safeAccountAbstraction = new AccountAbstraction(user)
  const sdkConfig = { relayPack }
  await safeAccountAbstraction.init(sdkConfig)

  // Example: USDC transfer Data
  const transferTx: MetaTransactionData = {
    to: networkConfig.l1USDC,
    data: usdcContract.interface.encodeFunctionData("transfer(address,uint256)", [
      user.address, // owner
      transferAmount,
    ]),
    value: '0',
    operation: OperationType.Call,
  };
  
  // NOT sponsoring gas!
  const options: MetaTransactionOptions = {
    gasLimit,
    isSponsored: false,
  };

  // second signature will be signed here! handled by the SDK
  // if the Safe is not created at this point, it will be handled by the SDK and automatically deploy 1 before the trade
  const response = await safeAccountAbstraction.relayTransaction([transferTx], options)
  
  console.log({ GelatoTaskId: response })
  
  console.log(`https://relay.gelato.digital/tasks/status/${response} `);
}

transferWithGelato('7000000');