import SwapPanel from "@/components/swap-panel";
import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[1fr_20px] items-center justify-items-center min-h-screen p-8 pb-16 gap-16 sm:p-16">
      <main className="w-full flex flex-col gap-[32px] items-center">
        <h1 className="w-full text-3xl text-center">NEAR Dex Swap</h1>
        <SwapPanel />
      </main>
      <footer className="flex gap-[12px] flex-wrap items-center justify-center">
        <div>Made by (todo)</div>
        |
        <div>
          Powered by
          </div>
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
