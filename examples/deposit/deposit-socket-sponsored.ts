import { ethers, utils } from 'ethers'
import { GelatoRelay, CallWithERC2771Request, ERC2771Type } from "@gelatonetwork/relay-sdk";
import { addresses } from '../addresses';
import { signReceiveWithAuth } from "../permit"
import forwarderAbi from "../abi/lyra-forwarder.json";
import usdcAbi from "../abi/usdc.json";

// dot env
import dotenv from 'dotenv'
dotenv.config()

const RPC_URL = 'https://optimism-goerli.blockpi.network/v1/rpc/public'

const OWNER_PK = process.env.OWNER_PRIVATE_KEY!
const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY!;

const networkConfig = addresses.goerliOptimism

// This will be connected wallet in Metamask
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
const user = new ethers.Wallet(OWNER_PK, provider);

const relay = new GelatoRelay();

// contract instances
const forwarder = new ethers.Contract(networkConfig.lyraForwarderSponsored, forwarderAbi, user);

/**
 * npx ts-node examples/l1-deposit/deposit-socket-sponsored.ts
 * 
 */
async function run() {
  console.log('Depositing USDC with Gelato + Socket from', user.address)
  console.log('NetworkID:\t', (await (provider.getNetwork())).chainId)
  
  const depositAmount = '7000000';

  const usdc = new ethers.Contract(networkConfig.l1USDC, usdcAbi, user.provider)
  const balance = await usdc.balanceOf(user.address)
  console.log('Balance:\t', utils.formatUnits(balance, 6), 'USDC')

  // calculate L2 safe address to deposit in, or it can be any recipient
  const toSCW = true

  // Build Permit data
  const now = Math.floor(Date.now() / 1000)
  const deadline = now + 86400;
  const {sig, nonce} = await signReceiveWithAuth(user, networkConfig.l1USDC, forwarder.address, depositAmount, now, deadline)
  
  // whole tx
  const minGas = '400000'
  const { data } = await forwarder.populateTransaction.depositUSDCSocketBridge(depositAmount, toSCW, minGas, {
    value: depositAmount,
    validAfter: now,
    validBefore: deadline,
    nonce: nonce,
    v: sig.v,
    r: sig.r,
    s: sig.s,
  })
  
  // Populate a relay request
  const request: CallWithERC2771Request = {
    chainId: provider.network.chainId,
    target: forwarder.address,
    data: ethers.utils.hexlify(data as string),
    user: user.address
  };

  const sigData = await relay.getSignatureDataERC2771(request, user, ERC2771Type.SponsoredCall);

  const relayResponse = await relay.sponsoredCallERC2771WithSignature(sigData.struct, sigData.signature, GELATO_RELAY_API_KEY);  
  
  // Print status
  console.log('Gelato Task:\t', `https://relay.gelato.digital/tasks/status/${relayResponse.taskId}`);

  for(let i = 1; i < 10; i++) {
    const status = await relay.getTaskStatus(relayResponse.taskId);
    if (status?.taskState === "CheckPending" ||  status?.taskState === "ExecPending" || status?.taskState === "WaitingForConfirmation") {
      console.log('Task Status:\t', status?.taskState);
      await new Promise(r => setTimeout(r, 2000));
      continue  
    }
    
    // All non waiting states:
    console.log('Task Status:\t', status?.taskState);
    if (status?.transactionHash) {
      console.log('Transaction Hash:\t', status?.transactionHash);
    } 
    break
  }

  const balanceAfter = await usdc.balanceOf(user.address)
  console.log('New Balance:\t', utils.formatUnits(balanceAfter, 6), 'USDC')
}


run();