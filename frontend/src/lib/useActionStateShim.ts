// Compatibility shim for useActionState (React Canary API)
// Maps to useFormState from react-dom, which is supported by Next.js 14

import { useFormState } from "react-dom";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
export function useActionState(action: any, initialState: any): any {
  return useFormState(action, initialState);
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
