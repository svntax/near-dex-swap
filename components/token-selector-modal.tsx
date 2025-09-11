import { useEffect, useState } from "react";
import { XIcon } from "./x-icon";
import Image from "next/image";

interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTokensList: Token[];
  onSelectToken: (token: Token) => void;
  userAccount: string | undefined;
}

export const TokenSelectorModal = ({ 
  isOpen,
  onClose,
  onSelectToken,
  userAccount,
  initialTokensList
}: TokenSelectorModalProps) => {
  const [search, setSearch] = useState<string>("");
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    // Fetch tokens from API
    const tokensEndpoint = `https://prices.intear.tech/token-search?q=${search}&n=50&rep=Unknown${userAccount ? "&acc=" + userAccount : ""}`;
    const fetchTokens = async () => {
      try {
        const response = await fetch(tokensEndpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: TokensApiResponse = await response.json();
        
        // Extract token data from the response to match Token interface
        let tokensList: Token[] = data.map((tokenInfo) => ({
          id: tokenInfo.account_id,
          name: tokenInfo.metadata.name,
          symbol: tokenInfo.metadata.symbol,
          price_usd: Number(tokenInfo.price_usd),
          price_usd_hardcoded: Number(tokenInfo.price_usd_hardcoded),
          decimals: tokenInfo.metadata.decimals,
          icon: tokenInfo.metadata.icon
        }));
        // Combine the initial list with the search results, and remove duplicates just in case
        tokensList = initialTokensList.concat(tokensList.filter(token =>
            !initialTokensList.some(initialToken => initialToken.id === token.id)
        ));

        // Now filter tokens by search
        if (!search.trim()) {
          tokensList = tokensList.slice(0, 50); // Results can be very long, so slice the first 50
        }
        else {
          const searchLower = search.toLowerCase().trim();
          const filteredList = tokensList.filter(token => 
            token.symbol.toLowerCase().includes(searchLower) ||
            token.name.toLowerCase().includes(searchLower)
          );
          tokensList = filteredList;
        }

        // Now get the price for native NEAR
        // Since wNEAR is 1:1, just use it for the price data
        const priceResponse = await fetch("https://prices.intear.tech/price?token_id=wrap.near");
        if (!priceResponse.ok) {
          console.error("Failed to fetch price of NEAR");
        }
        else {
          const nearPriceUsd: number = await priceResponse.json();
          const nearToken = initialTokensList.find((t: Token) => {return t.id === "near"});
          if (nearToken) {
            const initialNearToken = initialTokensList[initialTokensList.indexOf(nearToken)];
            initialNearToken.price_usd = nearPriceUsd;
            initialNearToken.price_usd_hardcoded = nearPriceUsd;
          }
        }
        
        setTokens(tokensList);
      } catch (error) {
        console.error("Failed to fetch tokens:", error);
        setTokens(initialTokensList);
      }
    };

    if (isOpen) {
      fetchTokens();
    }
  }, [isOpen, search]);
  
  if (!isOpen){
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-opacity-25 backdrop-blur-lg z-50 flex items-center justify-center p-4"
    >
      <div 
        className="bg-slate-800 border-2 border-slate-700 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Select a token</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {tokens.length > 0 ? (
            tokens.map(token => (
              <button
                key={token.id}
                onClick={() => {
                  onSelectToken(token);
                  onClose();
                }}
                className="flex items-center w-full p-3 hover:bg-slate-700 transition-colors text-left"
              >
                {token.icon && token.icon.startsWith("data:image/") ?
                  <Image
                    src={token.icon}
                    alt={token.name}
                    width={32}
                    height={32}
                    className="m-3 rounded-full"
                  />
                :
                  <div className="bg-orange-500 rounded-full w-[32px] h-[32px] m-3 py-1 flex align-center justify-center">{token.symbol.charAt(0)}</div>
                }
                
                <div className="wrap-anywhere">
                  <div className="font-medium text-white">{token.symbol}</div>
                  <div className="text-xs text-slate-300">{token.name}</div>
                  {token.id !== "near" && <div className="text-xs text-slate-400">{token.id}</div>}
                  
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              No tokens found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};