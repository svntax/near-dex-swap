"use client";

import { useState } from "react";
import SwapPanel from "@/components/swap-panel";
import TransactionsHistoryPanel from "@/components/transactions-history-panel";
import Image from "next/image";
import { Account } from "@hot-labs/near-connect/build/types/wallet";
import { NearWallet } from "@hot-labs/near-connect";
import { HistoryIcon } from "@/components/history-icon";
import { SwapIcon } from "@/components/swap-icon";

export default function Home() {
  const [account, setAccount] = useState<Account>();
  const [wallet, setWallet] = useState<NearWallet | undefined>();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  return (
    <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-16 gap-16 sm:p-16">
      <main className="w-full grid grid-rows-[auto_auto_1fr] w-full max-w-[600px]">
        <h1 className="text-3xl text-center pb-4">NEAR DEX Swap</h1>

        {/* Tabs navbar */}
        <div className="border-b border-slate-700 w-full">
          <div className="flex">
            <button
              className={`flex flex-col justify-end cursor-pointer flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 0
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
              onClick={() => setActiveTab(0)}
            >
              <div className="flex justify-center gap-2">
                <SwapIcon stroke={activeTab === 0 ? "#51a2ff" : "white"} />
                Swap
              </div>
            </button>
            <button
              className={`flex flex-col justify-end cursor-pointer flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 1
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
              onClick={() => setActiveTab(1)}
            >
              <div className="flex justify-center gap-2">
                <HistoryIcon fill={activeTab === 1 ? "#51a2ff" : "white"} />
                History
              </div>
            </button>
          </div>
        </div>

        {/* Panel display section */}
        <div className="w-full">
          <div className="w-full h-[calc(100%-60px)] py-4">
            {activeTab === 0 ?
            <SwapPanel
              account={account} setAccount={setAccount}
              wallet={wallet} setWallet={setWallet}
              isConnected={isConnected} setIsConnected={setIsConnected}
            /> :
            <TransactionsHistoryPanel
              account={account} setAccount={setAccount}
              wallet={wallet} setWallet={setWallet}
              isConnected={isConnected} setIsConnected={setIsConnected}
            />}
          </div>
        </div>
      </main>
      
      <footer className="flex gap-[12px] flex-wrap items-center justify-center">
        <div>Made by svntax</div>
        |
        <div>Powered by</div>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://intea.rs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/intear-logo-blue.svg"
            alt="Intear logo"
            width={24}
            height={24}
          />
          Intear
        </a>
      </footer>
    </div>
  );
}