import { useEffect, useState, useMemo } from "react";
import { XIcon } from "./x-icon";
import Image from "next/image";

interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Token[];
  onSelectToken: (token: Token) => void;
  userAccount: string | undefined;
}

export const TokenSelectorModal = ({ 
  isOpen, 
  onClose,
  onSelectToken,
  userAccount
}: TokenSelectorModalProps) => {
  const [search, setSearch] = useState<string>("");
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    // Fetch tokens from API
    // TODO: Hard-code NEAR native token? Token search API doesn't seem to return it
    const tokensEndpoint = `https://prices.intear.tech/token-search?q=${search}&n=50&rep=Unknown${userAccount ? "&acc=" + userAccount : ""}`;
    const fetchTokens = async () => {
      try {
        const response = await fetch(tokensEndpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: TokensApiResponse = await response.json();
        
        // Extract token data from the response to match Token interface
        const tokensList: Token[] = data.map((tokenInfo) => ({
          id: tokenInfo.account_id,
          name: tokenInfo.metadata.name,
          symbol: tokenInfo.metadata.symbol,
          price_usd: Number(tokenInfo.price_usd),
          decimals: tokenInfo.metadata.decimals,
          icon: tokenInfo.metadata.icon
        }));
        
        setTokens(tokensList);
      } catch (error) {
        console.error("Failed to fetch tokens:", error);
        setTokens([]);
      }
    };

    if (isOpen) {
      fetchTokens();
    }
  }, [isOpen, search]);

  const filteredTokens = useMemo(() => {
    if (!search.trim()) {
      return tokens.slice(50); // Results can be very long, so slice the first 50
    }
    
    const searchLower = search.toLowerCase().trim();
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(searchLower) ||
      token.name.toLowerCase().includes(searchLower)
    );
  }, [tokens, search]);

  if (!isOpen) return null;

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
          {filteredTokens.length > 0 ? (
            filteredTokens.map(token => (
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
                    src={ token.icon}
                    alt={token.name}
                    width={32}
                    height={32}
                    className="m-3 rounded-full"
                  />
                :
                  <div className="bg-orange-500 rounded-full w-[32px] h-[32px] m-3 py-1 flex align-center justify-center">{token.symbol.charAt(0)}</div>
                }
                
                <div>
                  <div className="font-medium text-white">{token.symbol}</div>
                  <div className="text-xs text-slate-400">{token.name}</div>
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