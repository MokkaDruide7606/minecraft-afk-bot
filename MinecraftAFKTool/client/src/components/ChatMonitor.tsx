import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send } from 'lucide-react';
import { ChatMessage, WebSocketMessage } from '@/types/bot';

interface ChatMonitorProps {
  sessionId: number | null;
  sendMessage: (message: WebSocketMessage) => void;
}

export function ChatMonitor({ sessionId, sendMessage }: ChatMonitorProps) {
  const [chatInput, setChatInput] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(true);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['/api/sessions', sessionId, 'chat'],
    enabled: sessionId !== null && isMonitoring,
    refetchInterval: 1000, // Refresh every second for chat
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSenderColor = (sender: string) => {
    if (sender === 'Bot') return 'text-mc-green';
    if (sender.startsWith('[') || sender === 'Server') return 'text-yellow-400';
    if (sender.includes('Mod') || sender.includes('Admin')) return 'text-green-400';
    return 'text-blue-400';
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    sendMessage({ 
      type: 'send_chat', 
      message: chatInput 
    });
    setChatInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Card className="bg-mc-surface border-mc-border">
      <CardHeader className="border-b border-mc-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-mc-green flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            Chat Monitor
          </h3>
          <div className="flex items-center space-x-2">
            <Switch
              checked={isMonitoring}
              onCheckedChange={setIsMonitoring}
              className="data-[state=checked]:bg-mc-green"
            />
            <Label className="text-xs text-gray-400">Monitor</Label>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="bg-mc-dark rounded-md p-4 h-48 overflow-y-auto font-mono text-sm">
          {!isMonitoring ? (
            <div className="text-center text-gray-500 py-8">
              Chat monitoring is disabled
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No chat messages yet
            </div>
          ) : (
            messages.map((message: ChatMessage) => (
              <div key={message.id} className="mb-2">
                <span className="text-gray-500">[{formatTime(message.timestamp.toString())}]</span>
                <span className={`ml-1 ${getSenderColor(message.sender)}`}>
                  &lt;{message.sender}&gt;
                </span>
                <span className="text-white ml-1">{message.message}</span>
              </div>
            )).reverse()
          )}
        </div>
        
        <div className="mt-4 flex space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!sessionId}
            className="flex-1 bg-mc-dark border-mc-border text-white placeholder-gray-500 focus:ring-mc-green focus:border-transparent"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!sessionId || !chatInput.trim()}
            className="bg-mc-green text-mc-dark hover:bg-green-400 transition-colors"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
