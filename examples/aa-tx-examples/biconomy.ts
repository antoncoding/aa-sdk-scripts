import { ethers } from 'ethers';
import { ChainId, FeeQuote } from '@biconomy/core-types';
import SmartAccount from '@biconomy/smart-account';
import { addresses } from '../addresses';

import dotenv from 'dotenv';
dotenv.config();

import usdcAbi from '../abi/usdc.json';

const rpcUrl = process.env.RPC_URL!;
const privateKey = process.env.OWNER_PRIVATE_KEY!;

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const user = new ethers.Wallet(privateKey, provider);

const USDC = addresses.goerli.l1USDC;

const usdcContract = new ethers.Contract(USDC, usdcAbi, user);

/**
 * @command npx ts-node examples/aa-tx-examples/biconomy.ts
 */
async function transferWithBiconomy(transferAmount: string) {
  
  // get SmartAccount address from wallet provider
  const wallet = new SmartAccount(user, {
    activeNetworkId: ChainId.GOERLI,
    supportedNetworksIds: [ChainId.GOERLI],
    networkConfig: [
      {
        chainId: ChainId.GOERLI,
        dappAPIKey: process.env.BICONOMY_API_KEY!,
      },
    ],
  });
  const smartAccount = await wallet.init();
  await smartAccount.setActiveChain(ChainId.GOERLI);

  const address = await smartAccount.getSmartAccountState();
  console.log(`SmartAccount address:\t${address.address}`);

  const transaction = {
    to: USDC,
    data: usdcContract.interface.encodeFunctionData('transfer(address,uint256)', [
      user.address,
      transferAmount,
    ]),
    gasLimit: 200000,
  };

  const feeQuotes = await smartAccount.getFeeQuotes({
    transaction: transaction,
  });
  const quote = feeQuotes.find((feeQuote) => feeQuote.symbol === 'USDC') as FeeQuote;
  console.log('quote', quote);

  const userPaidTx = await smartAccount.createUserPaidTransaction({ transaction, feeQuote: quote });

  const txHash = await smartAccount.sendUserPaidTransaction({ tx: userPaidTx });
  console.log('Tx Submitted:\t', txHash);
}

transferWithBiconomy('5000000').then(() => process.exit(0));
