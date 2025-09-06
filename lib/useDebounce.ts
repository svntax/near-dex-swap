import { useState, useEffect } from "react";
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const useDebounce = (value: any, delay: number) => {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const [debounced, setDebounced] = useState<any>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced
};