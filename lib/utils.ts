import { FunctionCallAction, Transaction } from "@hot-labs/near-connect/build/types/transactions";

// Util functions
export const calculateExchangeRate = (tokenA: Token, tokenB: Token) => {
  if (tokenB.price_usd === 0) return 0;
  return tokenA.price_usd / tokenB.price_usd;
};

export const convertToBaseUnit = (amount: string, token: Token): string => {
  if (!amount || !token.decimals) return "0";
  
  try {
    const cleanAmount = amount.replace(/,/g, "").trim();
    if (!cleanAmount || isNaN(parseFloat(cleanAmount))) return "0";
    
    const [wholePart, decimalPart = ""] = cleanAmount.split(".");
    const paddedDecimal = (decimalPart + "0".repeat(token.decimals)).substring(0, token.decimals);
    const combined = wholePart + paddedDecimal;
    const result = combined.replace(/^0+/, "") || "0";
    
    return result;
  } catch (error) {
    console.error("Error converting amount:", error);
    return "0";
  }
};

export const convertToDisplayUnit = (baseAmount: string, token: Token): string => {
  if (!baseAmount || !token.decimals) return "0";
  
  try {
    const amountBigInt = BigInt(baseAmount);
    const divisor = BigInt(Math.pow(10, token.decimals));
    
    const wholePart = amountBigInt / divisor;
    const fractionalPart = amountBigInt % divisor;
    const fractionalStr = fractionalPart.toString().padStart(token.decimals, "0");
    return `${wholePart.toString()}.${fractionalStr}`;
  } catch (error) {
    console.error("Error converting display amount:", error);
    return "0";
  }
};

export const createTransactionFromIntearTransaction = (tx: NearTransactionIntear, signerId: string, receiverId: string): Transaction => {
  const actions: FunctionCallAction[] = [];
  tx.actions.forEach((action) => actions.push({
    type: "FunctionCall",
    params: {
      methodName: action.FunctionCall.method_name,
      args: JSON.parse(Buffer.from(action.FunctionCall.args, "base64").toString()),
      gas: action.FunctionCall.gas,
      deposit: action.FunctionCall.deposit
    }
  }));
  return {
    signerId: signerId,
    receiverId: receiverId,
    actions: actions
  }
}