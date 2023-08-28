import { ethers } from "ethers";
import DumbPaymaster from "../artifacts/contracts/DumbPaymaster.sol/DumbPaymaster.json";

const deployerPK = process.env.SPONSOR_PRIVATE_KEY!
const provider = new ethers.providers.JsonRpcProvider(process.env.L2_RPC!)
const deployer = new ethers.Wallet(deployerPK, provider);

async function main() {

  const entryPoint = '0x33a07c35557De1e916B26a049e1165D47d462f6B'
  
  const factory = new ethers.ContractFactory(DumbPaymaster.abi, DumbPaymaster.bytecode, deployer)
  const paymaster = await factory.deploy(entryPoint);

  console.log(`DumbPaymaster deployed to ${paymaster.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
