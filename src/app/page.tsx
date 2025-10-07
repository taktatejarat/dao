
"use client";

import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';

export default function Page() {
    const { isConnected } = useAccount();
    const router = useRouter();

    useEffect(() => {
        if (isConnected) {
            router.push('/dashboard');
        } else {
            router.push('/landing');
        }
    }, [isConnected, router]);
    
    return null;
}
