"use client";

import { useState } from "react";
import { TokenSelectorModal } from "./token-selector-modal";
import { LoadingSpinner } from "./loading-spinner";

// Mock data for token info
const MOCK_TOKENS: Token[] = [
  { id: "near", name: "NEAR Protocol", symbol: "NEAR", price_usd: 2.55, decimals: 18 },
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", price_usd: 120000, decimals: 18 },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", price_usd: 4500.50, decimals: 18 },
  { id: "usdc", name: "USDC", symbol: "USDC", price_usd: 1.0, decimals: 18 },
];

// Util function
const calculateExchangeRate = (tokenA: Token, tokenB: Token) => {
  if (tokenB.price_usd === 0) return 0;
  return tokenA.price_usd / tokenB.price_usd;
};

export default function SwapPanel() {
  const [fromToken, setFromToken] = useState<Token>(MOCK_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(MOCK_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);
  const [searchFrom, setSearchFrom] = useState<string>("");
  const [searchTo, setSearchTo] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [swapInProgress, setSwapInProgress] = useState<boolean>(false);

  const filteredFromTokens = MOCK_TOKENS.filter(token => 
    token.name.toLowerCase().includes(searchFrom.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchFrom.toLowerCase())
  );

  const filteredToTokens = MOCK_TOKENS.filter(token => 
    token.name.toLowerCase().includes(searchTo.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTo.toLowerCase())
  );

  const handleFromTokenSelect = (token: Token) => {
    setFromToken(token);
    setShowFromDropdown(false);
    setSearchFrom("");
    setFromAmount("");
    setToAmount("");
  };

  const handleToTokenSelect = (token: Token) => {
    setToToken(token);
    setShowToDropdown(false);
    setSearchTo("");
    setFromAmount("");
    setToAmount("");
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

  // For use with button that swaps the two tokens' places
  const switchTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSwap = () => {
    if (!isConnected) {
      setIsConnected(true);
      return;
    }
    
    setSwapInProgress(true);

    // Mock API request with timeout
    setTimeout(() => {
      alert(`Swapped ${fromAmount} ${fromToken.symbol} to ${toAmount} ${toToken.symbol}`);
      setSwapInProgress(false);
    }, 2000);
  };

  return (
    <div className="max-w-[512px] w-full min-h-[512px] bg-slate-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Swap</h2>
        <button 
          onClick={() => setIsConnected(!isConnected)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
        </button>
      </div>

      {/* From Section */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>From</span>
          <span>Balance: {0} {fromToken.symbol}</span>
        </div>

        <div className="flex items-center mb-2">
          <div className="relative">
            <button
              onClick={() => setShowFromDropdown(!showFromDropdown)}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 mr-2 transition-colors border-slate-700 border-2 hover:border-slate-600"
            >
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-6 h-6" />
              <span className="font-medium text-white">{fromToken.symbol}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* From Token Dropdown */}
            <TokenSelectorModal
              isOpen={showFromDropdown}
              onClose={() => setShowFromDropdown(false)}
              tokens={filteredFromTokens}
              onSelectToken={handleFromTokenSelect}
            />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={fromAmount}
              onChange={handleFromAmountChange}
              placeholder="0.0"
              className="w-full bg-slate-900 rounded-lg py-1 pr-2 text-2xl text-white placeholder-slate-500 border-2 border-slate-700 text-right outline-none"
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
          <span>Balance: {0} {toToken.symbol}</span>
        </div>

        <div className="flex items-center mb-2">
          <div className="relative">
            <button
              onClick={() => setShowToDropdown(!showToDropdown)}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 mr-2 transition-colors border-slate-700 border-2 hover:border-slate-600"
            >
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-6 h-6" />
              <span className="font-medium text-white">{toToken.symbol}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* To Token Dropdown */}
            <TokenSelectorModal
              isOpen={showToDropdown}
              onClose={() => setShowToDropdown(false)}
              tokens={filteredToTokens}
              onSelectToken={handleToTokenSelect}
            />
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={toAmount}
              onChange={handleToAmountChange}
              placeholder="0.0"
              className="w-full bg-slate-900 rounded-lg py-1 pr-2 text-2xl text-white placeholder-slate-500 border-2 border-slate-700 text-right outline-none"
            />
          </div>
        </div>
        
        <div className="text-sm text-slate-400 flex justify-end">
          <span>${(Number(toAmount || 0) * toToken.price_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Swap Button */}
      <button
        onClick={() => {
          if (isConnected) {
            handleSwap();
          }
          else {
            setIsConnected(true);
          }
        }}
        disabled={swapInProgress || (isConnected && !fromAmount)}
        className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors ${
          isConnected 
            ? (!swapInProgress && fromAmount ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-900 text-slate-500")
            : ("bg-blue-500 hover:bg-blue-600 text-white")
        }`}
      >
        {swapInProgress &&
          <LoadingSpinner />
        }
        {isConnected 
          ? (fromAmount ?
              (swapInProgress ? "Processing..." : "Swap")
            : "Enter an amount") 
          : "Connect Wallet"}
      </button>
    </div>
  );
}