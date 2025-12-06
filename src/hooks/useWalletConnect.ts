// src/hooks/useWalletConnect.ts

import { useState, useCallback } from 'react';
import { useConnect, useDisconnect, useAccount } from 'wagmi';

export function useWalletConnect() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { connectors, connect, error: connectError, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const { isConnected } = useAccount();

    const openModal = useCallback(() => setIsModalOpen(true), []);
    const closeModal = useCallback(() => setIsModalOpen(false), []);

    const handleConnect = useCallback((connectorId: string) => {
        const connector = connectors.find((c) => c.id === connectorId);
        if (connector) {
            connect({ connector });
            // مودال بعد از اتصال موفقیت‌آمیز به صورت خودکار بسته می‌شود 
            // (توسط افکت داخل کامپوننت مودال مدیریت خواهد شد)
        }
    }, [connect, connectors]);

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