import {Wallet, BigNumberish, Contract, utils} from 'ethers'
import usdcAbi from "./abi/usdc.json";
// const { ethers } = require("ethers");

export const signPermit = async (wallet: Wallet, token: string, spender: string, value: BigNumberish, deadline: number) => {
  const usdc = new Contract(token, usdcAbi, wallet.provider)

  const owner = wallet.address
  const nonce = await usdc.nonces(wallet.address)
  const name = await usdc.name()
  const version = await usdc.version()
  
  const chainId = await wallet.getChainId()
    
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

  const result = utils.splitSignature(sig)

  return result
}

export const signReceiveWithAuth = async (wallet: Wallet, token: string, to: string, value: BigNumberish, validAfter: number, validBefore: number) => {
    const usdc = new Contract(token, usdcAbi, wallet.provider)
    const name = await usdc.name()
    console.log(name)
    const version = await usdc.version()
    console.log(version)
    const nonce = utils.keccak256(utils.hexValue(Math.floor(Math.random() * 1000000000000)))
    const chainId = await wallet.getChainId()
    const from = wallet.address
    const sig = await wallet._signTypedData(
      {
        name,
        version,
        chainId,
        verifyingContract: token
      },
      {
        ReceiveWithAuthorization: [
          {
            name: 'from',
            type: 'address'
          },
          {
            name: 'to',
            type: 'address'
          },
          {
            name: 'value',
            type: 'uint256'
          },
          {
            name: 'validAfter',
            type: 'uint256'
          },
          {
            name: 'validBefore',
            type: 'uint256'
          },
          {
            name: 'nonce',
            type: 'bytes32' // notice
          }
        ]
      },
      {
        from, // from
        to,
        value,
        validAfter,
        validBefore,
        nonce,
      }
    )
    const result = utils.splitSignature(sig)

    return {sig: result, nonce}
}