"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useApi } from "@/lib/secure-fetcher/client";
import { logoutAction } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const [logoutState, logout] = useApi(logoutAction, {
        onSuccess: () => {
          console.log("Logout successful");
          router.push("/login");
        },
      });
      setInterval (() => {
        async function fetchRefreshToken() {
          const response = await fetch("/api/refresh", {
            method: "POST",
          });
          const data = await response.json();
          console.log("data", data);
        }
        fetchRefreshToken();
      }, 10000); 

    return (
        <div>
            <div className="flex justify-between items-center m-1">
                <Image src="/Lens_white_Logo.png" alt="Lenscorp" width={100} height={100} />
                <Button onClick={() => logout()}>Logout</Button>

            </div>
            {children}
        </div>
    );
}
