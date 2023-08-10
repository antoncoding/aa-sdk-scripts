import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY!;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
  networks: {
    goerli: {
      url: "https://goerli.infura.io/v3/26251a7744c548a3adbc17880fc70764",
      accounts: [PRIVATE_KEY]
    }
  },
  
};

export default config;

