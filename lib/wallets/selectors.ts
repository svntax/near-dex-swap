import { NearConnector } from "@hot-labs/near-connect";

export const nearConnector = new NearConnector({
  network: "mainnet",
  logger: console,
  walletConnect: {
    projectId: "",
    metadata: {},
  },
});