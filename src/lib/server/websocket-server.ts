// server/websocket-server.ts
// Run as separate Node.js process or Next.js API route with WebSocket support

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';

// Configuration
const PORT = parseInt(process.env.WS_PORT || '3002');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize
const server = createServer();
const wss = new WebSocketServer({ server });
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Connection management
interface ClientConnection {
    ws: WebSocket;
    channels: Set<string>;
    userId?: string;
    isAdmin?: boolean;
}

const clients = new Map<WebSocket, ClientConnection>();

// Redis pub/sub for cross-instance messaging
const redisSubscriber = redis.duplicate();

redisSubscriber.subscribe('live:ticker', 'live:winner', 'live:stock', 'live:countdown');
redisSubscriber.on('message', (channel, message) => {
    const data = JSON.parse(message);
    broadcastToChannel(data.channel, {
        type: channel.replace('live:', ''),
        data: data.payload
    });
});

// Supabase Realtime listener (fallback and for persistence)
supabase
    .channel('live-broadcast')
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bundle_purchases' },
        (payload) => {
            publishToRedis('live:ticker', {
                channel: `bundle:${payload.new.bundle_id}`,
                payload: {
                    type: 'claim',
                    userName: payload.new.user_name,
                    itemName: payload.new.bundle_name,
                    timestamp: new Date().toISOString()
                }
            });
        }
    )
    .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'spin_games' },
        (payload) => {
            if (payload.new.single_prize_claimed && !payload.old.single_prize_claimed) {
                publishToRedis('live:winner', {
                    channel: `spin:${payload.new.id}`,
                    payload: {
                        type: 'grand_prize_won',
                        winnerName: payload.new.single_prize_winner_name,
                        prize: payload.new.prize_config.find((p: any) => p.type === 'grand')?.label
                    }
                });
            }
        }
    )
    .subscribe();

// Helper functions
function publishToRedis(channel: string, data: any) {
    redis.publish(channel, JSON.stringify(data));
}

function broadcastToChannel(channel: string, message: any) {
    const messageStr = JSON.stringify({ channel, ...message });
    for (const client of clients.values()) {
        if (client.channels.has(channel) || channel === 'global') {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(messageStr);
            }
        }
    }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const channels = url.searchParams.get('channels')?.split(',') || [];
    const userId = url.searchParams.get('userId') || undefined;
    const isAdmin = url.searchParams.get('admin') === 'true';
    
    // Store client connection
    clients.set(ws, {
        ws,
        channels: new Set(channels),
        userId,
        isAdmin
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
        type: 'connected',
        channels,
        timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages (for admin controls)
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());
            const client = clients.get(ws);
            
            if (!client?.isAdmin) return; // Only admins can send commands
            
            switch (message.action) {
                case 'trigger_winner':
                    await handleTriggerWinner(message.gameId, message.winnerName);
                    break;
                case 'extend_timer':
                    await handleExtendTimer(message.dealId, message.minutes);
                    break;
                case 'add_stock':
                    await handleAddStock(message.dealId, message.quantity);
                    break;
                case 'reveal_mystery':
                    await handleRevealMystery(message.bundleId);
                    break;
                case 'send_announcement':
                    broadcastToChannel(message.channel, {
                        type: 'announcement',
                        message: message.text,
                        sender: client.userId
                    });
                    break;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        clients.delete(ws);
    });
});

// Admin command handlers
async function handleTriggerWinner(gameId: string, winnerName: string) {
    publishToRedis('live:winner', {
        channel: `spin:${gameId}`,
        payload: {
            type: 'manual_winner',
            winnerName,
            timestamp: new Date().toISOString()
        }
    });
}

async function handleExtendTimer(dealId: string, minutes: number) {
    const { error } = await supabase
        .from('deals')
        .update({ 
            ends_at: new Date(Date.now() + minutes * 60 * 1000).toISOString()
        })
        .eq('id', dealId);
    
    if (!error) {
        publishToRedis('live:countdown', {
            channel: `deal:${dealId}`,
            payload: {
                type: 'timer_extended',
                extraMinutes: minutes,
                newEndTime: new Date(Date.now() + minutes * 60 * 1000).toISOString()
            }
        });
    }
}

async function handleAddStock(dealId: string, quantity: number) {
    const { data: deal } = await supabase
        .from('deals')
        .select('remaining_quantity')
        .eq('id', dealId)
        .single();
    
    const newStock = (deal?.remaining_quantity || 0) + quantity;
    
    await supabase
        .from('deals')
        .update({ remaining_quantity: newStock })
        .eq('id', dealId);
    
    publishToRedis('live:stock', {
        channel: `deal:${dealId}`,
        payload: {
            type: 'stock_added',
            newStock,
            added: quantity
        }
    });
}

async function handleRevealMystery(bundleId: string) {
    await supabase
        .from('bundle_live_config')
        .update({ 
            is_mystery_revealed: true,
            mystery_revealed_at: new Date().toISOString()
        })
        .eq('bundle_id', bundleId);
    
    publishToRedis('live:ticker', {
        channel: `bundle:${bundleId}`,
        payload: {
            type: 'mystery_revealed',
            timestamp: new Date().toISOString()
        }
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});