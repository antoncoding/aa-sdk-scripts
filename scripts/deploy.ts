import hre from "hardhat";
import { ethers } from "ethers";
import forwarderBytecode from "../artifacts/contracts/LyraForwarder.sol/LyraForwarder.json";

const deployerPK = process.env.SPONSOR_PRIVATE_KEY!
const RPC_URL = 'https://goerli.infura.io/v3/26251a7744c548a3adbc17880fc70764'
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
const deployer = new ethers.Wallet(deployerPK, provider);

async function main() {

  const gelatoRelay1Balance = '0xd8253782c45a12053594b9deB72d8e8aB2Fca54c'
  const usdcGoerli = '0x07865c6e87b9f70255377e024ace6630c1eaa37f'
  const usdcRollup = '0x7E07E15D2a87A24492740D16f5bdF58c16db0c4E'
  const standardBridge = '0x636Af16bf2f682dD3109e60102b8E1A089FedAa8' 
  
  const factory = new ethers.ContractFactory(forwarderBytecode.abi, forwarderBytecode.bytecode, deployer)
  const forwarder = await factory.deploy(gelatoRelay1Balance, usdcGoerli, usdcRollup, standardBridge);

  console.log(`LyraForwarder deployed to ${forwarder}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
