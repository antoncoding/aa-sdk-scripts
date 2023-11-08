import { ethers } from 'ethers';
import { addresses } from '../addresses';
import { ECDSAProvider } from '@zerodev/sdk';
import { LocalAccountSigner } from '@alchemy/aa-core';

import dotenv from 'dotenv';
dotenv.config();

import usdcAbi from '../abi/usdc.json';

const zerodevId = process.env.ZERO_DEV_PROJECT_ID!;
const privateKey = process.env.OWNER_PRIVATE_KEY!;
const owner = LocalAccountSigner.privateKeyToAccountSigner(privateKey as `0x${string}`);

const rpcUrl = process.env.RPC_URL!;

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const user = new ethers.Wallet(privateKey, provider);

const USDC = addresses.goerli.l1USDC;

const usdcContract = new ethers.Contract(USDC, usdcAbi, provider);

async function transferWithZeroDev(transferAmount: string) {
  console.log(`Transfer with ZeroDev sdk... Owner: ${user.address}`);

  const ecdsaProvider = await ECDSAProvider.init({
    projectId: zerodevId,
    owner,
  });
  
  const accountAddress = await ecdsaProvider.getAddress();
  console.log('Kernel address:\t', accountAddress);

  const balance = await usdcContract.balanceOf(accountAddress);
  console.log(`Kernel balance:\t${ethers.utils.formatUnits(balance, 6)} USDC`);

  const { hash } = await ecdsaProvider.sendUserOperation({
    target: USDC as `0x${string}`,
    data: usdcContract.interface.encodeFunctionData('transfer(address,uint256)', [
      user.address, // owner
      transferAmount,
    ]) as `0x${string}`,
    gasLimit: 200000,
  });
  await ecdsaProvider.waitForUserOperationTransaction(hash as `0x${string}`);
}

transferWithZeroDev('5000000').then(() => process.exit(0));
