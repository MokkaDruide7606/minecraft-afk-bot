import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Bot } from 'lucide-react';
import { BotConfig, WebSocketMessage } from '@/types/bot';

interface BotControlsProps {
  sendMessage: (message: WebSocketMessage) => void;
  sessionId: number | null;
}

export function BotControls({ sendMessage, sessionId }: BotControlsProps) {
  const [config, setConfig] = useState<BotConfig>({
    afkEnabled: false,
    movementPattern: 'walking_circle',
    movementInterval: 5,
    chatMonitoring: true
  });

  const handleAFKToggle = (enabled: boolean) => {
    setConfig({ ...config, afkEnabled: enabled });
    if (enabled) {
      sendMessage({ type: 'start_afk' });
    } else {
      sendMessage({ type: 'stop_afk' });
    }
  };

  const handleConfigChange = (updates: Partial<BotConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    
    // Update server config if session exists
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    }
  };

  return (
    <Card className="bg-mc-surface border-mc-border">
      <CardHeader>
        <h3 className="text-lg font-semibold text-mc-green flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          Bot Controls
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-mc-dark rounded-md">
          <span className="text-sm font-medium">AFK Mode</span>
          <Switch
            checked={config.afkEnabled}
            onCheckedChange={handleAFKToggle}
            className="data-[state=checked]:bg-mc-green"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-300 mb-2">
            Movement Pattern
          </Label>
          <Select 
            value={config.movementPattern} 
            onValueChange={(value) => handleConfigChange({ movementPattern: value })}
          >
            <SelectTrigger className="bg-mc-dark border-mc-border text-white focus:ring-mc-green focus:border-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-mc-dark border-mc-border">
              <SelectItem value="walking_circle">Walking Circle</SelectItem>
              <SelectItem value="random_walk">Random Walk</SelectItem>
              <SelectItem value="jump_in_place">Jump in Place</SelectItem>
              <SelectItem value="look_around">Look Around</SelectItem>
              <SelectItem value="custom_pattern">Custom Pattern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-300 mb-2">
            Movement Interval (seconds)
          </Label>
          <Slider
            value={[config.movementInterval]}
            onValueChange={(value) => handleConfigChange({ movementInterval: value[0] })}
            max={30}
            min={1}
            step={1}
            className="slider-thumb"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1s</span>
            <span className="text-mc-green font-mono">{config.movementInterval}s</span>
            <span>30s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
