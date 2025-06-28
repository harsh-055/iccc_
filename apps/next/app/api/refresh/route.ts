import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore?.get("refreshToken");
        const accessToken = cookieStore?.get("accessToken");
        console.log("refreshToken", refreshToken);
        console.log("accessToken", accessToken);
        

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/localauth/refreshToken`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken?.value || ''}`,
            },
            body: JSON.stringify({ token: refreshToken?.value }),
        });

        // console.log("response", await response.json());

        if (!response.ok) {
            return new Response("Unauthorized", { status: 401 });
        }

        const data = await response.json();
        console.log("data", data);
        const newAccessToken = data.accessToken;

        cookieStore.set("accessToken", newAccessToken);

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error refreshing token:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}