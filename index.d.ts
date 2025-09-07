interface Token {
  id: string;
  name: string;
  symbol: string;
  price_usd: number;
  decimals: number;
  icon: string;
}

enum TokenReputation {
  Reputable,
  NotFake,
  Unknown, // Default
  Spam
}

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  icon: string;
}

interface TokenInfo {
  account_id: string;
  price_usd: string;
  main_pool: string;
  metadata: TokenMetadata;
  reputation: TokenReputation;
}

interface TokensApiResponse extends Array<TokenInfo>{}

interface UserTokensApiResponse extends Array<UserTokenInfo>{}
interface UserTokenInfo {
  balance: number;
  token: TokenInfo;
}

interface UserTx {
  block_timestamp_nanosec: number;
  transaction: {
    transaction: {
      signer_id: string;
      receiver_id: string;
      signature: string;
      hash: string;
    },
    transaction_outcome: {
      block_hash: string;
      id: string;
    },
    final_execution_status: string;
  }
}

interface NearAccount {
  id: string;
  network: "testnet" | "mainnet";
}

interface GetBalanceResponse {
  id: string;
  jsonrpc: string;
  result: {
    block_hash: string;
    block_height: number;
    result: number[];
  }
}

interface ViewAccountResponse {
  jsonrpc: string;
  result: {
    amount: string;
    block_hash: string;
    block_height: number;
    code_hash: string;
    locked: string;
    storage_paid_at: number;
    storage_usage: number;
  }
}

// Because function calls from Intear DEX Aggregator are a slightly different format than FunctionCallAction
interface NearTxActionIntear {
  FunctionCall: {
    method_name: string;
    args: string; //base64-encoded args
    gas: string;
    deposit: string;
  };
}
interface NearTransactionIntear {
  receiver_id: string;
  actions: NearTxActionIntear[];
}