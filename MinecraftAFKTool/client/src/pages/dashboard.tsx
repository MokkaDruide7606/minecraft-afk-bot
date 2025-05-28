import { useState } from 'react';
import { ConnectionPanel } from '@/components/ConnectionPanel';
import { BotControls } from '@/components/BotControls';
import { StatusCards } from '@/components/StatusCards';
import { ActivityFeed } from '@/components/ActivityFeed';
import { ChatMonitor } from '@/components/ChatMonitor';
import { BottomControls } from '@/components/BottomControls';
import { SessionManager } from '@/components/SessionManager';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ServerConfig } from '@/types/bot';
import { Box, Settings } from 'lucide-react';

export default function Dashboard() {
  const { isConnected, botStatus, sessions, sendMessage } = useWebSocket();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const handleConnect = (config: ServerConfig) => {
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 2000);
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-mc-green';
      case 'connecting': return 'bg-yellow-400 animate-pulse';
      case 'disconnected': return 'bg-red-500 animate-pulse';
      default: return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-mc-surface border-b border-mc-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-mc-green rounded-sm flex items-center justify-center">
                <Box className="h-5 w-5 text-mc-dark" />
              </div>
              <h1 className="text-xl font-bold text-white">MinecraftAFK</h1>
              <span className="text-sm text-gray-400">Web Bot Controller</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                <span className="text-sm text-gray-300">{getStatusText()}</span>
              </div>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Connection & Session Management */}
          <div className="lg:col-span-1 space-y-6">
            <ConnectionPanel
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnected={connectionStatus === 'connected'}
              sendMessage={sendMessage}
            />
            
            <SessionManager 
              sendMessage={sendMessage}
              sessions={sessions}
            />
          </div>
          
          {/* Right Column - Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            {sessions.length > 0 && (
              <>
                <StatusCards stats={sessions[0]?.stats || { uptime: 0, ping: 0, actions: 0 }} />
                <ActivityFeed sessionId={sessions[0]?.id || null} />
                <ChatMonitor 
                  sessionId={sessions[0]?.id || null}
                  sendMessage={sendMessage}
                />
              </>
            )}
            
            {sessions.length === 0 && (
              <div className="text-center py-16">
                <Box className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Keine aktiven Bot-Sessions
                </h3>
                <p className="text-gray-400 mb-6">
                  Verbinde dich mit einem Server, um deinen ersten AFK-Bot zu starten
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <BottomControls 
        botStatus={botStatus}
        sendMessage={sendMessage}
      />
    </div>
  );
}
