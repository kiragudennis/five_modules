// src/components/live/live-display-shell.tsx

'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LiveDisplayShellProps {
    title: string;
    subtitle?: string;
    activeCount?: number;
    tickerItems?: string[];
    children: ReactNode;
    theme?: 'dark' | 'light' | 'broadcast';
    showHeader?: boolean;
    showTicker?: boolean;
    showFooter?: boolean;
    className?: string;
}

export function LiveDisplayShell({
    title,
    subtitle,
    activeCount,
    tickerItems = [],
    children,
    theme = 'broadcast',
    showHeader = true,
    showTicker = true,
    showFooter = true,
    className
}: LiveDisplayShellProps) {
    const [currentTickerIndex, setCurrentTickerIndex] = useState(0);
    const tickerRef = useRef<HTMLDivElement>(null);
    
    // Auto-rotate ticker items
    useEffect(() => {
        if (tickerItems.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentTickerIndex((prev) => (prev + 1) % tickerItems.length);
        }, 3000);
        
        return () => clearInterval(interval);
    }, [tickerItems.length]);
    
    const themeStyles = {
        dark: {
            background: 'bg-slate-900',
            text: 'text-white',
            subtext: 'text-slate-400',
            card: 'bg-slate-800 border-slate-700',
            accent: 'text-purple-400'
        },
        light: {
            background: 'bg-white',
            text: 'text-slate-900',
            subtext: 'text-slate-600',
            card: 'bg-slate-100 border-slate-200',
            accent: 'text-purple-600'
        },
        broadcast: {
            background: 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950',
            text: 'text-white',
            subtext: 'text-slate-300',
            card: 'bg-slate-900/80 border-purple-500/30 backdrop-blur-sm',
            accent: 'text-purple-400'
        }
    };
    
    const style = themeStyles[theme];
    
    return (
        <div className={cn("min-h-screen font-mono", style.background, className)}>
            {/* OBS-friendly metadata */}
            <div className="hidden obs-metadata" data-title={title} data-subtitle={subtitle} />
            
            {/* Header */}
            {showHeader && (
                <div className="text-center py-6 border-b border-purple-500/30">
                    <h1 className={cn("text-3xl font-bold tracking-tight", style.text)}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p className={cn("text-sm mt-1", style.subtext)}>
                            {subtitle}
                        </p>
                    )}
                    {activeCount !== undefined && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                            <span className={cn("text-xs", style.subtext)}>
                                {activeCount} active
                            </span>
                        </div>
                    )}
                </div>
            )}
            
            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                {children}
            </div>
            
            {/* Scrolling Ticker */}
            {showTicker && tickerItems.length > 0 && (
                <div className={cn(
                    "fixed bottom-0 left-0 right-0 py-2 overflow-hidden border-t",
                    theme === 'broadcast' ? 'bg-purple-950/80 border-purple-500/30' : 'bg-slate-800 border-slate-700'
                )}>
                    <div 
                        ref={tickerRef}
                        className="whitespace-nowrap animate-scroll-x"
                        style={{ animationDuration: `${tickerItems.length * 2}s` }}
                    >
                        {tickerItems.map((item, idx) => (
                            <span key={idx} className="inline-block mx-4 text-sm">
                                🎉 {item} 🎉
                            </span>
                        ))}
                        {/* Duplicate for seamless loop */}
                        {tickerItems.map((item, idx) => (
                            <span key={`dup-${idx}`} className="inline-block mx-4 text-sm">
                                🎉 {item} 🎉
                            </span>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Footer */}
            {showFooter && (
                <div className={cn(
                    "text-center py-3 text-xs border-t mt-8",
                    theme === 'broadcast' ? 'border-purple-500/30 text-purple-400/60' : 'border-slate-700 text-slate-500'
                )}>
                    <span>LIVE BROADCAST MODE</span>
                    <span className="mx-2">•</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                    <span className="mx-2">•</span>
                    <span>Powered by Combine</span>
                </div>
            )}
            
            <style jsx global>{`
                @keyframes scroll-x {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll-x {
                    animation: scroll-x linear infinite;
                }
            `}</style>
        </div>
    );
}