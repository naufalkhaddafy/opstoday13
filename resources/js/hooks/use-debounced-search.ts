import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export function useDebouncedSearch(initialValue: string, delay = 300) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            if (value) {
                params.set('search', value);
            } else {
                params.delete('search');
            }
            
            router.get(window.location.pathname, 
                Object.fromEntries(params.entries()), 
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return [value, setValue] as const;
}
