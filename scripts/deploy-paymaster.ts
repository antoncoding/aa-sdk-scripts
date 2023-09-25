import { ethers } from "ethers";
import SignaturePaymaster from "../artifacts/contracts/SignaturePaymaster.sol/SignaturePaymaster.json";

const deployerPK = process.env.SPONSOR_PRIVATE_KEY!
const provider = new ethers.providers.JsonRpcProvider(process.env.L2_RPC!)
const deployer = new ethers.Wallet(deployerPK, provider);

async function main() {

  const entryPoint = '0x33a07c35557De1e916B26a049e1165D47d462f6B'
  
  const factory = new ethers.ContractFactory(SignaturePaymaster.abi, SignaturePaymaster.bytecode, deployer)
  const paymaster = await factory.deploy(entryPoint);

  console.log(`Signature Paymaster deployed to ${paymaster.address}`);

  paymaster.setSigner("0x6666fe8F577F202Ec729BF653ec25Af5403cbd76", true)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
