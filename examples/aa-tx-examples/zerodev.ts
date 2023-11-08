import { ethers } from 'ethers';
import { addresses } from '../addresses';
import { ECDSAProvider, convertEthersSignerToAccountSigner } from '@zerodev/sdk';
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

const usdcContract = new ethers.Contract(USDC, usdcAbi, user);

async function transferWithZeroDev(transferAmount: string) {
  console.log('rpcUrl', rpcUrl);

  console.log(`Transfer with ZeroDev sdk... Owner: ${user.address}`);
  const ecdsaProvider = await ECDSAProvider.init({
    projectId: zerodevId,
    owner,
    opts: {
      accountConfig: {
        rpcClient: rpcUrl,
      },
      providerConfig: {
        // hardcoding a alchemy endpoint now (which supports AA) since the ones in viem package is not working
        rpcUrl: 'https://eth-goerli.g.alchemy.com/v2/MwEaGyMty-bFDSlO6TXPCNNEsh_nZqSB',
      },
    },
  });
  console.log('init');
  const accountAddress = await ecdsaProvider.getAddress();
  console.log('Kernel address:\t', accountAddress);

  const { hash } = await ecdsaProvider.sendUserOperation({
    target: USDC as `0x${string}`,
    data: usdcContract.interface.encodeFunctionData('transfer(address,uint256)', [
      user.address, // owner
      transferAmount,
    ]) as `0x${string}`,
    ethers: BigInt(transferAmount),
  });
  await ecdsaProvider.waitForUserOperationTransaction(hash as `0x${string}`);
}

transferWithZeroDev('5000000').then(() => process.exit(0));
