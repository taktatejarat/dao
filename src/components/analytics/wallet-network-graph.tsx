// src/components/analytics/wallet-network-graph.tsx - ULTIMATE BLOCKCHAIN STYLE

"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import dynamic from 'next/dynamic';
import { useTheme } from "next-themes";
import { useTranslation } from "@/hooks/use-translation";
import { Card } from "@/components/ui/card";
import { DaoLoadingSpinner } from "@/components/icons/dao-loading-spinner";
import { Maximize2, Minimize2, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

// بارگذاری داینامیک گراف
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full w-full"><DaoLoadingSpinner /></div>
});

interface GraphProps {
    centralAddress: string;
    connections: any[];
}

export function WalletNetworkGraph({ centralAddress, connections }: GraphProps) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const fgRef = useRef<any>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [isFullscreen, setIsFullscreen] = useState(false);

    // مدیریت سایز و تمام صفحه
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();
        
        // Listener برای خروج از حالت تمام صفحه با ESC
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            window.removeEventListener('resize', updateDimensions);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // آماده‌سازی داده‌ها
    const graphData = useMemo(() => {
        const nodes: any[] = [];
        const links: any[] = [];
        const uniqueAddresses = new Set<string>();

        // 1. نود مرکزی (هیرو)
        nodes.push({ 
            id: centralAddress, 
            group: 'main', 
            val: 40, // اندازه بزرگ
            label: t('analytics_page.target_wallet'),
            color: '#7c3aed' // Primary Purple
        });
        uniqueAddresses.add(centralAddress.toLowerCase());

        // 2. نودهای همتا
        connections.forEach((conn) => {
            const otherAddr = conn.from.toLowerCase() === centralAddress.toLowerCase() ? conn.to : conn.from;
            if (!otherAddr) return;

            // افزودن نود همتا اگر قبلا اضافه نشده
            if (!uniqueAddresses.has(otherAddr.toLowerCase())) {
                nodes.push({ 
                    id: otherAddr, 
                    group: 'peer', 
                    val: 15, // اندازه متوسط
                    label: `${otherAddr.substring(0, 6)}...${otherAddr.substring(otherAddr.length - 4)}`,
                    color: '#06b6d4' // Cyan
                });
                uniqueAddresses.add(otherAddr.toLowerCase());
            }

            // افزودن لینک
            links.push({
                source: conn.from.toLowerCase() === centralAddress.toLowerCase() ? centralAddress : otherAddr,
                target: conn.from.toLowerCase() === centralAddress.toLowerCase() ? otherAddr : centralAddress,
                amount: conn.value ? `${parseFloat(conn.value).toFixed(2)}` : '0', // مقدار برای نمایش
                isError: conn.isError
            });
        });

        return { nodes, links };
    }, [centralAddress, connections, t]);

    // --- Custom Renderers (جادوی گرافیک) ---

    // 1. رسم نودها (دایره‌های نئونی)
    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.label;
        const fontSize = 12 / globalScale;
        const radius = node.val > 20 ? 8 : 4; // اندازه دایره

        // Glow Effect
        const glowColor = node.group === 'main' ? 'rgba(124, 58, 237, 0.4)' : 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
        ctx.fillStyle = glowColor;
        ctx.fill();

        // Main Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();

        // Label Text
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = theme === 'dark' ? '#e4e4e7' : '#18181b';
        ctx.fillText(label, node.x, node.y + radius + (8 / globalScale));
    }, [theme]);

    // 2. رسم لینک‌ها (نمایش متن روی خط)
    const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const start = link.source;
        const end = link.target;

        // تنظیمات خط
        ctx.lineWidth = 1 / globalScale;
        ctx.strokeStyle = link.isError ? '#ef4444' : (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)');
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // نمایش مبلغ روی خط
        if (link.amount && link.amount !== '0') {
            const text = `${link.amount} RYC`;
            const fontSize = 10 / globalScale;
            
            // محاسبه موقعیت وسط خط
            const textX = start.x + (end.x - start.x) * 0.5;
            const textY = start.y + (end.y - start.y) * 0.5;

            // پس‌زمینه متن (برای خوانایی)
            const textWidth = ctx.measureText(text).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
            ctx.fillStyle = theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';
            ctx.fillRect(textX - bckgDimensions[0] / 2, textY - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

            // خود متن
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.fillStyle = link.isError ? '#ef4444' : '#10b981'; // سبز برای موفق، قرمز برای خطا
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, textX, textY);
        }
    }, [theme]);

    return (
        <Card 
            ref={containerRef} 
            className={`relative overflow-hidden border border-primary/20 bg-background/50 backdrop-blur-sm transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 h-screen w-screen' : 'h-[600px] w-full'}`}
        >
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <Button 
                    size="icon" 
                    variant={isFullscreen ? "destructive" : "secondary"}
                    className="shadow-lg hover:scale-105 transition-transform"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? t('common.exit_fullscreen') : t('common.fullscreen')}
                >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
                <Button
                    size="icon"
                    variant="outline"
                    className="shadow-lg hover:scale-105 transition-transform bg-background/50"
                    onClick={() => fgRef.current?.zoomToFit(400)}
                    title={t('common.reset_zoom')}
                >
                    <MousePointer2 className="h-5 w-5" />
                </Button>
            </div>

            {/* Legend (راهنما) */}
            <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur border p-3 rounded-xl text-xs space-y-2 shadow-xl animate-in fade-in slide-in-from-bottom-4">
                <h4 className="font-bold mb-1 border-b pb-1 text-muted-foreground">{t('analytics_page.legend_title')}</h4>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.5)]"></span>
                    <span>{t('analytics_page.target_wallet')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></span>
                    <span>{t('analytics_page.connected_peers')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-emerald-500 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                    </div>
                    <span>{t('analytics_page.transaction_flow')}</span>
                </div>
            </div>

            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                // تنظیمات فیزیک گراف
                backgroundColor={theme === 'dark' ? '#020617' : '#ffffff'} // Slate-950 for dark mode
                
                // رندر سفارشی نود و لینک
                nodeCanvasObject={paintNode}
                linkCanvasObject={paintLink}
                
                // ذرات متحرک (Particles) برای حس بلاکچینی
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleColor={() => theme === 'dark' ? '#ffffff' : '#000000'}
                
                // تنظیمات تعاملی
                d3AlphaDecay={0.02} // انیمیشن نرم‌تر
                d3VelocityDecay={0.3}
                cooldownTicks={100}
                onNodeDragEnd={node => {
                    node.fx = node.x;
                    node.fy = node.y;
                }}
            />
        </Card>
    );
}