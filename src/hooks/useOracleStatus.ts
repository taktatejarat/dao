// src/hooks/useOracleStatus.ts

import { useState, useEffect, useCallback } from 'react';

export interface OracleStatus {
    status: 'online' | 'offline' | 'error' | 'loading';
    message: string;
    details: any;
}

const initialStatus: OracleStatus = {
    status: 'loading',
    message: 'Checking AI Oracle status...',
    details: null,
};

/**
 * Fetches the status of the AI Oracle FastAPI service from the Node.js API endpoint.
 */
export function useOracleStatus() {
    const [status, setStatus] = useState<OracleStatus>(initialStatus);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const fetchStatus = useCallback(async () => {
        setStatus(prev => ({ ...prev, status: 'loading' }));
        try {
            const response = await fetch('/api/oracle-status');
            const data = await response.json();
            
            setStatus({
                status: data.status === 'online' ? 'online' : (data.status === 'error' ? 'error' : 'offline'),
                message: data.message,
                details: data.details,
            });
            setLastChecked(new Date());

        } catch (error) {
            // This occurs if the Node.js API itself failed to execute (e.g., connection refused)
            setStatus({
                status: 'offline',
                message: 'Connection to Node.js /api/oracle-status failed.',
                details: error,
            });
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        const intervalId = setInterval(fetchStatus, 30000); // Check every 30 seconds
        return () => clearInterval(intervalId);
    }, [fetchStatus]);

    return { status, lastChecked, refetch: fetchStatus };
}