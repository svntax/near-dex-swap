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

interface NearAccount {
  id: string;
  network: "testnet" | "mainnet";
}