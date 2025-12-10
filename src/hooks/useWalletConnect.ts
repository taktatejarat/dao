import { useState, useCallback, useEffect } from "react";
import { useConnect, useDisconnect, useAccount, type Connector } from "wagmi";

export function useWalletConnect() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { connectors, connect, error, isPending, status, variables } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { isConnected } = useAccount();

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  useEffect(() => {
      if (status === "success") setIsModalOpen(false);
  }, [status]);

  const handleConnect = useCallback(
      ({ connector }: { connector: Connector }) => {
          connect({ connector });
      },
      [connect]
  );

  const handleDisconnect = useCallback(async () => {
      await disconnectAsync();
  }, [disconnectAsync]);

  // ----------- FIX: Type-safe check for connector.id --------------
  const pendingConnectorId =
    isPending &&
    variables?.connector &&
    "id" in variables.connector
      ? (variables.connector.id as string)
      : null;
  //-----------------------------------------------------------------

  return {
      isModalOpen,
      openModal,
      closeModal,
      connectors,
      connect: handleConnect,
      disconnect: handleDisconnect,
      isPending,
      pendingConnectorId,
      isConnected,
      connectError: error
  };
}
