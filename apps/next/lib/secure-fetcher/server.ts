"use server"

import { cookies } from "next/headers"
import { z } from "zod"

// Type definations
export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface ApiOptions {
    method?: ApiMethod
    body?: any
    headers?: Record<string, string>
    cache?: RequestCache
    revalidate?: number | false
    tags?: string[]
    params?: Record<string, string | number | boolean | undefined>
    query?: Record<string, string | number | boolean | undefined>
}

export type ApiResponse<T> = {
    data: T | null,
    error: string | null,
    status: number
}

// URL Schema
const urlSchema = z.string().url("Invalid URL provided")

//Utlitlty to process URL parameters
function processUrl(url: string, params?: Record<string, string | number | boolean | undefined>): string {
    if (!params) return url

    let processedURL = url;
    Object.entries(params).forEach(([key, value]) => {
        processedURL = processedURL.replace(`:${key}`, String(value))
    })
    return processedURL
}

// Core server fetch function
async function serverFetch<T>(
    url: string,
    options: ApiOptions = {}
): Promise<ApiResponse<T>> {

    try {
        // Process URL parameters first
        let finalUrl = processUrl(url, options.params)

        //Add query parameters if provided
        if (options.query) {
            const queryParams = new URLSearchParams()
            Object.entries(options.query).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, String(value))
                }

            })
            const queryString = queryParams.toString();
            if (queryString) {
                finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
            }

        }

        //Validate URL to prevent SSRF
        const validateUrl = urlSchema.safeParse(finalUrl)
        if (!validateUrl.success) {
            return {
                data: null,
                error: `Invalid URL :${validateUrl.error.message}`,
                status: 400
            }
        }

        const cookieStore = await cookies();
        const accessToken = cookieStore.get("accessToken");

        // Prepare request options
        const requestOptions: RequestInit = {
            method: options.method || 'GET',
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                ...(accessToken ? { 'Authorization': `Bearer ${accessToken.value}` } : {})
            },
            next: {
                revalidate: options.revalidate || 0,
                tags: options.tags || []
            },
            cache: options.cache || 'no-store'

        }

        // Add body for non GET requests
        if (options.method !== 'GET' && options.body) {
            requestOptions.body = JSON.stringify(options.body)
        }

        //Make the fetch request
        const response = await fetch(finalUrl, requestOptions)

        //Handle response
        if (!response.ok) {
            let errorText;
            try {
                // Try to parse as JSON first
                const errorJson = await response.json();
                errorText = JSON.stringify(errorJson);
            } catch {
                // Fall back to text if not JSON
                errorText = await response.text();
            }
            return {
                data: null,
                error: `API error (${response.status}): ${errorText}`,
                status: response.status
            }
        }

        //Parse response body
        const data = await response.json() as T;

        return {
            data,
            error: null,
            status: response.status
        }



    } catch (error) {
        console.error('Server fetch error:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown Server Error',
            status: 500
        }
    }

}


//Create the API client factory
export async function createApiClient(baseUrl: string, defaultOptions: ApiOptions = {}) {
    //Validate base URL
    if (!urlSchema.safeParse(baseUrl).success && !baseUrl.startsWith('/')) {
        throw new Error(`Invalid base URL : ${baseUrl}`)
    }

    return {
        //Generic request Method
        request: async<T>(path: string, options: ApiOptions = {}): Promise<ApiResponse<T>> => {
            const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
            return serverFetch<T>(url, {
                ...defaultOptions,
                ...options
            })
        },

        //Common API Methods
        get: async<T>(path: string, queryOrParams?: Record<string, any> | null, options: Omit<ApiOptions, 'method' | 'body' | 'query' | 'params'> = {}): Promise<ApiResponse<T>> => {
            // Determine if this is a query or path params based on path
            const hasPathParams = path.includes(':')

            const apiOptions: ApiOptions = {
                ...defaultOptions,
                ...options,
                method: 'GET'
            }

            if (hasPathParams) {
                apiOptions.params = queryOrParams as Record<string, string | number | boolean | undefined>
            } else {
                apiOptions.query = queryOrParams as Record<string, string | number | boolean | undefined>
            }

            const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
            return serverFetch<T>(url, apiOptions)



        },


        post: async <T>(
            path: string,
            body: any,
            options: Omit<ApiOptions, 'method' | 'body'> = {}
        ): Promise<ApiResponse<T>> => {
            const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
            return serverFetch<T>(url, {
                ...defaultOptions,
                ...options,
                method: 'POST',
                body
            });
        },

        put: async <T>(
            path: string,
            body: any,
            options: Omit<ApiOptions, 'method' | 'body'> = {}
        ): Promise<ApiResponse<T>> => {
            const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
            return serverFetch<T>(url, {
                ...defaultOptions,
                ...options,
                method: 'PUT',
                body
            });
        },

        patch: async <T>(
            path: string,
            body: any,
            options: Omit<ApiOptions, 'method' | 'body'> = {}
        ): Promise<ApiResponse<T>> => {
            const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
            return serverFetch<T>(url, {
                ...defaultOptions,
                ...options,
                method: 'PATCH',
                body
            });
        },

        delete: async <T>(
            path: string,
            options: Omit<ApiOptions, 'method'> = {}
        ): Promise<ApiResponse<T>> => {
            const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
            return serverFetch<T>(url, {
                ...defaultOptions,
                ...options,
                method: 'DELETE'
            });
        }







    }

}

// Export server actions factory - to be used with useApi hook

export async function createServerActions<TParams, TResponse>(
    apiFunction: (params: TParams) => Promise<ApiResponse<TResponse>>
) {
    return apiFunction;
}


