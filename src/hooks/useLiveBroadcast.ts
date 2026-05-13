// src/hooks/useLiveBroadcast.ts

import { useEffect, useRef, useState, useCallback } from 'react';

interface LiveMessage {
    type: 'ticker' | 'winner' | 'stock' | 'countdown' | 'announcement' | 'connected';
    channel: string;
    data: any;
    timestamp: string;
}

interface UseLiveBroadcastOptions {
    channels: string[];
    userId?: string;
    isAdmin?: boolean;
    onMessage?: (message: LiveMessage) => void;
    onWinner?: (data: any) => void;
    onTicker?: (data: any) => void;
    onStockUpdate?: (data: any) => void;
    onCountdown?: (data: any) => void;
}

export function useLiveBroadcast(options: UseLiveBroadcastOptions) {
    const {
        channels,
        userId,
        isAdmin = false,
        onMessage,
        onWinner,
        onTicker,
        onStockUpdate,
        onCountdown
    } = options;
    
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<LiveMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const connect = useCallback(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';
        const params = new URLSearchParams();
        params.set('channels', channels.join(','));
        if (userId) params.set('userId', userId);
        if (isAdmin) params.set('admin', 'true');
        
        const ws = new WebSocket(`${wsUrl}?${params.toString()}`);
        
        ws.onopen = () => {
            console.log('Live broadcast connected');
            setIsConnected(true);
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                setLastMessage(message);
                onMessage?.(message);
                
                // Route to specific handlers
                switch (message.type) {
                    case 'winner':
                        onWinner?.(message.data);
                        break;
                    case 'ticker':
                        onTicker?.(message.data);
                        break;
                    case 'stock':
                        onStockUpdate?.(message.data);
                        break;
                    case 'countdown':
                        onCountdown?.(message.data);
                        break;
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };
        
        ws.onclose = () => {
            console.log('Live broadcast disconnected, reconnecting...');
            setIsConnected(false);
            
            // Reconnect after delay
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };
        
        wsRef.current = ws;
    }, [channels, userId, isAdmin, onMessage, onWinner, onTicker, onStockUpdate, onCountdown]);
    
    const send = useCallback((action: string, data: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action, ...data }));
        } else {
            console.warn('WebSocket not connected');
        }
    }, []);
    
    const triggerWinner = useCallback((gameId: string, winnerName: string) => {
        send('trigger_winner', { gameId, winnerName });
    }, [send]);
    
    const extendTimer = useCallback((dealId: string, minutes: number) => {
        send('extend_timer', { dealId, minutes });
    }, [send]);
    
    const addStock = useCallback((dealId: string, quantity: number) => {
        send('add_stock', { dealId, quantity });
    }, [send]);
    
    const revealMystery = useCallback((bundleId: string) => {
        send('reveal_mystery', { bundleId });
    }, [send]);
    
    const sendAnnouncement = useCallback((channel: string, text: string) => {
        send('send_announcement', { channel, text });
    }, [send]);
    
    useEffect(() => {
        connect();
        
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);
    
    return {
        isConnected,
        lastMessage,
        send,
        triggerWinner,
        extendTimer,
        addStock,
        revealMystery,
        sendAnnouncement
    };
}