import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, Pause, Plus, Users } from 'lucide-react';
import { BotSession, WebSocketMessage } from '@/types/bot';

interface SessionManagerProps {
  sendMessage: (message: WebSocketMessage) => void;
  sessions: BotSession[];
}

export function SessionManager({ sendMessage, sessions }: SessionManagerProps) {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStartAFK = (sessionId: number) => {
    sendMessage({ type: 'start_afk', sessionId });
  };

  const handleStopAFK = (sessionId: number) => {
    sendMessage({ type: 'stop_afk', sessionId });
  };

  const handleDisconnect = (sessionId: number) => {
    sendMessage({ type: 'disconnect', sessionId });
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="bg-mc-surface border-mc-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-mc-green flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Bot Sessions ({sessions.length})
          </h3>
          <Button
            onClick={() => sendMessage({ type: 'get_sessions' })}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No active bot sessions</p>
            <p className="text-sm">Connect to a server to create your first bot</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                selectedSession === session.id
                  ? 'border-mc-green bg-mc-dark'
                  : 'border-mc-border bg-mc-dark hover:border-gray-600'
              }`}
              onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(session.status)}`} />
                  <div>
                    <div className="font-medium text-white">{session.username}</div>
                    <div className="text-sm text-gray-400">
                      {session.serverIp}:{session.serverPort}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={session.isRunning ? "default" : "secondary"} className="text-xs">
                    {session.isRunning ? 'AFK' : 'Idle'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {session.status}
                  </Badge>
                </div>
              </div>
              
              {selectedSession === session.id && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-400">Uptime:</span>
                      <div className="font-mono text-mc-green">
                        {formatUptime(session.stats.uptime)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Ping:</span>
                      <div className="font-mono text-blue-400">
                        {session.stats.ping}ms
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Actions:</span>
                      <div className="font-mono text-purple-400">
                        {session.stats.actions}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {session.status === 'connected' && (
                      <>
                        <Button
                          onClick={() => session.isRunning ? handleStopAFK(session.id) : handleStartAFK(session.id)}
                          size="sm"
                          className={`${
                            session.isRunning 
                              ? 'bg-yellow-600 hover:bg-yellow-500' 
                              : 'bg-mc-green hover:bg-green-400'
                          } text-white`}
                        >
                          {session.isRunning ? (
                            <>
                              <Pause className="mr-1 h-3 w-3" />
                              Stop AFK
                            </>
                          ) : (
                            <>
                              <Play className="mr-1 h-3 w-3" />
                              Start AFK
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    
                    <Button
                      onClick={() => handleDisconnect(session.id)}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-500"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}