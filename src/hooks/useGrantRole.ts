"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { accControlAbi } from '@/lib/blockchain/generated';
import type { Address } from 'viem';
import { BaseError } from 'viem';
import { useWeb3 } from '@/context/Web3Provider'; // Import useWeb3

/**
 * A custom hook to handle the logic of granting the DAO_MEMBER_ROLE to a user.
 * It now handles the success navigation internally.
 */
export function useGrantRole({ accControlAddress, targetAddress }: { accControlAddress?: Address; targetAddress?: Address }) {
    const { t } = useTranslation();
    const router = useRouter();
    const { setUserRole } = useWeb3();

    const { data: daoMemberRoleHash } = useReadContract({
        address: accControlAddress,
        abi: accControlAbi,
        functionName: 'DAO_MEMBER_ROLE',
        query: { enabled: !!accControlAddress },
    });

    const { data: hash, isPending, writeContract, reset } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // This effect runs ONLY when the transaction is successfully confirmed
    useEffect(() => {
        if (isSuccess) {
            toast.success(t('role_selection.startup_role_granted_title'), {
                description: t('role_selection.startup_role_granted_desc'),
            });
            
            // Set role and navigate after success
            const role = 'startup';
            setUserRole(role);
            if (typeof window !== 'undefined') {
                localStorage.setItem('userRole', role);
            }
            router.push('/dashboard');
            reset(); // Reset wagmi state
        }
    }, [isSuccess, router, setUserRole, t, reset]);

    const grantRole = () => {
        if (!daoMemberRoleHash || !targetAddress) {
            toast.error(t('role_selection.role_grant_error_title'), {
                description: t('role_selection.missing_info_error_desc')
            });
            return;
        }

        writeContract({
            address: accControlAddress!,
            abi: accControlAbi,
            functionName: 'grantRole',
            args: [daoMemberRoleHash, targetAddress],
        }, {
            onSuccess: () => {
                toast.info(t('role_selection.pending_toast_title'));
            },
            onError: (err) => {
                toast.error(t('role_selection.role_grant_error_title'), {
                    description: (err as BaseError).shortMessage || t('role_selection.unexpected_error_desc'),
                });
            },
        });
    };

    return {
        grantRole, // The only function to be called from the component
        isGrantingRole: isPending || isConfirming,
    };
}