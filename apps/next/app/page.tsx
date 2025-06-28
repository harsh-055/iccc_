
import { Meteors } from "@/components/magicui/meteors";
import { Button, buttonVariants } from "@/components/ui/button";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {

  return (
    <div className="relative flex h-[700px] w-full flex-col items-center justify-center overflow-hidden">
      <div className="flex justify-between items-center m-1">
              <Image src="/Lens_white_Logo.png" alt="Lenscorp" width={100} height={100} />
          <Link className={buttonVariants({ variant: "outline" })} href="/login">Login</Link>

      </div>
      <Meteors />
    <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-8xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
      Lenscorp
    </span>
    <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-7xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
      Enterprise Starter Kit
    </span>
  
    <div className="flex flex-col gap-8 mt-12 row-start-2 items-center sm:items-start">
      <div className="flex items-center gap-8">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <span className="text-2xl font-bold">+</span>
        <Image
          className="dark"
          src="/logo-small-gradient.svg"
          alt="Nest.js logo"
          width={180}
          height={38}
        />
      </div>
  
      <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
        <li className="mb-2">
          Get started by editing
          <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
            app/page.tsx
          </code>
          .
        </li>
      </ol>
    </div>
  </div>
  );
}
