"use client"

import {useState, useCallback, useEffect, useTransition} from "react"
import { ApiResponse } from "./server"


interface UseApiOptions<T> {
    initialData?: T | null;
    onSuccess? : (data : T) => void;
    onError? : (error: string) => void;
    executeOnMount? :boolean;
    executeOnMountParams? :any;
    executeOnDeps? : any[];
}

interface FetchState<T> {
    data: T | null;
    error: string | null;
    isLoading: boolean;
}


type ServerAction<TParams, TResponse> = 
  | ((params: TParams) => Promise<ApiResponse<TResponse>>)
  | Promise<(params: TParams) => Promise<ApiResponse<TResponse>>>

export function useApi<TParams, TResponse>(
    serverAction: ServerAction<TParams, TResponse>,
    options: UseApiOptions<TResponse> = {}
  ): [
    FetchState<TResponse>,
    (params: TParams) => Promise<void>,
    () => void
  ] {
    const {
      initialData = null,
      onSuccess,
      onError,
      executeOnMount = false,
      executeOnMountParams,
      executeOnDeps = []
    } = options;
    
    const [state, setState] = useState<FetchState<TResponse>>({
      data: initialData,
      error: null,
      isLoading: false
    });
    
    const [isPending, startTransition] = useTransition();
    
    const execute = useCallback(async (params: TParams) => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      startTransition(async () => {
        try {
          const action = serverAction instanceof Promise 
            ? await serverAction 
            : serverAction;
          
          const response = await action(params);
          
          if (response.error) {
            setState({
              data: null,
              error: response.error,
              isLoading: false
            });
            onError?.(response.error);
          } else {
            setState({
              data: response.data,
              error: null,
              isLoading: false
            });
            if (response.data) {
              onSuccess?.(response.data || {} as TResponse);
            }
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setState({
            data: null,
            error: errorMsg,
            isLoading: false
          });
          onError?.(errorMsg);
        }
      });
    }, [serverAction, onSuccess, onError]);
    
    const reset = useCallback(() => {
      setState({
        data: initialData,
        error: null,
        isLoading: false
      });
    }, [initialData]);
    
    // Execute on mount if specified
    useEffect(() => {
      if (executeOnMount) {
        execute(executeOnMountParams as TParams || {} as TParams);
      }
    }, [execute, executeOnMount, executeOnMountParams]);
    
    // Execute when dependencies change
    useEffect(() => {
      if (executeOnDeps.length > 0 && executeOnMount) {
        execute(executeOnMountParams as TParams || {} as TParams);
      }
    }, [execute, serverAction, executeOnMount, executeOnMountParams, ...executeOnDeps]);
    
    // Update loading state from transition
    useEffect(() => {
      setState(prev => ({
        ...prev,
        isLoading: isPending || prev.isLoading
      }));
    }, [isPending]);
    
    return [
      { ...state, isLoading: state.isLoading || isPending },
      execute,
      reset
    ];
  }

