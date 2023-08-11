import { ethers } from 'ethers'
import { GelatoRelay, CallWithERC2771Request, ERC2771Type } from "@gelatonetwork/relay-sdk";
const relay = new GelatoRelay();

// dot env
import dotenv from 'dotenv'
dotenv.config()

// import l1BridgeAbi from "../abi/L1StandardBridgeProxy.json";
// import usdcAbi from "../abi/usdc.json";
import forwarderAbi from "../abi/lyra-forwarder.json";

import {signPermit} from "../permit"

const OWNER_PK = process.env.OWNER_PRIVATE_KEY!

const RPC_URL = 'https://goerli.infura.io/v3/26251a7744c548a3adbc17880fc70764'
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY!;

// This will be connected wallet in Metamask
const user = new ethers.Wallet(OWNER_PK, provider);

// network configs
const mainnetUSDC = '0x07865c6e87b9f70255377e024ace6630c1eaa37f' // goerli
const lyraForwarder = '0x1dC3c8f65529E32626bbbb901cb743d373a7193e'

const l2Safe = '0xe3b35100706f86257372478a2D41C2f317E16c5f'

// contract instances
const forwarder = new ethers.Contract(lyraForwarder, forwarderAbi, user);

async function relayTransaction() {
  
  const depositAmount = '77000000';

  
  // Build Permit data
  const deadline = Math.floor(Date.now() / 1000) + 86400;
  const permitData = await signPermit(user, mainnetUSDC, lyraForwarder,  depositAmount, deadline)
  
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
    target: lyraForwarder,
    data: ethers.utils.hexlify(data as string),
    user: user.address
  };

  const sigData = await relay.getSignatureDataERC2771(request, user, ERC2771Type.SponsoredCall);

  console.log("sigData.struct", sigData.struct);

  const relayResponse = await relay.sponsoredCallERC2771WithSignature(sigData.struct, sigData.signature, GELATO_RELAY_API_KEY);  
  
  console.log({ relayResponse })
  
  console.log(`https://relay.gelato.digital/tasks/status/${relayResponse.taskId} `);
}
relayTransaction();