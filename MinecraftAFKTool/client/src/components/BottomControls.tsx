import { Button } from '@/components/ui/button';
import { Pause, Square, AlertTriangle } from 'lucide-react';
import { BotStatus, WebSocketMessage } from '@/types/bot';

interface BottomControlsProps {
  botStatus: BotStatus;
  sendMessage: (message: WebSocketMessage) => void;
}

export function BottomControls({ botStatus, sendMessage }: BottomControlsProps) {
  const handlePause = () => {
    sendMessage({ type: 'stop_afk' });
  };

  const handleStop = () => {
    sendMessage({ type: 'stop_afk' });
  };

  const handleEmergencyStop = () => {
    sendMessage({ type: 'disconnect' });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-mc-surface border-t border-mc-border p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              botStatus.isRunning 
                ? 'bg-mc-green animate-pulse-green' 
                : 'bg-red-500 animate-pulse'
            }`} />
            <span className="text-sm text-gray-300">
              {botStatus.isRunning ? 'Bot Active' : 'Bot Inactive'}
            </span>
          </div>
          {botStatus.isRunning && (
            <div className="text-sm text-gray-400">
              Next action in <span className="text-mc-green font-mono">00:03</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePause}
            disabled={!botStatus.isRunning}
            className="bg-yellow-600 text-white hover:bg-yellow-500 transition-colors"
          >
            <Pause className="mr-1 h-4 w-4" />
            Pause
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleStop}
            disabled={!botStatus.isRunning}
            className="bg-red-600 text-white hover:bg-red-500 transition-colors"
          >
            <Square className="mr-1 h-4 w-4" />
            Stop Bot
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEmergencyStop}
            className="bg-red-800 text-white hover:bg-red-700 transition-colors"
          >
            <AlertTriangle className="mr-1 h-4 w-4" />
            Emergency Stop
          </Button>
        </div>
      </div>
    </div>
  );
}
