import { ethers } from "ethers";
import { addresses } from '../addresses';
import { ECDSAProvider } from '@zerodev/sdk'
import { LocalAccountSigner } from "@alchemy/aa-core"

import dotenv from 'dotenv'
dotenv.config()

import usdcAbi from "../abi/usdc.json";

const zerodevId = process.env.ZERO_DEV_PROJECT_ID! // 'e6c7a838-b56c-4050-89f9-03a39a85fe21' // mumbai
const privateKey = process.env.OWNER_PRIVATE_KEY!

// The "owner" of the AA wallet, which in this case is a private key
const owner = LocalAccountSigner.privateKeyToAccountSigner(privateKey as `0x${string}`)

const rpcUrl = process.env.RPC_URL!; // goerli

const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
const user = new ethers.Wallet(privateKey, provider);


const networkConfig = addresses.goerli

const usdcContract = new ethers.Contract(networkConfig.l1USDC, usdcAbi, user);

async function transferWithZeroDev(transferAmount: string) {
  
  const ecdsaProvider = await ECDSAProvider.init(
    {
      projectId: zerodevId,
      owner,
      opts: {
        accountConfig: {
          rpcClient: rpcUrl
        },
        // providerConfig: {
        //   // hardcoding a alchemy endpoint now (which supports AA) since the ones in viem package is not working
        //   rpcUrl: 'https://eth-goerli.g.alchemy.com/v2/MwEaGyMty-bFDSlO6TXPCNNEsh_nZqSB',

        // }
      },
    })
  const accountAddress = await ecdsaProvider.getAddress()
  console.log('Wallet address:', accountAddress)

  
  // const { hash } = await ecdsaProvider.sendUserOperation({
  //   target: networkConfig.l1USDC as `0x${string}`,
  //   // data: usdcContract.interface.encodeFunctionData("transfer(address,uint256)", [
  //   //   user.address, // owner
  //   //   transferAmount,
  //   // ]) as `0x${string}`,
  //   ethers: BigInt(transferAmount)
  // })
  // await ecdsaProvider.waitForUserOperationTransaction(hash as `0x${string}`)
  
  
}

transferWithZeroDev('5000000').then(() => process.exit(0))