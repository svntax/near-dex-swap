import { useState } from "react";
import { XIcon } from "./x-icon";

interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Token[];
  onSelectToken: (token: Token) => void;
}

export const TokenSelectorModal = ({ 
  isOpen, 
  onClose, 
  tokens, 
  onSelectToken 
}: TokenSelectorModalProps) => {
  const [search, setSearch] = useState("");

  const filteredTokens = tokens.filter(token => 
    token.symbol.toLowerCase().includes(search.toLowerCase()) ||
    token.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-opacity-25 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border-2 border-slate-700 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Select a token</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
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
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-3" />
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