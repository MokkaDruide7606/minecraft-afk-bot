import { useEffect, useRef, useState } from 'react';
import { BotStatus, BotSession, WebSocketMessage } from '@/types/bot';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [sessions, setSessions] = useState<BotSession[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRunning: false,
    sessionId: null,
    stats: { uptime: 0, ping: 0, actions: 0 }
  });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Request current sessions
      sendMessage({ type: 'get_sessions' });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'status_update':
            setBotStatus(data.data);
            break;
          case 'sessions_update':
            setSessions(data.data);
            break;
          // Handle other message types as needed
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    botStatus,
    sessions,
    sendMessage
  };
}
