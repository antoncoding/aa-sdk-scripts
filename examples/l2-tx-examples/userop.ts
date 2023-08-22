import { ethers } from "ethers";
import { addresses } from '../addresses';

import { Client, Presets, Constants } from "userop";
import { BundlerJsonRpcProvider } from "userop";

console.log("Constants.SimpleFactory", Constants.ERC4337.SimpleAccount.Factory)

import dotenv from 'dotenv'
dotenv.config()

const privateKey = process.env.OWNER_PRIVATE_KEY!
const bundlerUrl = process.env.LOCAL_BUNDLER_URL!

const entryPoint = process.env.LOCAL_ENTRY_POINT!
const simpleAccountFactory = process.env.LOCAL_SIMPLEACCOUNT_FACTORY

const rpcUrl = process.env.L2_RPC!; // Lyra staging
// const nodeProvider = new ethers.providers.JsonRpcProvider(rpcUrl)
const provider = new BundlerJsonRpcProvider(rpcUrl).setBundlerRpc(bundlerUrl);

const user = new ethers.Wallet(privateKey, provider);

const networkConfig = addresses.goerli


async function transferWithUserOp(transferAmount: string) {

    
  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    user, // Any object compatible with ethers.Signer
    rpcUrl,
    {
      entryPoint: entryPoint,
      factory: simpleAccountFactory,
      overrideBundlerRpc: bundlerUrl
    }
  );

  const client = await Client.init(rpcUrl, {overrideBundlerRpc: bundlerUrl, entryPoint: entryPoint});

  // just random transfer now
  const target = networkConfig.l1USDC as `0x${string}`;
  const value = BigInt(transferAmount);

  const res = await client.sendUserOperation(
    simpleAccount.execute(target, value, "0x"),
    { onBuild: (op) => console.log("Signed UserOperation:", op)}
  );
  console.log(`UserOpHash: ${res.userOpHash}`);

  console.log("Waiting for transaction...");
  const ev = await res.wait();
    
  
  
}

transferWithUserOp('5000000').then(() => process.exit(0))