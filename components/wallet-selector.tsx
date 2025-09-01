import { useEffect, useState } from "react";
import { nearConnector } from "@/lib/wallets/selectors";
import { NearWallet } from "@hot-labs/near-connect";
import { Account } from "@hot-labs/near-connect/build/types/wallet";

interface NearWaletSelectorProps {
  className: string;
  signInCallback: (network: "testnet" | "mainnet", account: Account, success: boolean) => void;
  signOutCallback: () => void;
}

export const NearWalletSelector = ({
  className,
  signInCallback, signOutCallback
}: NearWaletSelectorProps) => {
  const [network, setNetwork] = useState<"testnet" | "mainnet">("mainnet");
  const [account, _setAccount] = useState<NearAccount>();
  const [wallet, setWallet] = useState<NearWallet | undefined>();

  function setAccount(account: Account | undefined) {
    if (account == null) return _setAccount(undefined);
    _setAccount({ id: account.accountId, network: account.accountId.endsWith("testnet") ? "testnet" : "mainnet" });
  }

  useEffect(() => {
    nearConnector.on("wallet:signIn", async (t: {wallet: NearWallet, accounts: Account[], success: boolean}) => {
      setWallet(await nearConnector.wallet());
      setAccount(t.accounts[0]);
      signInCallback(network, t.accounts[0], t.success);
    });

    nearConnector.on("wallet:signOut", async () => {
      setWallet(undefined);
      setAccount(undefined);
      signOutCallback();
    });

    nearConnector.wallet().then((wallet) => {
      wallet.getAccounts().then((t: Account[]) => {
        setAccount(t[0]);
        setWallet(wallet);
      });
    });
  }, [network, nearConnector]);

  const networkAccount = account != null && account.network === network ? account : undefined;
  const connect = async () => {
    if (networkAccount != null) return nearConnector.disconnect();
    await nearConnector.connect();
  };

  return (
    <div className={className}>
      <button className={"input-button"} onClick={() => connect()}>
        {networkAccount != null ? `Disconnect Wallet` : "Connect Wallet"}
      </button>
    </div>
  );
};