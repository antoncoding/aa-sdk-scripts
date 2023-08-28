import { ethers, BigNumber } from "ethers";
import { addresses } from '../addresses';

import { Client, Presets } from "userop";
import { BundlerJsonRpcProvider, IUserOperationMiddlewareCtx } from "userop";

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

const dumbPaymaster = "0xd198a6f2B3D07a03161FAB8006502e911e5c548e";

// apply our own dumb paymaster: pay for anyone
const paymasterMiddleware: (context: IUserOperationMiddlewareCtx) => Promise<void> = async (context) => {
  context.op.paymasterAndData = dumbPaymaster;
  // previously only 21000, need to add more (adding 30000)
  context.op.preVerificationGas = BigNumber.from(context.op.preVerificationGas).add(BigNumber.from(30000));
}

async function transferWithUserOp(transferAmount: string) {
  // simpleAccount preset
  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    user, // Any object compatible with ethers.Signer
    rpcUrl,
    {
      entryPoint: entryPoint,
      factory: simpleAccountFactory,
      overrideBundlerRpc: bundlerUrl,
      paymasterMiddleware: paymasterMiddleware
    }
  );

  const sender = simpleAccount.getSender();
  console.log('sender (smart contract wallet)', sender)

  const client = await Client.init(rpcUrl, {overrideBundlerRpc: bundlerUrl, entryPoint: entryPoint});

  // build transaction: USDC transfer for now
  const target = networkConfig.l1USDC as `0x${string}`;
  const value = BigInt(transferAmount);

  const res = await client.sendUserOperation(
    simpleAccount.execute(target, value, "0x"),
    { 
      onBuild: (op) => console.log("Signed UserOperation:", op.sender),
    }
  );
  // console.log(op.sender)
  // const res = await client.sendUserOperation(op);
  console.log(`UserOpHash: ${res.userOpHash}`);

  // console.log("Waiting for transaction...");
  const result = await res.wait();  
  result?.transactionHash && console.log(`Transaction hash: ${result.transactionHash}`);
}

transferWithUserOp('1000000').then(() => process.exit(0))