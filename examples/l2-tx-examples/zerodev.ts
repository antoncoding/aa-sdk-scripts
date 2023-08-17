import { ethers } from "ethers";
import { ChainId, FeeQuote, IWalletTransaction } from "@biconomy/core-types";
import SmartAccount from "@biconomy/smart-account";
import { addresses } from '../addresses';
import { ECDSAProvider } from '@zerodev/sdk'
import { PrivateKeySigner } from "@alchemy/aa-core"
import { encodeFunctionData, parseAbi, createPublicClient, http } from 'viem'
import { goerli } from 'viem/chains'


import dotenv from 'dotenv'
dotenv.config()

import usdcAbi from "../abi/usdc.json";

const zerodevId = process.env.ZERO_DEV_PROJECT_ID!
const privateKey = process.env.OWNER_PRIVATE_KEY!

// The "owner" of the AA wallet, which in this case is a private key
const owner = PrivateKeySigner.privateKeyToAccountSigner(privateKey as `0x${string}`)

const rpcUrl = process.env.RPC_URL!;


const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
const user = new ethers.Wallet(privateKey, provider);


const networkConfig = addresses.goerli

const usdcContract = new ethers.Contract(networkConfig.l1USDC, usdcAbi, user);

async function transferWithZeroDev(transferAmount: string) {
  
  const ecdsaProvider = await ECDSAProvider.init({
    projectId: zerodevId,
    owner,
  })
  // const accountAddress = await ecdsaProvider.getAddress()
  // console.log('Wallet address:', accountAddress)

  // Mint the NFT
  const { hash } = await ecdsaProvider.sendUserOperation({
    target: networkConfig.l1USDC as `0x${string}`,
    data: usdcContract.interface.encodeFunctionData("transfer(address,uint256)", [
      user.address, // owner
      transferAmount,
    ]) as `0x${string}`,
  })
  await ecdsaProvider.waitForUserOperationTransaction(hash as `0x${string}`)
  
  
}

transferWithZeroDev('5000000').then(() => process.exit(0))