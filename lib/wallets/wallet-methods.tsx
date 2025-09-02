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
    console.error('Error fetching user tokens:', error);
    throw error;
  }
};