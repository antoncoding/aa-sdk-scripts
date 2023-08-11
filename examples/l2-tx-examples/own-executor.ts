import SafeApiKit from '@safe-global/api-kit'
import Safe, { EthersAdapter, SafeAccountConfig, SafeFactory } from '@safe-global/protocol-kit'
import { SafeTransaction, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'
// dot env
import dotenv from 'dotenv'
dotenv.config()

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!)

// Sponsor's signer instance key
const executor = new ethers.Wallet(process.env.SPONSOR_PRIVATE_KEY!, provider)

const ownerSigner = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY!, provider)

const ethAdapterOwner1 = new EthersAdapter({
  ethers,
  signerOrProvider: executor
})

const txServiceUrl = 'https://safe-transaction-goerli.safe.global'
const safeService = new SafeApiKit({ txServiceUrl, ethAdapter: ethAdapterOwner1 })
let safeFactory: SafeFactory
let safeSdkSponsor: Safe
let safeAddress: string

async function deploySafe() {
  console.log(`Deploying Safe for user ${ownerSigner.address}...`)
  safeFactory = await SafeFactory.create({ ethAdapter: ethAdapterOwner1 })  

  const safeAccountConfig: SafeAccountConfig = {
    owners: [ownerSigner.address],
    threshold: 1,
  }

  const predicted = await safeFactory.predictSafeAddress(safeAccountConfig)
  console.log("predicted addr", predicted)

  /* This Safe is connected to "sponsor" because the factory was initialized 
  with an adapter that had "sponsor" as the signer. */
  safeSdkSponsor = await safeFactory.deploySafe({ safeAccountConfig })

  safeAddress = await safeSdkSponsor.getAddress()

  console.log('Your Safe has been deployed:')
  console.log(`https://goerli.etherscan.io/address/${safeAddress}`)
  console.log(`https://app.safe.global/gor:${safeAddress}`)
}

async function depositToSafe(executorSigner = executor, amount = '0.01') {

  const safeAmount = ethers.utils.parseUnits(amount, 'ether').toHexString()

  const transactionParameters = {
    to: safeAddress,
    value: safeAmount
  }

  const tx = await executorSigner.sendTransaction(transactionParameters)

  console.log(`Deposit Transaction: https://goerli.etherscan.io/tx/${tx.hash}`)
}

// Any address can be used for destination. In this example, we use vitalik.eth
async function proposeTransaction(destination = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045') {

  const transferAmount = ethers.utils.parseUnits('0.005', 'ether').toString()

  const safeTransactionData: SafeTransactionDataPartial = {
    to: destination,
    data: '0x',
    value: transferAmount
  }

  const userAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: ownerSigner
    })

  const safeSdkOwner = await Safe.create({
      ethAdapter: userAdapter,
      safeAddress
    })
  
  // Create a Safe transaction with the provided parameters
  const safeTransaction: SafeTransaction = await safeSdkOwner.createTransaction({ safeTransactionData })

  // Deterministic hash based on transaction parameters
  const safeTxHash = await safeSdkOwner.getTransactionHash(safeTransaction)

  // Sign transaction to verify that the transaction is coming from owner
  const senderSignature = await safeSdkOwner.signTransactionHash(safeTxHash)

  await safeService.proposeTransaction({
    safeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: ownerSigner.address,
    senderSignature: senderSignature.data,
  })

  return { safeTxHash };
}


async function executeTransaction(safeTxHash: string, safeSdk: Safe = safeSdkSponsor) {

  let safeBalance = await safeSdk.getBalance()

  console.log(`[Before Transaction] Safe Balance: ${ethers.utils.formatUnits(safeBalance, 'ether')} ETH`)

  const safeTransaction = await safeService.getTransaction(safeTxHash)
  const executeTxResponse = await safeSdk.executeTransaction(safeTransaction)
  const receipt = await executeTxResponse.transactionResponse?.wait()

  console.log('Transaction executed:')
  console.log(`https://goerli.etherscan.io/tx/${receipt?.transactionHash}`)

  safeBalance = await safeSdk.getBalance()

  console.log(`[After Transaction] Safe Balance: ${ethers.utils.formatUnits(safeBalance, 'ether')} ETH`)
}

async function main() {
  
  await deploySafe()
  await depositToSafe()

  const { safeTxHash } = await proposeTransaction()
  await executeTransaction(safeTxHash)

}

main()