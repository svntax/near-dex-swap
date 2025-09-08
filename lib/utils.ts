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

export const nanosecondsToDateString = (nanoseconds: number, format: "DATETIME" | "RECENT"): string => {
  const milliseconds = Math.floor(Number(nanoseconds) / 1000000);
  const date = new Date(milliseconds);
  const now = new Date();

  if (format === "DATETIME") {
    // Format as YYYY-MM-DD HH:mm:ss in local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  if (format === "RECENT") {
    // Format as relative time (how long ago)
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Less than a minute ago
    if (diffSeconds < 60) {
        return `${diffSeconds} second${diffSeconds === 1 ? "" : "s"} ago`;
    }
    
    // Less than an hour ago
    if (diffMinutes < 60) {
        const remainingSeconds = diffSeconds % 60;
        if (remainingSeconds > 0) {
            return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"} ago`;
        }
        return `${diffMinutes} minutes ago`;
    }
    
    // Less than a day ago
    if (diffHours < 24) {
        const remainingMinutes = diffMinutes % 60;
        if (remainingMinutes > 0) {
            return `${diffHours} hour${diffHours === 1 ? "" : "s"} ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} ago`;
        }
        return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    }
    
    // More than a day
    const remainingHours = diffHours % 24;
    if (remainingHours > 0) {
        return `${diffDays} day${diffDays === 1 ? "" : "s"} ${remainingHours} hour${remainingHours === 1 ? "" : "s"} ago`;
    }
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return "Error";
};