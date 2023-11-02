export const addresses = {
  goerli: {
    l1USDC: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
    l2USDC: '0x7E07E15D2a87A24492740D16f5bdF58c16db0c4E',
    l1StandardBridge: '0x636Af16bf2f682dD3109e60102b8E1A089FedAa8',
    lyraForwarder: '0x1dC3c8f65529E32626bbbb901cb743d373a7193e', // old version
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    simpleAccountFactory: '0x9406Cc6185a346906296840746125a0E44976454'
  },
  goerliOptimism: {
    l1USDC: '0x0f8BEaf58d4A237C88c9ed99D82003ab5c252c26', // our clone of USDC on op-goerli, with 18 decimals
    l2USDC: '0xe80F2a02398BBf1ab2C9cc52caD1978159c215BD', // our testnet USDC //
    l1StandardBridge: '0x0000000000000000000000000000000000000001',
    lyraForwarderSponsored: '0x95c470DCd92802943A55e9F9a4111A8dCcC5B0Fc',
  },
  optimism: {
    l1USDC: '0x0f8BEaf58d4A237C88c9ed99D82003ab5c252c26', // real usdc, used to test selfPaying forwarder
    l2USDC: '0xe80F2a02398BBf1ab2C9cc52caD1978159c215BD', // ribbon mainnet USDC
    l1StandardBridge: '0x0000000000000000000000000000000000000001',
    lyraForwarderSelfPaying: '',
  }
}