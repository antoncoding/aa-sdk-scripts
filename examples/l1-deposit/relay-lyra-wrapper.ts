import { ethers } from 'ethers'
import { GelatoRelay, CallWithERC2771Request, ERC2771Type } from "@gelatonetwork/relay-sdk";
import { addresses } from '../addresses';
import {signPermit} from "../permit"
import forwarderAbi from "../abi/lyra-forwarder.json";

// dot env
import dotenv from 'dotenv'
dotenv.config()

const OWNER_PK = process.env.OWNER_PRIVATE_KEY!
const RPC_URL = process.env.RPC_URL!;
const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY!;

const networkConfig = addresses.goerli

// This will be connected wallet in Metamask
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
const user = new ethers.Wallet(OWNER_PK, provider);

const relay = new GelatoRelay();

// contract instances
const forwarder = new ethers.Contract(networkConfig.lyraForwarder, forwarderAbi, user);

async function relayTransaction() {
  const depositAmount = '77000000';

  // calculate L2 safe address to deposit in, or it can be any recipient
  const l2Safe = '0xe3b35100706f86257372478a2D41C2f317E16c5f'

  // Build Permit data
  const deadline = Math.floor(Date.now() / 1000) + 86400;
  const permitData = await signPermit(user, networkConfig.l1USDC, networkConfig.lyraForwarder,  depositAmount, deadline)
  
  // whole tx
  const minGas = '200000'
  const { data } = await forwarder.populateTransaction.forwardUSDCToL2({
    value: depositAmount,
    deadline: deadline,
    v: permitData.v,
    r: permitData.r,
    s: permitData.s,
  }, depositAmount, l2Safe, minGas)
  
  // Populate a relay request
  const request: CallWithERC2771Request = {
    chainId: provider.network.chainId,
    target: networkConfig.lyraForwarder,
    data: ethers.utils.hexlify(data as string),
    user: user.address
  };

  const sigData = await relay.getSignatureDataERC2771(request, user, ERC2771Type.SponsoredCall);

  const relayResponse = await relay.sponsoredCallERC2771WithSignature(sigData.struct, sigData.signature, GELATO_RELAY_API_KEY);  
  
  console.log(`https://relay.gelato.digital/tasks/status/${relayResponse.taskId} `);
}


relayTransaction();