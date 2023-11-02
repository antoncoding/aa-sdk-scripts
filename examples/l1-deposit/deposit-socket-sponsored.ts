import { ethers } from 'ethers'
import { GelatoRelay, CallWithERC2771Request, ERC2771Type } from "@gelatonetwork/relay-sdk";
import { addresses } from '../addresses';
import {signReceiveWithAuth} from "../permit"
import forwarderAbi from "../abi/lyra-forwarder.json";

// dot env
import dotenv from 'dotenv'
dotenv.config()

const OWNER_PK = process.env.OWNER_PRIVATE_KEY!
const RPC_URL = process.env.RPC_URL!;
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
async function relayTransactionSponsored() {
  console.log('user address', user.address)
  const depositAmount = '7000000';

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
  
  console.log(`https://relay.gelato.digital/tasks/status/${relayResponse.taskId} `);
}


relayTransactionSponsored();