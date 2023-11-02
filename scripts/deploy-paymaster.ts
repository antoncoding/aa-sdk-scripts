import { ethers } from "ethers";
import DumbPaymaster from "../artifacts/contracts/DumbPaymaster.sol/DumbPaymaster.json";

const deployerPK = process.env.SPONSOR_PRIVATE_KEY!
const provider = new ethers.providers.JsonRpcProvider(process.env.L2_RPC!)
const deployer = new ethers.Wallet(deployerPK, provider);

// npx hardhat run scripts/deploy-paymaster.ts
async function main() {

  const entryPoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
  
  const factory = new ethers.ContractFactory(DumbPaymaster.abi, DumbPaymaster.bytecode, deployer)
  const paymaster = await factory.deploy(entryPoint);

  console.log(`DumbPaymaster deployed to ${paymaster.address}`);

  // paymaster.setSigner("0x6666fe8F577F202Ec729BF653ec25Af5403cbd76", true)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
