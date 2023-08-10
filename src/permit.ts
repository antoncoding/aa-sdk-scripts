import {Wallet, BigNumber, Contract} from 'ethers'
import usdcAbi from "./abi/usdc.json";
import { splitSignature } from 'ethers/lib/utils';


export const signPermit = async (wallet: Wallet, token: string, spender: string, value: BigNumber, deadline: number) => {
  const usdc = new Contract(token, usdcAbi, wallet.provider)

  const owner = wallet.address
  const nonce = await usdc.nonces(wallet.address)
  const name = await usdc.name()
  const version = await usdc.version()
  
  const chainId =  5; // -> this should be 1 for ethereum.
    
  const sig = await wallet._signTypedData(
    {
      name,
      version,
      chainId,
      verifyingContract: token
    },
    {
      Permit: [
        {
          name: 'owner',
          type: 'address'
        },
        {
          name: 'spender',
          type: 'address'
        },
        {
          name: 'value',
          type: 'uint256'
        },
        {
          name: 'nonce',
          type: 'uint256'
        },
        {
          name: 'deadline',
          type: 'uint256'
        }
      ]
    },
    {
      owner,
      spender,
      value,
      nonce,
      deadline
    }
  )

  const result = splitSignature(sig)

  return result
}


  