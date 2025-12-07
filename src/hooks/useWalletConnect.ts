// src/hooks/useWalletConnect.ts

import { useState, useCallback } from 'react';
import { useConnect, useDisconnect, useAccount, type Connector } from 'wagmi';

export function useWalletConnect() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // دریافت توابع اتصال از Wagmi
    const { connectors, connect, error: connectError, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const { isConnected } = useAccount();

    const openModal = useCallback(() => setIsModalOpen(true), []);
    const closeModal = useCallback(() => setIsModalOpen(false), []);

    // این تابع دقیقا با امضای مورد نیاز مودال هماهنگ می‌شود
    const handleConnect = useCallback(({ connector }: { connector: Connector }) => {
        connect({ connector });
    }, [connect]);

    const handleDisconnect = useCallback(() => {
        disconnect();
    }, [disconnect]);

    return {
        isModalOpen,
        openModal,
        closeModal,
        connectors,
        connect: handleConnect, 
        disconnect: handleDisconnect,
        isPending,
        isConnected,
        connectError
    };
}