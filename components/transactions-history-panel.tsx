"use client";

import { useState, useEffect } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { NearWallet } from "@hot-labs/near-connect";
import { NearWalletSelector } from "./wallet-selector";
import { Account } from "@hot-labs/near-connect/build/types/wallet";
import { nearConnector } from "@/lib/wallets/selectors";
import { getTransactionsHistory } from "@/lib/wallets/wallet-methods";
import { nanosecondsToDateString } from "@/lib/utils";
import { RefreshIcon } from "./refresh-icon";

interface TransactionsHistoryPanelProps {
  account: Account | undefined;
  setAccount: (newAccount: Account | undefined) => void;
  wallet: NearWallet | undefined;
  setWallet: (newWallet: NearWallet | undefined) => void;
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
}

export default function TransactionsHistoryPanel({
  account, setAccount,
  wallet, setWallet,
  isConnected, setIsConnected
}: TransactionsHistoryPanelProps) {
  const [txHistory, setTxHistory] = useState<UserTx[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);

  useEffect(() => {
    setLoadingTransactions(true);
    nearConnector.wallet().then((wallet) => {
      wallet.getAccounts().then(async (t: Account[]) => {
        setAccount(t[0]);
        setWallet(wallet);
        setIsConnected(true);
        getTransactionsHistory(t[0].accountId).then((response: UserTx[]) => {
          setTxHistory(response);
        }).catch(error => {
          console.error("Error fetching user's transaction history:", error);
        }).finally(() => {
          setLoadingTransactions(false);
        });
      });
    }).finally(() => setLoadingTransactions(false));
  }, []);

  useEffect(() => {
    if (!account) {
      return;
    }
    setLoadingTransactions(true);
    getTransactionsHistory(account.accountId).then((response: UserTx[]) => {
      setTxHistory(response);
    }).catch(error => {
      console.error("Error fetching user's transaction history:", error);
    }).finally(() => {
      setLoadingTransactions(false);
    });
  }, [account]);

  const fetchTransactions = () => {
    if (!account || loadingTransactions) return;
    setLoadingTransactions(true);
    getTransactionsHistory(account.accountId).then((response: UserTx[]) => {
      setTxHistory(response);
    }).catch(error => {
      console.error("Error fetching user's transaction history:", error);
    }).finally(() => {
      setLoadingTransactions(false);
    });
  };

  return (
    <div className="w-full min-h-[726px] bg-slate-900 rounded-lg py-6 px-4 sm:px-6">
      <div className={"flex justify-between mb-6 items-center"}>
        <div>
          <h2 className="text-xl font-bold text-white p-0 sm:py-2">Transaction History</h2>
          <span className="text-sm">{account ? account.accountId : "Not signed in"}</span>
        </div>
        <button
          disabled={loadingTransactions || !account}
          className={`bg-blue-900 rounded-lg p-2 transition-colors text-white text-sm ${loadingTransactions || !account ? "bg-blue-950" : "cursor-pointer hover:bg-blue-600"}`}
          onClick={fetchTransactions}
        >
          <div className="h-6 w-6">
            {loadingTransactions ? <LoadingSpinner extraClasses="justify-self-center align-self-center ml-[1px] mt-[1px]" /> : <RefreshIcon className={loadingTransactions || !account ? "fill-slate-600" : "fill-white"} />}
          </div>
        </button>
      </div>

      {/* List of transactions */}
      <div className="overflow-y-auto flex-grow rounded-lg">
        {loadingTransactions ? (
          <div className="text-center py-8 text-slate-400">
            <LoadingSpinner extraClasses="mr-2" />Loading...
          </div>
        )
        :
        (
          (txHistory.length > 0 ? (
            txHistory.map((tx, index) => (
              <a key={tx.transaction.transaction.hash} href={`https://nearblocks.io/txns/${tx.transaction.transaction.hash}`} target="_blank" rel="noreferrer noopener">
                <div className={`flex wrap-anywhere px-4 py-8 ${index % 2 === 0 ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-600 hover:bg-slate-500"}`}>
                  <div>
                    <div className="mb-3 text-md text-white">Transaction Hash:</div>
                    <div className="text-sm text-slate-300">{tx.transaction.transaction.hash}</div>
                  </div>
                  <div className="w-full grow-2 text-right flex flex-col justify-between">
                  <span className="text-sm">{nanosecondsToDateString(tx.block_timestamp_nanosec, "RECENT")}</span>
                  <span className="text-sm">{tx.transaction.transaction.receiver_id}</span>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              No transactions found
            </div>
          ))
        )
        }
      </div>
    </div>
  );
}