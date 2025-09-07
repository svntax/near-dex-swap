const RPC_ENDPOINTS = [
  "https://rpc.intea.rs/",
  "https://rpc.mainnet.fastnear.com/",
  "https://rpc.web4.near.page/",
];

export const getUserTokens = async (accountId: string): Promise<UserTokenInfo[]> => {
  const url = `https://prices.intear.tech/get-user-tokens?account_id=${accountId}`;
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: UserTokensApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user tokens:", error);
    throw error;
  }
};

export const getTransactionsHistory = async (accountId: string): Promise<UserTx[]> => {
  const url = `https://wallet-history-service.intear.tech/api/transactions/${accountId}`;
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: UserTx[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user tokens:", error);
    throw error;
  }
};

export const getBalance = async (accountId: string, contractId: string): Promise<GetBalanceResponse> => {
  const args = {
    account_id: accountId
  };
  const argsBase64 = Buffer.from(JSON.stringify(args)).toString("base64");
  const requestBody = {
    jsonrpc: "2.0",
    id: "dontcare",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: contractId,
      method_name: "ft_balance_of",
      args_base64: argsBase64
    }
  };

  for(let i = 0; i < RPC_ENDPOINTS.length; i++){
    const url = RPC_ENDPOINTS[i];
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching token balance:", error);
      if (i === RPC_ENDPOINTS.length - 1) {
        // Ran out of retries
        throw error;
      }
    }
  }

  throw new Error("Failed to fetch user's token balance.");
};

export const byteArrayToUtf8String = (byteArray: number[]): string => {
  const utf8String = Buffer.from(byteArray).toString("utf8").replaceAll("\"", "");
  return utf8String;
};

export const viewAccount = async (accountId: string): Promise<ViewAccountResponse> => {
  const requestBody = {
    jsonrpc: "2.0",
    id: "dontcare",
    method: "query",
    params: {
      request_type: "view_account",
      finality: "final",
      account_id: accountId
    }
  };

  for(let i = 0; i < RPC_ENDPOINTS.length; i++){
    const url = RPC_ENDPOINTS[i];
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error viewing user's account:", error);
      if (i === RPC_ENDPOINTS.length - 1) {
        // Ran out of retries
        throw error;
      }
    }
  }

  throw new Error("Failed to fetch user's account data.");
};