// server/websocket-server.ts
// Run as separate Node.js process or Next.js API route with WebSocket support
// This server handles real-time WebSocket connections for live updates across all modules.
// Uses direct Supabase client (not SSR) since it runs outside Next.js request context.

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';

// Configuration
const PORT = parseInt(process.env.WS_PORT || '3002');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
    process.exit(1);
}

// Types
interface ClientConnection {
    ws: WebSocket;
    channels: Set<string>;
    userId?: string;
    isAdmin?: boolean;
}

interface RedisMessage {
    channel: string;
    payload: any;
}

interface WinnerPayload {
    type: string;
    winnerName?: string;
    prize?: string;
    timestamp: string;
}

interface TickerPayload {
    type: string;
    userName?: string;
    itemName?: string;
    timestamp: string;
}

// Initialize - Direct Supabase client (not SSR)
const server = createServer();
const wss = new WebSocketServer({ server });
const redis = new Redis(REDIS_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Connection management
const clients = new Map<WebSocket, ClientConnection>();

// Redis pub/sub for cross-instance messaging
const redisSubscriber = redis.duplicate();

// Store channel subscriptions for cleanup
const channelSubscriptions: Map<string, any> = new Map();

// Helper function to broadcast to specific channel
function broadcastToChannel(channel: string, message: any): void {
    const messageStr = JSON.stringify({ channel, ...message });
    for (const [ws, client] of clients.entries()) {
        if (client.channels.has(channel) || channel === 'global') {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        }
    }
}

// Helper function to publish to Redis
function publishToRedis(channel: string, data: any): void {
    redis.publish(channel, JSON.stringify(data)).catch(console.error);
}

// Set up Redis subscriber
redisSubscriber.subscribe('live:ticker', 'live:winner', 'live:stock', 'live:countdown');
redisSubscriber.on('message', (channel: string, message: string) => {
    try {
        const data = JSON.parse(message) as RedisMessage;
        broadcastToChannel(data.channel, {
            type: channel.replace('live:', ''),
            data: data.payload
        });
    } catch (error) {
        console.error('Failed to parse Redis message:', error);
    }
});

// Set up Supabase Realtime listeners (async initialization)
async function setupSupabaseRealtime(): Promise<void> {
    try {
        // Bundle purchases listener
        const bundleChannel = supabase
            .channel('live-broadcast-bundles')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'bundle_purchases' },
                (payload) => {
                    const newRecord = payload.new as any;
                    publishToRedis('live:ticker', {
                        channel: `bundle:${newRecord.bundle_id}`,
                        payload: {
                            type: 'claim',
                            userName: newRecord.user_name || 'Customer',
                            itemName: newRecord.bundle_name,
                            timestamp: new Date().toISOString()
                        } as TickerPayload
                    });
                }
            );
        
        // Spin attempts listener (for live winners)
        const spinAttemptsChannel = supabase
            .channel('live-broadcast-spin-attempts')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'spin_attempts' },
                (payload) => {
                    const newRecord = payload.new as any;
                    // Only broadcast non-zero wins
                    if (newRecord.points_awarded > 0 || newRecord.prize_value) {
                        publishToRedis('live:ticker', {
                            channel: `spin:${newRecord.game_id}`,
                            payload: {
                                type: 'win',
                                userName: newRecord.user_name,
                                prizeText: newRecord.prize_value,
                                pointsAwarded: newRecord.points_awarded,
                                timestamp: new Date().toISOString()
                            }
                        });
                    }
                }
            );
        
        // Spin games listener (grand prize wins)
        const spinGamesChannel = supabase
            .channel('live-broadcast-spin-games')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'spin_games' },
                (payload) => {
                    const oldRecord = payload.old as any;
                    const newRecord = payload.new as any;
                    
                    if (newRecord.single_prize_claimed && !oldRecord.single_prize_claimed) {
                        // Parse prize_config if it's a string
                        let prizeConfig = newRecord.prize_config;
                        if (typeof prizeConfig === 'string') {
                            try {
                                prizeConfig = JSON.parse(prizeConfig);
                            } catch {
                                prizeConfig = [];
                            }
                        }
                        
                        const grandPrize = Array.isArray(prizeConfig) 
                            ? prizeConfig.find((p: any) => p.type === 'product' || p.type === 'bundle')
                            : null;
                        
                        publishToRedis('live:winner', {
                            channel: `spin:${newRecord.id}`,
                            payload: {
                                type: 'grand_prize_won',
                                winnerName: newRecord.single_prize_winner_name || 'Anonymous',
                                prize: grandPrize?.label || 'Grand Prize',
                                timestamp: new Date().toISOString()
                            } as WinnerPayload
                        });
                    }
                }
            );
        
        // Challenges listener
        const challengeChannel = supabase
            .channel('live-broadcast-challenges')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'challenge_actions' },
                (payload) => {
                    const newRecord = payload.new as any;
                    publishToRedis('live:ticker', {
                        channel: `challenge:${newRecord.challenge_id}`,
                        payload: {
                            type: 'action',
                            userName: newRecord.user_name,
                            actionText: newRecord.action_text,
                            pointsAwarded: newRecord.points_awarded,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            );
        
        // Draws listener
        const drawChannel = supabase
            .channel('live-broadcast-draws')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'draw_entries' },
                (payload) => {
                    const newRecord = payload.new as any;
                    publishToRedis('live:ticker', {
                        channel: `draw:${newRecord.draw_id}`,
                        payload: {
                            type: 'entry',
                            userName: newRecord.user_name,
                            entryCount: newRecord.entry_count,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            );
        
        // Deals listener
        const dealChannel = supabase
            .channel('live-broadcast-deals')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'deal_claims' },
                (payload) => {
                    const newRecord = payload.new as any;
                    publishToRedis('live:ticker', {
                        channel: `deal:${newRecord.deal_id}`,
                        payload: {
                            type: 'claim',
                            userName: newRecord.user_name,
                            quantity: newRecord.quantity,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            );
        
        // Subscribe to all channels
        await Promise.all([
            bundleChannel.subscribe(),
            spinAttemptsChannel.subscribe(),
            spinGamesChannel.subscribe(),
            challengeChannel.subscribe(),
            drawChannel.subscribe(),
            dealChannel.subscribe()
        ]);
        
        // Store for cleanup
        channelSubscriptions.set('bundles', bundleChannel);
        channelSubscriptions.set('spin-attempts', spinAttemptsChannel);
        channelSubscriptions.set('spin-games', spinGamesChannel);
        channelSubscriptions.set('challenges', challengeChannel);
        channelSubscriptions.set('draws', drawChannel);
        channelSubscriptions.set('deals', dealChannel);
        
        console.log('✅ Supabase Realtime listeners established');
        console.log(`   - Bundles: tracking purchases`);
        console.log(`   - Spins: tracking attempts and grand prizes`);
        console.log(`   - Challenges: tracking actions`);
        console.log(`   - Draws: tracking entries`);
        console.log(`   - Deals: tracking claims`);
    } catch (error) {
        console.error('Failed to setup Supabase Realtime:', error);
    }
}

// Admin command handlers
async function handleTriggerWinner(gameId: string, winnerName: string): Promise<void> {
    publishToRedis('live:winner', {
        channel: `spin:${gameId}`,
        payload: {
            type: 'manual_winner',
            winnerName,
            timestamp: new Date().toISOString()
        } as WinnerPayload
    });
}

async function handleExtendTimer(dealId: string, minutes: number): Promise<void> {
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
    } else {
        console.error('Failed to extend timer:', error);
    }
}

async function handleAddStock(dealId: string, quantity: number): Promise<void> {
    const { data: deal, error } = await supabase
        .from('deals')
        .select('remaining_quantity')
        .eq('id', dealId)
        .single();
    
    if (error) {
        console.error('Failed to get deal:', error);
        return;
    }
    
    const newStock = (deal?.remaining_quantity || 0) + quantity;
    
    const { error: updateError } = await supabase
        .from('deals')
        .update({ remaining_quantity: newStock })
        .eq('id', dealId);
    
    if (updateError) {
        console.error('Failed to update stock:', updateError);
        return;
    }
    
    publishToRedis('live:stock', {
        channel: `deal:${dealId}`,
        payload: {
            type: 'stock_added',
            newStock,
            added: quantity,
            timestamp: new Date().toISOString()
        }
    });
}

async function handleRevealMystery(bundleId: string): Promise<void> {
    const { error } = await supabase
        .from('bundle_live_config')
        .update({ 
            is_mystery_revealed: true,
            mystery_revealed_at: new Date().toISOString()
        })
        .eq('bundle_id', bundleId);
    
    if (error) {
        console.error('Failed to reveal mystery:', error);
        return;
    }
    
    publishToRedis('live:ticker', {
        channel: `bundle:${bundleId}`,
        payload: {
            type: 'mystery_revealed',
            timestamp: new Date().toISOString()
        } as TickerPayload
    });
}

// WebSocket connection handler
wss.on('connection', (ws: WebSocket, req: any) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const channels = url.searchParams.get('channels')?.split(',') || [];
    const userId = url.searchParams.get('userId') || undefined;
    const isAdmin = url.searchParams.get('admin') === 'true';
    
    console.log(`Client connected: ${channels.length} channels, admin: ${isAdmin}`);
    
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
    ws.on('message', async (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());
            const client = clients.get(ws);
            
            if (!client?.isAdmin) {
                console.warn('Non-admin attempted to send command');
                return;
            }
            
            console.log('Admin command:', message.action);
            
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
                        sender: client.userId,
                        timestamp: new Date().toISOString()
                    });
                    break;
                default:
                    console.warn('Unknown action:', message.action);
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        clients.delete(ws);
        console.log(`Client disconnected, ${clients.size} remaining`);
    });
    
    // Handle errors
    ws.on('error', (error: any) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

// Graceful shutdown
async function shutdown(): Promise<void> {
    console.log('Shutting down WebSocket server...');
    
    // Close all client connections
    for (const [ws] of clients.entries()) {
        ws.close();
    }
    
    // Unsubscribe from Supabase channels
    for (const [key, channel] of channelSubscriptions.entries()) {
        try {
            await channel.unsubscribe();
            console.log(`Unsubscribed from ${key} channel`);
        } catch (error) {
            console.error(`Error unsubscribing from ${key}:`, error);
        }
    }
    
    // Close Redis connections
    await redis.quit();
    await redisSubscriber.quit();
    
    // Close WebSocket server
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function startServer(): Promise<void> {
    try {
        // Test Supabase connection
        const { error: testError } = await supabase.from('spin_games').select('id').limit(1);
        if (testError) {
            console.error('Supabase connection test failed:', testError);
        } else {
            console.log('✅ Supabase connection established');
        }
        
        // Test Redis connection
        await redis.ping();
        console.log('✅ Redis connection established');
        
        // Setup Supabase Realtime listeners
        await setupSupabaseRealtime();
        
        // Start listening
        server.listen(PORT, () => {
            console.log(`\n🚀 WebSocket server running on ws://localhost:${PORT}`);
            console.log(`   Redis: ${REDIS_URL}`);
            console.log(`   Supabase: ${SUPABASE_URL}`);
            console.log(`\n📡 Listening for real-time events across all modules...\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();