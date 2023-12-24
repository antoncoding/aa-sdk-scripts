import { ethers, BigNumber } from "ethers";

import { Client, Presets } from "userop";
import { BundlerJsonRpcProvider, IUserOperationMiddlewareCtx } from "userop";

import dotenv from 'dotenv'
dotenv.config()

import usdcAbi from "../abi/usdc.json";


const privateKey = process.env.OWNER_PRIVATE_KEY!
const bundlerUrl = process.env.LOCAL_BUNDLER_URL!

const rpcUrl = process.env.L2_RPC!; // Lyra staging
const provider = new BundlerJsonRpcProvider(rpcUrl).setBundlerRpc(bundlerUrl);

const user = new ethers.Wallet(privateKey, provider);

// Lyra L2 Mainnet configs

const entryPoint = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'!
const lightAccountFactory = '0x000000893A26168158fbeaDD9335Be5bC96592E2'
const usdc = '0x6879287835A86F50f784313dBEd5E5cCC5bb8481'
const usdcContract = new ethers.Contract(usdc, usdcAbi, user);

// apply our own dumb paymaster: pay for anyone
// const paymasterMiddleware: (context: IUserOperationMiddlewareCtx) => Promise<void> = async (context) => {
//   context.op.paymasterAndData = '0x'
//   // previously only 21000, need to add more (adding 30000)
//   context.op.preVerificationGas = BigNumber.from(context.op.preVerificationGas).add(BigNumber.from(30000));

//   // need to update callGasLimit as well
//   context.op.callGasLimit = BigNumber.from(context.op.callGasLimit).add(BigNumber.from(60000));
// }

// Send directly from smart wallet. Needs ETH (without paymaster middleware)
async function run() {
  // simpleAccount preset
  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    user, // Any object compatible with ethers.Signer
    rpcUrl,
    {
      entryPoint: entryPoint,
      factory: lightAccountFactory,
      overrideBundlerRpc: bundlerUrl,
      // paymasterMiddleware: paymasterMiddleware
    }
  );

  const sender = simpleAccount.getSender();
  console.log('sender (smart contract wallet)', sender)

  const balance = await usdcContract.balanceOf(sender)
  console.log(`LightAcc USDC balance:\t${ethers.utils.formatUnits(balance, 6)}`)

  const client = await Client.init(rpcUrl, {overrideBundlerRpc: bundlerUrl, entryPoint: entryPoint});

  // build transaction: random send usdc tx
  const data =  usdcContract.interface.encodeFunctionData("transfer(address,uint256)", [
    '0xaa', // anyone
    balance,
  ])

  const res = await client.sendUserOperation(
    simpleAccount.execute(usdc, 0, data),
    { 
      onBuild: (op) => console.log("Signed UserOperation:", op.sender),
    }
  );
  
  console.log(`UserOpHash: ${res.userOpHash}`);

  // console.log("Waiting for transaction...");
  const result = await res.wait();  
  result?.transactionHash && console.log(`Transaction hash: ${result.transactionHash}`);
}

run().then(() => process.exit(0))