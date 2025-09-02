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

export const getBalance = async (accountId: string, contractId: string): Promise<GetBalanceResponse> => {
  const url = "https://rpc.intea.rs/"; // Should probably add fallbacks?
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
    throw error;
  }
};

export const byteArrayToUtf8String = (byteArray: number[]): string => {
  const utf8String = Buffer.from(byteArray).toString("utf8").replaceAll("\"", "");
  return utf8String;
};