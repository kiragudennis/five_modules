// tests/integration/live-broadcast.test.ts

describe('Live Broadcast Integration', () => {
    test('WebSocket connects to all module channels', async () => {
        const ws = new WebSocket('ws://localhost:3002?channels=bundle:123,spin:456');
        await waitFor(() => expect(ws.readyState).toBe(WebSocket.OPEN));
    });
    
    test('Bundle claim triggers ticker update', async () => {
        const bundleId = 'test-bundle';
        await supabase.from('bundle_purchases').insert({
            bundle_id: bundleId,
            user_id: 'test-user',
            user_name: 'Test User'
        });
        
        // Verify ticker message received
        const message = await waitForWebSocketMessage('bundle:' + bundleId);
        expect(message.type).toBe('ticker');
    });
    
    test('Admin can extend deal timer', async () => {
        const dealId = 'test-deal';
        const originalEnd = new Date();
        
        await adminWs.send(JSON.stringify({
            action: 'extend_timer',
            dealId,
            minutes: 10
        }));
        
        const { data: deal } = await supabase
            .from('deals')
            .select('ends_at')
            .eq('id', dealId)
            .single();
        
        expect(new Date(deal.ends_at).getTime()).toBeGreaterThan(originalEnd.getTime() + 9 * 60 * 1000);
    });
});