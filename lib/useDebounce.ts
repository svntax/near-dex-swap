import { useState, useEffect } from "react";
export const useDebounce = (value: any, delay: number) => {
    const [debounced, setDebounced] = useState<any>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced
};