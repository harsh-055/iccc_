"use server"

import { ApiError } from "next/dist/server/api-utils";
import { ApiResponse, createApiClient , createServerActions } from "../secure-fetcher/server"
import { cookies } from "next/headers";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

const apiClient = await createApiClient(API_BASE_URL, {
    headers: {
        "Content-Type": "application/json",
    }, 

    revalidate : 60,
})


interface LoginParams {
    email: string;
    password: string;
}

interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email:string;
    }
}


// Secure Login Action
export const loginAction = await createServerActions<LoginParams, LoginResponse>(
    async (params: LoginParams): Promise<ApiResponse<LoginResponse>> => {
      'use server'
      const response = await apiClient.post<LoginResponse>("/localauth/login", params);
  
      if (response.error) {
        return { data: null, error: response.error, status: response.status };
      }
  
      // Set tokens in HttpOnly, Secure cookies
      if (response.data?.accessToken) {
        const cookieStore = await cookies();
        cookieStore.set("accessToken", response.data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 15, // 15 minutes expiry
        });
      }
  
      if (response.data?.refreshToken) {
        const cookieStore = await cookies();
        cookieStore.set("refreshToken", response.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 7 days expiry
        });
      }
  
      return {
        data: { success: true } as unknown as LoginResponse, // or RegisterResponse
        error: null,
        status: response.status,
      };
    } 
  );

  // register action
  interface RegisterParams {
    name: string;
    email: string;
    password: string;
  }

  interface RegisterResponse {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string | undefined;
      name: string | undefined;
      email: string | undefined;
    };
  }

  export const registerAction = await createServerActions<RegisterParams, RegisterResponse>(
    async (params: RegisterParams): Promise<ApiResponse<RegisterResponse>> => {
      'use server'
      const response = await apiClient.post<RegisterResponse>("/localauth/signup", params);
  
      if (response.error) {
        console.log("Registration failed:", response.error);
        return { data: null, error: response.error, status: response.status };
      }

      console.log("Registration successful:", response);
  
      // Set tokens in HttpOnly, Secure cookies
      if (response.data?.accessToken) {
        const cookieStore = await cookies();
        cookieStore.set("accessToken", response.data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 15, // 15 minutes expiry
        });
      }
  
      if (response.data?.refreshToken) {
        const cookieStore = await cookies();
        cookieStore.set("refreshToken", response.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 7 days expiry
        });
      }
  
      return {
        data: { success: true } as unknown as RegisterResponse, // or RegisterResponse
        error: null,
        status: response.status,
      };
    }
  );

  interface LogoutResponse {
    success: boolean;
  }


  // logout action
export const logoutAction = await createServerActions<void, LogoutResponse>(
    async (): Promise<ApiResponse<LogoutResponse>> => {
      'use server'
      const cookieStore = await cookies();
      const response = await apiClient.get<void>("/localauth/logout");
      console.log("logout response", response);
      console.log("cookieStore", cookieStore);
      console.log("accessToken", cookieStore.get("accessToken"));
      console.log("refreshToken", cookieStore.get("refreshToken"));
      
     

      if (response.error) {
        return { data: null, error: response.error, status: response.status };
      }

      cookieStore.delete("accessToken");
      cookieStore.delete("refreshToken");
      
      return {  data: { success: true }, error: null, status: 200 };
    }
  );
