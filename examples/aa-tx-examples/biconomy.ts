import { ethers } from "ethers";
import { ChainId, FeeQuote, IWalletTransaction } from "@biconomy/core-types";
import SmartAccount from "@biconomy/smart-account";
import { addresses } from '../addresses';

import dotenv from 'dotenv'
dotenv.config()

import usdcAbi from "../abi/usdc.json";

const rpcUrl = process.env.RPC_URL!;
const privateKey = process.env.OWNER_PRIVATE_KEY!

const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
const user = new ethers.Wallet(privateKey, provider);

const networkConfig = addresses.goerli

const usdcContract = new ethers.Contract(networkConfig.l1USDC, usdcAbi, user);

async function transferWithBiconomy(transferAmount: string) {
  // const walletProvider = new ethers.providers.Web3Provider(user);
  // get EOA address from wallet provider
  const eoa = await user.getAddress();

  // get SmartAccount address from wallet provider
  const wallet = new SmartAccount(user, {
    activeNetworkId: ChainId.GOERLI,
    supportedNetworksIds: [ChainId.GOERLI],
    networkConfig: [
      {
        chainId: ChainId.GOERLI,
        // Dapp API Key you will get from new Biconomy dashboard that will be live soon
        // Meanwhile you can use the test dapp api key mentioned above
        dappAPIKey: process.env.BICONOMY_API_KEY!,
      },
    ]
  });
  const smartAccount = await wallet.init();
  await smartAccount.setActiveChain(ChainId.GOERLI)
  
  const address = await smartAccount.getSmartAccountState();
  console.log(`SmartAccount address: ${address.address}`);

  const transaction = {
    to: networkConfig.l1USDC,
    data: usdcContract.interface.encodeFunctionData("transfer(address,uint256)", [eoa, transferAmount]),
    gasLimit: 100000
  };

  const feeQuotes = await smartAccount.getFeeQuotes({
    transaction: transaction,
  });
  const quote = feeQuotes.find((feeQuote) => feeQuote.symbol === "USDC") as FeeQuote
  // console.log("quote", quote)

  const userPaidTx = await smartAccount.createUserPaidTransaction({transaction, feeQuote: quote})

  const txHash = await smartAccount.sendUserPaidTransaction({tx: userPaidTx})
  console.log('tx submitted:', txHash)
}

transferWithBiconomy('5000000').then(() => process.exit(0))