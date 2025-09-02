"use client";

import { useState, useEffect } from "react";
import { TokenSelectorModal } from "./token-selector-modal";
import { LoadingSpinner } from "./loading-spinner";
import { NearWallet } from "@hot-labs/near-connect";
import Image from "next/image";
import { NearWalletSelector } from "./wallet-selector";
import { Account, Optional } from "@hot-labs/near-connect/build/types/wallet";
import { nearConnector } from "@/lib/wallets/selectors";
import { byteArrayToUtf8String, getUserTokens, getBalance, viewAccount } from "@/lib/wallets/wallet-methods";
import { calculateExchangeRate, createTransactionFromIntearTransaction, convertToBaseUnit, convertToDisplayUnit } from "@/lib/utils";
import { Transaction } from "@hot-labs/near-connect/build/types/transactions";

interface NearIntentsQuote {
  message_to_sign: string; // TODO: Is this correct?
  quote_hash: string;  
}

interface ExecutionInstruction {
  NearTransaction?: NearTransactionIntear;
  IntentsQuote?: NearIntentsQuote;
}

interface DexRouteRequest {
  token_in: string;               // "near" or a NEP-141 contract ID
  token_out: string;              // "near" or a NEP-141 contract ID
  amount_in?: string;
  amount_out?: string;
  max_wait_ms?: number;           // Up to 60000ms
  slippage_type: "Auto" | "Fixed";
  slippage?: number;              // Required if slippage_type is "Fixed"
  max_slippage?: number;          // Required if slippage_type is "Auto"
  min_slippage?: number;          // Required if slippage_type is "Auto"
  dexes?: string[];               // List of DEX IDs (Rhea, Vheax, etc.)
  trader_account_id?: string;     // Optional account ID for storage deposits
  signing_public_key?: string;    // Optional public key for NEAR Intents signing
}

interface DexRouteResponse {
  deadline: string | null;
  has_slippage: boolean;
  estimated_amount: {
    amount_out: string;
  };
  worst_case_amount: {
    amount_out: string;
  };
  dex_id: string;
  execution_instructions: ExecutionInstruction[];
  needs_unwrap: boolean;
}

// Hard-coded tokens to include on start (NEAR, USDC)
const INITIAL_TOKENS: Token[] = [
  { id: "near", name: "NEAR", symbol: "NEAR", price_usd: 0, decimals: 24, icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4MCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTA4MCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTA4MCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjMDBFQzk3Ii8+CjxwYXRoIGQ9Ik03NzMuNDI1IDI0My4zOEM3NTEuNDUzIDI0My4zOCA3MzEuMDU0IDI1NC43NzIgNzE5LjU0NCAyNzMuNDk5TDU5NS41MzggNDU3LjYwNkM1OTEuNDk5IDQ2My42NzMgNTkzLjEzOCA0NzEuODU0IDU5OS4yMDYgNDc1Ljg5M0M2MDQuMTI0IDQ3OS4xNzIgNjEwLjYzMSA0NzguNzY2IDYxNS4xMSA0NzQuOTEzTDczNy4xNzIgMzY5LjA0MkM3MzkuMiAzNjcuMjE3IDc0Mi4zMjcgMzY3LjQwMyA3NDQuMTUyIDM2OS40MzFDNzQ0Ljk4IDM3MC4zNjEgNzQ1LjQyIDM3MS41NjEgNzQ1LjQyIDM3Mi43OTRWNzA0LjI2NUM3NDUuNDIgNzA3LjAwMyA3NDMuMjA2IDcwOS4yIDc0MC40NjggNzA5LjJDNzM4Ljk5NyA3MDkuMiA3MzcuNjExIDcwOC41NTggNzM2LjY4MiA3MDcuNDI1TDM2Ny43MDcgMjY1Ljc1OEMzNTUuNjkgMjUxLjU3NyAzMzguMDQ1IDI0My4zOTcgMzE5LjQ3IDI0My4zOEgzMDYuNTc1QzI3MS42NzMgMjQzLjM4IDI0My4zOCAyNzEuNjczIDI0My4zOCAzMDYuNTc1Vjc3My40MjVDMjQzLjM4IDgwOC4zMjcgMjcxLjY3MyA4MzYuNjIgMzA2LjU3NSA4MzYuNjJDMzI4LjU0NiA4MzYuNjIgMzQ4Ljk0NiA4MjUuMjI4IDM2MC40NTYgODA2LjUwMUw0ODQuNDYyIDYyMi4zOTRDNDg4LjUwMSA2MTYuMzI3IDQ4Ni44NjIgNjA4LjE0NiA0ODAuNzk0IDYwNC4xMDdDNDc1Ljg3NiA2MDAuODI4IDQ2OS4zNjkgNjAxLjIzNCA0NjQuODkgNjA1LjA4N0wzNDIuODI4IDcxMC45NThDMzQwLjggNzEyLjc4MyAzMzcuNjczIDcxMi41OTcgMzM1Ljg0OCA3MTAuNTY5QzMzNS4wMiA3MDkuNjM5IDMzNC41OCA3MDguNDM5IDMzNC41OTcgNzA3LjIwNlYzNzUuNjUxQzMzNC41OTcgMzcyLjkxMyAzMzYuODExIDM3MC43MTUgMzM5LjU0OSAzNzAuNzE1QzM0MS4wMDMgMzcwLjcxNSAzNDIuNDA2IDM3MS4zNTggMzQzLjMzNSAzNzIuNDlMNzEyLjI1OSA4MTQuMjQyQzcyNC4yNzYgODI4LjQyMyA3NDEuOTIxIDgzNi42MDMgNzYwLjQ5NiA4MzYuNjJINzczLjM5MkM4MDguMjkzIDgzNi42MzcgODM2LjYwMyA4MDguMzYxIDgzNi42MzcgNzczLjQ1OVYzMDYuNTc1QzgzNi42MzcgMjcxLjY3MyA4MDguMzQ0IDI0My4zOCA3NzMuNDQyIDI0My4zOEg3NzMuNDI1WiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+" },
  { id: "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1", name: "USDC", symbol: "USDC", price_usd: 1.0, decimals: 6, icon: "data:image/svg+xml,%3C%3Fxml version=%221.0%22 encoding=%22utf-8%22%3F%3E%3C!-- Generator: Adobe Illustrator 22.0.1, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg version=%221.1%22 id=%22Layer_1%22 xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 x=%220px%22 y=%220px%22 viewBox=%220 0 256 256%22 style=%22enable-background:new 0 0 256 256;%22 xml:space=%22preserve%22%3E%3Cstyle type=%22text/css%22%3E .st0%7Bfill:%232775CA;%7D .st1%7Bfill:%23FFFFFF;%7D%0A%3C/style%3E%3Ccircle class=%22st0%22 cx=%22128%22 cy=%22128%22 r=%22128%22/%3E%3Cpath class=%22st1%22 d=%22M104,217c0,3-2.4,4.7-5.2,3.8C60,208.4,32,172.2,32,129.3c0-42.8,28-79.1,66.8-91.5c2.9-0.9,5.2,0.8,5.2,3.8 v7.5c0,2-1.5,4.3-3.4,5C69.9,65.4,48,94.9,48,129.3c0,34.5,21.9,63.9,52.6,75.1c1.9,0.7,3.4,3,3.4,5V217z%22/%3E%3Cpath class=%22st1%22 d=%22M136,189.3c0,2.2-1.8,4-4,4h-8c-2.2,0-4-1.8-4-4v-12.6c-17.5-2.4-26-12.1-28.3-25.5c-0.4-2.3,1.4-4.3,3.7-4.3 h9.1c1.9,0,3.5,1.4,3.9,3.2c1.7,7.9,6.3,14,20.3,14c10.3,0,17.7-5.8,17.7-14.4c0-8.6-4.3-11.9-19.5-14.4c-22.4-3-33-9.8-33-27.3 c0-13.5,10.3-24.1,26.1-26.3V69.3c0-2.2,1.8-4,4-4h8c2.2,0,4,1.8,4,4v12.7c12.9,2.3,21.1,9.6,23.8,21.8c0.5,2.3-1.3,4.4-3.7,4.4 h-8.4c-1.8,0-3.3-1.2-3.8-2.9c-2.3-7.7-7.8-11.1-17.4-11.1c-10.6,0-16.1,5.1-16.1,12.3c0,7.6,3.1,11.4,19.4,13.7 c22,3,33.4,9.3,33.4,28c0,14.2-10.6,25.7-27.1,28.3V189.3z%22/%3E%3Cpath class=%22st1%22 d=%22M157.2,220.8c-2.9,0.9-5.2-0.8-5.2-3.8v-7.5c0-2.2,1.3-4.3,3.4-5c30.6-11.2,52.6-40.7,52.6-75.1 c0-34.5-21.9-63.9-52.6-75.1c-1.9-0.7-3.4-3-3.4-5v-7.5c0-3,2.4-4.7,5.2-3.8C196,50.2,224,86.5,224,129.3 C224,172.2,196,208.4,157.2,220.8z%22/%3E%3C/svg%3E%0A" },
];

export default function SwapPanel() {
  const [account, setAccount] = useState<Account>();
  const [wallet, setWallet] = useState<NearWallet | undefined>();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [userTokens, setUserTokens] = useState<UserTokenInfo[]>();
  const [nearBalance, setNearBalance] = useState<string>("");

  const [fromToken, setFromToken] = useState<Token>(INITIAL_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(INITIAL_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [fromTokenBalance, setFromTokenBalance] = useState<number>(0);
  const [toTokenBalance, setToTokenBalance] = useState<number>(0);
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<number>(1);
  const [routeInfo, setRouteInfo] = useState<DexRouteResponse>();
  const [loadingRouteInfo, setLoadingRouteInfo] = useState<boolean>(false);
  const [swapInProgress, setSwapInProgress] = useState<boolean>(false);

  useEffect(() => {
    // Get the price of native NEAR here using wNEAR
    fetch("https://prices.intear.tech/price?token_id=wrap.near")
    .then((priceResponse) => {
      if (!priceResponse.ok) {
        console.error("Failed to fetch price of NEAR");
        return Promise.reject("Failed to fetch price of NEAR");
      }
      return priceResponse.json();
    })
    .then((nearPriceUsd: number) => {
      // By this point, fromToken is already a NEAR Token
      fromToken.price_usd = nearPriceUsd;
    })
    .catch((error) => {
      console.error("Error fetching NEAR price:", error);
    });
      
    nearConnector.wallet().then((wallet) => {
      wallet.getAccounts().then(async (t: Account[]) => {
        viewAccount(t[0].accountId).then((response: ViewAccountResponse) => {
          setNearBalance(response.result.amount);
        }).catch(error => {
          console.error("Error fetching user's NEAR balance:", error);
        });
        setAccount(t[0]);
        setWallet(wallet);
        setIsConnected(true);
        getUserTokens(t[0].accountId).then((tokensOwned: UserTokenInfo[]) => {
          setUserTokens(tokensOwned);
          updateUserTokenBalancesDisplay(fromToken, toToken);
        }).catch(error => {
          console.error("Error fetching user tokens:", error);
        });
      });
    });
  }, []);

  useEffect(() => {
    if (fromToken && toToken) {
      getDexRoute(fromToken, toToken); // Is this inefficient? Should avoid spamming on every amount change?
    }
  }, [fromToken, toToken, fromAmount, toAmount]);

  const handleSignOut = () => {
    console.log("User signed out!");
    setIsConnected(false);
    setAccount(undefined);
    setWallet(undefined);
    setUserTokens(undefined);
    setNearBalance("");
    setFromTokenBalance(0);
    setToTokenBalance(0);
  };

  const handleSignIn = (_network: "testnet" | "mainnet", account: Account, success: boolean) => {
    console.log("Signed in as " + account.accountId);
    setIsConnected(true);
    setAccount(account);
    nearConnector.wallet().then(userWallet => {
      setWallet(userWallet);
      viewAccount(account.accountId).then((response: ViewAccountResponse) => {
        setNearBalance(response.result.amount);
        getUserTokens(account.accountId).then((tokensOwned: UserTokenInfo[]) => {
          setUserTokens(tokensOwned);
          updateUserTokenBalancesDisplay(fromToken, toToken);
        }).catch (error => {
          console.error("Error fetching user tokens:", error);
        });
      }).catch(error => {
        console.error("Error fetching user's NEAR balance:", error);
      });
    });
  };

  const handleConnectWallet = async () => {
    await nearConnector.connect();
  };

  const updateUserTokenBalancesDisplay = (newFromToken: Token, newToToken: Token) => {
    if(!userTokens) return;
    if (newFromToken) {
      if (newFromToken.id === "near") {
        const displayAmount = convertToDisplayUnit(nearBalance, newFromToken);
        const balance = Number(displayAmount).toFixed(6);
        setFromTokenBalance(Number(balance));
      }
      else {
        const tokenOwned = userTokens.find((t: UserTokenInfo) => {
          return t.token.account_id === newFromToken.id;
        });
        if (tokenOwned) {
          const amountForDisplay = convertToDisplayUnit(tokenOwned.balance.toString(), newFromToken);
          setFromTokenBalance(Number(amountForDisplay));
        }
        else {
          setFromTokenBalance(0);
        }
      }
    }
    if (newToToken) {
      if (newToToken.id === "near") {
        const displayAmount = convertToDisplayUnit(nearBalance, newToToken);
        const balance = Number(displayAmount).toFixed(6);
        setToTokenBalance(Number(balance));
      }
      else {
        const tokenOwned = userTokens.find((t: UserTokenInfo) => {
          return t.token.account_id === newToToken.id;
        });
        if (tokenOwned) {
          const amountForDisplay = convertToDisplayUnit(tokenOwned.balance.toString(), newToToken);
          setToTokenBalance(Number(amountForDisplay));
        }
        else {
          setToTokenBalance(0);
        }
      }
    }
  };

  const handleFromTokenSelect = (token: Token) => {
    setFromToken(token);
    setShowFromDropdown(false);
    setFromAmount("");
    setToAmount("");
    updateUserTokenBalancesDisplay(token, toToken);
  };

  const handleToTokenSelect = (token: Token) => {
    setToToken(token);
    setShowToDropdown(false);
    setFromAmount("");
    setToAmount("");
    updateUserTokenBalancesDisplay(fromToken, token);
  };

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value);
      if (value && !isNaN(Number(value)) || Number(value) <= 0) {
        const rate = calculateExchangeRate(fromToken, toToken);
        const calculatedAmount = Number(value) * rate;
        setToAmount(Number(calculatedAmount).toFixed(6));
      }
    }
  };

  const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setToAmount(value);
      if (value && !isNaN(Number(value)) || Number(value) <= 0) {
        const rate = calculateExchangeRate(toToken, fromToken);
        const calculatedAmount = Number(value) * rate;
        setFromAmount(Number(calculatedAmount).toFixed(6));
      }
    }
  };

  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !isNaN(Number(value))) {
      setSlippage(Number(value));
    }
  };

  // For use with button that swaps the two tokens' places
  const switchTokens = () => {
    updateUserTokenBalancesDisplay(toToken, fromToken);

    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSwap = async () => {
    try {
      if (!isConnected || !account) {
        console.error("Error during swap: user is not connected");
        return;
      }
      if (!wallet) {
        console.error("Error during swap: user wallet not found");
        return;
      }
      if (!routeInfo) {
        console.error("Error during swap: DEX route info not found");
        return;
      }
      
      setSwapInProgress(true);

      let wNearBalanceBeforeSwap = BigInt(0);
      if (routeInfo.needs_unwrap) {
        // Get user's wNEAR balance
        const balanceResponse = await getBalance(account.accountId, "wrap.near");
        const balanceString = byteArrayToUtf8String(balanceResponse.result.result);
        const wNearBalance = BigInt(balanceString);
        console.log("wNEAR balance before swap:", wNearBalance);
        wNearBalanceBeforeSwap = wNearBalance;
      }

      const transactions: ExecutionInstruction[] = routeInfo.execution_instructions;
      const transactionsToSignAndSend: Array<Optional<Transaction, "signerId">> = [];
      transactions.forEach((transaction: ExecutionInstruction) => {
        if (transaction.IntentsQuote && !transaction.NearTransaction) {
          // TODO: near intents support
        }
        else if (transaction.NearTransaction && !transaction.IntentsQuote) {
          // Construct the function call transaction from Intear's FunctionCall format
          const formattedTx: Transaction = createTransactionFromIntearTransaction(transaction.NearTransaction, account.accountId, transaction.NearTransaction.receiver_id);
          transactionsToSignAndSend.push(formattedTx);
        }
      });

      await wallet.signAndSendTransactions({
        transactions: transactionsToSignAndSend
      });

      // Execute near_withdraw on wrap.near if needs_unwrap is true
      if (routeInfo.needs_unwrap) {
        const balanceResponse = await getBalance(account.accountId, "wrap.near");
        const balanceString = byteArrayToUtf8String(balanceResponse.result.result);
        const wNearBalance = BigInt(balanceString);
        console.log("wNEAR balance after swap:", wNearBalance);
        const difference = wNearBalance - wNearBalanceBeforeSwap;
        console.log(`Prompting user to unwrap ${difference} wNEAR`);
        await wallet.signAndSendTransaction({
          signerId: account.accountId,
          receiverId: "wrap.near",
          actions: [{
            type: "FunctionCall",
            params: {
                methodName: "near_withdraw",
                args: {"amount": difference.toString()},
                gas: "10000000000000", // 10 TGas
                deposit: "0"
            }
          }]
        });

        // Update balances data
        viewAccount(account.accountId).then((response: ViewAccountResponse) => {
          setNearBalance(response.result.amount);
          updateUserTokenBalancesDisplay(fromToken, toToken);
        }).catch(error => {
          console.error("Error fetching user's updated NEAR balance:", error);
        });
      }
    } catch (error) {
      console.error("Error occurred during swap:", error);
    } finally {
      setSwapInProgress(false);
    }
  };

  const getDexRoute = async (newFromToken: Token, newToToken: Token) => {
    setLoadingRouteInfo(true);
    if (!fromAmount || !toAmount || !newFromToken.id || !newToToken.id) {
      console.error("Missing required parameters for routing");
      setLoadingRouteInfo(false);
      setRouteInfo(undefined);
      return;
    }
  
    try {
      const amountIn = convertToBaseUnit(fromAmount, newFromToken);
      const response = await fetch(
        `https://router.intear.tech/route?` + 
        `token_in=${newFromToken.id}&` +
        `token_out=${newToToken.id}&` +
        `amount_in=${amountIn}&` +
        `max_wait_ms=1500&` +
        `slippage_type=Fixed&` +
        `slippage=${slippage/100}` +
        ((account && account.accountId) ? `&trader_account_id=${account.accountId}` : "")
        // TODO: signing_public_key for NEAR Intents
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const routeData: DexRouteResponse[] = await response.json();
      if (!fromAmount || !toAmount || Number(fromAmount || "0") <= 0 || Number(toAmount || "0") <= 0) {
        setRouteInfo(undefined);
      }
      else {
        setRouteInfo(routeData[0]);
      }
    } catch (error) {
      console.error("Error fetching DEX route:", error);
      setRouteInfo(undefined);
    } finally {
      setLoadingRouteInfo(false);
    }
  };

  return (
    <div className="max-w-[512px] w-full min-h-[512px] bg-slate-900 rounded-lg p-6">
      <div className={"flex justify-between mb-6 items-center"}>
        <h2 className="text-xl font-bold text-white py-2">Swap</h2>
        <div className="text-right">
          <NearWalletSelector className="text-sm text-blue-400 hover:text-blue-300" signInCallback={handleSignIn} signOutCallback={handleSignOut}/>
          {account && <span className="block text-white text-sm mb-1">{account.accountId}</span>}
        </div>
      </div>

      {/* From Section */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>From</span>
          <span>Balance: {fromToken.id === "near" ? parseFloat(Number(convertToDisplayUnit(nearBalance, fromToken)).toFixed(6)) : fromTokenBalance} {fromToken.symbol}</span>
        </div>

        <div className="flex items-center mb-2">
          <div className="relative">
            <button
              onClick={() => setShowFromDropdown(!showFromDropdown)}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 mr-2 transition-colors border-slate-700 border-2 hover:border-slate-600"
            >
              {/* Token icon or solid-color bg + letter if not found */}
              {fromToken.icon && fromToken.icon.startsWith("data:image/") ?
                <Image
                  src={fromToken.icon}
                  alt={fromToken.name}
                  width={32}
                  height={32}
                  className="mx-3 rounded-full"
                />
              :
                <div className="bg-orange-500 rounded-full w-[32px] h-[32px] mx-3 py-1 flex align-center justify-center">{fromToken.symbol.charAt(0)}</div>
              }
              <span className="font-medium text-white">{fromToken.symbol}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* From Token Dropdown */}
            <TokenSelectorModal
              isOpen={showFromDropdown}
              onClose={() => setShowFromDropdown(false)}
              initialTokensList={INITIAL_TOKENS}
              onSelectToken={handleFromTokenSelect}
              userAccount={account?.accountId}
            />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={fromAmount}
              onChange={handleFromAmountChange}
              placeholder="0.0"
              className="w-full bg-slate-900 rounded-lg py-1 pr-2 text-2xl text-white placeholder-slate-500 border-2 border-slate-700 text-right outline-none py-2"
            />
          </div>
        </div>

        <div className="text-sm text-slate-400 flex justify-end">
          <span>${(Number(fromAmount || 0) * fromToken.price_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Switch Button */}
      <div className="flex justify-center -my-3 z-10 relative">
        <button
          onClick={switchTokens}
          className="bg-slate-800 border-4 border-slate-900 rounded-full p-2 hover:bg-slate-700 transition-colors"
        >
        <svg className="fill-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960"><path d="M320-440v-287L217-624l-57-56 200-200 200 200-57 56-103-103v287zM600-80 400-280l57-56 103 103v-287h80v287l103-103 57 56z"/></svg>
        </button>
      </div>

      {/* To Section */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>To</span>
          <span>Balance: {toToken.id === "near" ? parseFloat(Number(convertToDisplayUnit(nearBalance, toToken)).toFixed(6)) : toTokenBalance} {toToken.symbol}</span>
        </div>

        <div className="flex items-center mb-2">
          <div className="relative">
            <button
              onClick={() => setShowToDropdown(!showToDropdown)}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 mr-2 transition-colors border-slate-700 border-2 hover:border-slate-600"
            >
              {/* Token icon or solid-color bg + letter if not found */}
              {toToken.icon && toToken.icon.startsWith("data:image/") ?
                <Image
                  src={toToken.icon}
                  alt={toToken.name}
                  width={32}
                  height={32}
                  className="mx-3 rounded-full"
                />
              :
                <div className="bg-orange-500 rounded-full w-[32px] h-[32px] mx-3 py-1 flex align-center justify-center">{toToken.symbol.charAt(0)}</div>
              }
              <span className="font-medium text-white">{toToken.symbol}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* To Token Dropdown */}
            <TokenSelectorModal
              isOpen={showToDropdown}
              onClose={() => setShowToDropdown(false)}
              initialTokensList={INITIAL_TOKENS}
              onSelectToken={handleToTokenSelect}
              userAccount={account?.accountId}
            />
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={toAmount}
              onChange={handleToAmountChange}
              placeholder="0.0"
              className="w-full bg-slate-900 rounded-lg py-1 pr-2 text-2xl text-white placeholder-slate-500 border-2 border-slate-700 text-right outline-none py-2"
            />
          </div>
        </div>
        
        <div className="text-sm text-slate-400 flex justify-end">
          <span>${(Number(toAmount || 0) * toToken.price_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Swap Info Section */}
      <div className="bg-slate-800 rounded-lg p-4 my-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white text-lg font-medium">{loadingRouteInfo ? <><LoadingSpinner /> {"Fetching best route..."}</> : "Route Info"}</h2>
          <button
            onClick={() => getDexRoute(fromToken, toToken)}
            className="bg-blue-900 rounded-lg p-2 border-2 border-blue-800 hover:border-blue-600 hover:bg-blue-600 transition-colors text-white text-sm"
          >
            Refresh
          </button>
        </div>
        
        {loadingRouteInfo ? <p className="text-slate-300 text-sm">Loading...</p> : 
          routeInfo ? (
            <>
              <div className="text-slate-300 text-sm mb-2">
                <span className="text-slate-400">DEX:</span> {routeInfo.dex_id || "N/A"}
              </div>
              <div className="text-slate-300 text-sm mb-2">
                <span className="text-slate-400">Minimum Received:</span> {convertToDisplayUnit(routeInfo.worst_case_amount.amount_out || "0", toToken)} {toToken.symbol}
              </div>
            </>
          ) : (
            <div className="text-slate-400 text-sm py-2">No routes found</div>
          )
        }
        
        <div className="mt-3">
          <div className="text-slate-300 text-sm mb-1">Slippage</div>
          <div className="flex items-center">
            <input 
              type="number" 
              min="0" 
              max="100" 
              step="0.1" 
              value={slippage} 
              onChange={handleSlippageChange}
              className="bg-slate-700 text-white rounded px-2 py-1 w-20 border border-slate-600"
            />
            <span className="text-slate-300 ml-2">%</span>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <button
        onClick={() => {
          if (isConnected) {
            handleSwap();
          }
          else {
            handleConnectWallet();
          }
        }}
        disabled={(swapInProgress || loadingRouteInfo || (isConnected && !routeInfo)) || (isConnected && !fromAmount) || (isConnected && Number(fromAmount) > fromTokenBalance)}
        className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors ${
          isConnected
            ? (!(swapInProgress || loadingRouteInfo) && routeInfo && fromAmount && (Number(fromAmount) <= fromTokenBalance) ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-900 text-slate-500")
            : loadingRouteInfo ? "bg-blue-900 text-slate-500" : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        {(swapInProgress || loadingRouteInfo) &&
          <LoadingSpinner />
        }
        {isConnected 
          ? (fromAmount ?
              ((swapInProgress || loadingRouteInfo) ? "Processing..." : (Number(fromAmount) > fromTokenBalance ? "Not enough balance" : "Swap"))
            : "Enter an amount") 
          : (loadingRouteInfo ? "Processing..." : "Connect Wallet")}
      </button>
    </div>
  );
}