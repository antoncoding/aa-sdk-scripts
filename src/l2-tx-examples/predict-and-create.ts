import SafeApiKit from '@safe-global/api-kit'
import Safe, { EthersAdapter, SafeAccountConfig, SafeFactory } from '@safe-global/protocol-kit'
import { SafeTransaction, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers'
// dot env
import dotenv from 'dotenv'
dotenv.config()


// Run this file:
// npx ts-node src/l2-tx-examples/predict-and-create.ts
const RPC_URL = 'https://goerli.infura.io/v3/26251a7744c548a3adbc17880fc70764'
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

// Initialize signers

// Sponsor's signer instance key
const sponsorSigner = new ethers.Wallet(process.env.SPONSOR_PRIVATE_KEY!, provider)
const ownerSigner = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY!, provider)

const ethAdapterOwner1 = new EthersAdapter({
  ethers,
  signerOrProvider: sponsorSigner
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
    // ... (Optional params) 
    // https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit#deploysafe
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

async function depositToSafe(depositSigner = sponsorSigner, amount = '0.01') {

  const safeAmount = ethers.utils.parseUnits(amount, 'ether').toHexString()

  const transactionParameters = {
    to: safeAddress,
    value: safeAmount
  }

  const tx = await depositSigner.sendTransaction(transactionParameters)

  console.log(`Deposit Transaction: https://goerli.etherscan.io/tx/${tx.hash}`)
}

// Any address can be used for destination. In this example, we use vitalik.eth
async function proposeTransaction(transferAmount = '0.005', destination = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045') {

  // Create a transaction object
  transferAmount = ethers.utils.parseUnits(transferAmount, 'ether').toString()

  const safeTransactionData: SafeTransactionDataPartial = {
    to: destination,
    data: '0x',
    value: transferAmount
  }

  const ethAdapterOwner = new EthersAdapter({
      ethers,
      signerOrProvider: ownerSigner
    })

  const safeSdkOwner = await Safe.create({
      ethAdapter: ethAdapterOwner,
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

// async function confirmTransaction() {

//   const pendingTransactions = (await safeService.getPendingTransactions(safeAddress)).results

//   // Assumes that the first pending transaction is the transaction we want to confirm
//   const transaction = pendingTransactions[0]
//   const safeTxHash = transaction.safeTxHash

//   const ethAdapterOwner2 = new EthersAdapter({
//     ethers,
//     signerOrProvider: owner2Signer
//   })

//   const safeSdkOwner2 = await Safe.create({
//     ethAdapter: ethAdapterOwner2,
//     safeAddress
//   })

//   const signature = await safeSdkOwner2.signTransactionHash(safeTxHash)
//   const response = await safeService.confirmTransaction(safeTxHash, signature.data)

//   console.log('Transaction confirmed:', response)
//   return { safeTxHash, confirmationResponse: response }
// }

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