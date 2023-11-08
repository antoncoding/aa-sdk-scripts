import { ethers, utils } from 'ethers'
import AccountAbstraction, { OperationType } from '@safe-global/account-abstraction-kit-poc'
import { GelatoRelayPack } from '@safe-global/relay-kit'
import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'
import { addresses } from '../addresses';
import dotenv from 'dotenv'
import usdcAbi from "../abi/usdc.json";

dotenv.config()

// Required ENV variables
const SAFE_SIGNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY!
const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY;

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!)
const user = new ethers.Wallet(SAFE_SIGNER_PRIVATE_KEY, provider);

const USDC = addresses.goerli.l1USDC

// contract instances
const usdcContract = new ethers.Contract(USDC, usdcAbi, user);

/**
 * @command npx ts-node examples/aa-tx-examples/gelato-safe.ts
 **/
async function transferWithGelato(transferAmount: string) {
  
  // initialize AA object
  console.log(`Transfer with Gelato + Safe ... Owner: ${user.address}`)

  const relayPack = new GelatoRelayPack(GELATO_RELAY_API_KEY)

  // the AA object
  const safeAccountAbstraction = new AccountAbstraction(user)
  const sdkConfig = { relayPack }
  await safeAccountAbstraction.init(sdkConfig)

  const scw = await safeAccountAbstraction.getSafeAddress()
  console.log(`Safe address:\t${scw}`)

  const balance = await usdcContract.balanceOf(scw)
  console.log(`Safe USDC balance:\t${utils.formatUnits(balance, 6)}`)

  // Example: USDC transfer Data
  const transferTx: MetaTransactionData = {
    to: USDC,
    data: usdcContract.interface.encodeFunctionData("transfer(address,uint256)", [
      user.address, // owner
      transferAmount,
    ]),
    value: '0',
    operation: OperationType.Call,
  };
  
  // NOT sponsoring gas!
  const options: MetaTransactionOptions = {
    gasLimit: '200000',
    isSponsored: false,
  };

  // second signature will be signed here! handled by the SDK
  // if the Safe is not created at this point, it will be handled by the SDK and automatically deploy 1 before the trade
  const taskId = await safeAccountAbstraction.relayTransaction([transferTx], options)
  console.log(`https://relay.gelato.digital/tasks/status/${taskId} `);
}

transferWithGelato('7000000');