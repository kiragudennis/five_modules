// src/components/live/admin-broadcast.tsx
// Admin panel to send announcements via Supabase Broadcast

"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Send, Radio } from 'lucide-react';

export function AdminBroadcastPanel({ moduleType, moduleId }: { moduleType: string; moduleId: string }) {
  const { supabase } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendAnnouncement = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      const channel = supabase.channel(`live-${moduleType}-${moduleId}`);
      await channel.send({
        type: 'broadcast',
        event: 'announcement',
        payload: {
          message: message.trim(),
          sender: 'Admin',
          timestamp: new Date().toISOString(),
        },
      });
      toast.success('Announcement sent to all viewers');
      setMessage('');
    } catch (error) {
      toast.error('Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-500 animate-pulse" />
          Live Broadcast Control
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type announcement to all viewers..."
            onKeyDown={(e) => e.key === 'Enter' && sendAnnouncement()}
          />
          <Button onClick={sendAnnouncement} disabled={sending}>
            <Send className="h-4 w-4 mr-2" />
            Broadcast
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Announcements appear on all connected live displays
        </p>
      </CardContent>
    </Card>
  );
}