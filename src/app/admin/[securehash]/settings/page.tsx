// src/app/admin/[secureHash]/settings/page.tsx

"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useWriteContract } from 'wagmi';
import { rayanChainDaoAbi, financeAbi } from '@/lib/blockchain/generated'; // فرض بر وجود ABI
import { useWeb3 } from '@/context/Web3Provider';
import { parseEther } from 'viem';

export default function AdminSettingsPage() {
    const { daoAddress, financeAddress } = useWeb3();
    const { writeContractAsync } = useWriteContract();
    
    const [votingPeriod, setVotingPeriod] = useState('');
    const [protocolFee, setProtocolFee] = useState('1'); // درصد

    const updateVotingPeriod = async () => {
        try {
            // فراخوانی تابع setVotingPeriod در DAO (باید در قرارداد اضافه شود اگر نیست)
            // یا تغییر از طریق Timelock
            toast.info("This action usually requires a Timelock proposal.");
        } catch (e) { toast.error("Failed"); }
    };

    return (
        <div className="container py-10 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Platform Configuration</h1>
            
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Governance Parameters</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label>Voting Period (Seconds)</Label>
                            <div className="flex gap-2">
                                <Input type="number" value={votingPeriod} onChange={e => setVotingPeriod(e.target.value)} />
                                <Button onClick={updateVotingPeriod}>Update</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Financial Parameters (SaaS)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid w-full items-center gap-1.5">
                            <Label>Protocol Fee (%)</Label>
                            <div className="flex gap-2">
                                <Input type="number" value={protocolFee} onChange={e => setProtocolFee(e.target.value)} />
                                <Button variant="secondary">Update Fee</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}