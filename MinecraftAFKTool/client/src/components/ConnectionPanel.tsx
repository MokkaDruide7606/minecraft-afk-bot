import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Server, Play, Square } from 'lucide-react';
import { ServerConfig, WebSocketMessage } from '@/types/bot';

interface ConnectionPanelProps {
  onConnect: (config: ServerConfig) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
}

export function ConnectionPanel({ onConnect, onDisconnect, isConnected, sendMessage }: ConnectionPanelProps) {
  const [config, setConfig] = useState<ServerConfig>({
    ip: '',
    port: 25565,
    version: '1.20.1',
    username: '',
    password: '',
    authType: 'offline'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConnected) {
      sendMessage({ type: 'disconnect' });
      onDisconnect();
    } else {
      sendMessage({ type: 'connect', config });
      onConnect(config);
    }
  };

  return (
    <Card className="bg-mc-surface border-mc-border">
      <CardHeader>
        <h2 className="text-lg font-semibold text-mc-green flex items-center">
          <Server className="mr-2 h-5 w-5" />
          Server Connection
        </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="server-ip" className="text-sm font-medium text-gray-300">
              Server IP
            </Label>
            <Input
              id="server-ip"
              type="text"
              placeholder="play.hypixel.net"
              value={config.ip}
              onChange={(e) => setConfig({ ...config, ip: e.target.value })}
              className="bg-mc-dark border-mc-border text-white placeholder-gray-500 focus:ring-mc-green focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="port" className="text-sm font-medium text-gray-300">
                Port
              </Label>
              <Input
                id="port"
                type="number"
                placeholder="25565"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 25565 })}
                className="bg-mc-dark border-mc-border text-white placeholder-gray-500 focus:ring-mc-green focus:border-transparent"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300">
                Version
              </Label>
              <Select value={config.version} onValueChange={(value) => setConfig({ ...config, version: value })}>
                <SelectTrigger className="bg-mc-dark border-mc-border text-white focus:ring-mc-green focus:border-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-mc-dark border-mc-border">
                  <SelectItem value="1.20.1">1.20.1</SelectItem>
                  <SelectItem value="1.19.4">1.19.4</SelectItem>
                  <SelectItem value="1.18.2">1.18.2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2">
              Account Type
            </Label>
            <Select value={config.authType} onValueChange={(value: 'offline' | 'mojang') => setConfig({ ...config, authType: value })}>
              <SelectTrigger className="bg-mc-dark border-mc-border text-white focus:ring-mc-green focus:border-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-mc-dark border-mc-border">
                <SelectItem value="offline">Offline Mode (Cracked)</SelectItem>
                <SelectItem value="mojang">Mojang Account (Premium)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="username" className="text-sm font-medium text-gray-300">
              {config.authType === 'mojang' ? 'Email/Username' : 'Username'}
            </Label>
            <Input
              id="username"
              type="text"
              placeholder={config.authType === 'mojang' ? 'deine@email.com' : 'AFKBot_Player'}
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              className="bg-mc-dark border-mc-border text-white placeholder-gray-500 focus:ring-mc-green focus:border-transparent"
            />
          </div>

          {config.authType === 'mojang' && (
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Dein Minecraft Passwort"
                value={config.password || ''}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                className="bg-mc-dark border-mc-border text-white placeholder-gray-500 focus:ring-mc-green focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deine Anmeldedaten werden sicher verwendet und nur für die Minecraft-Authentifizierung gespeichert.
              </p>
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full bg-mc-green text-mc-dark hover:bg-green-400 transition-colors font-medium"
          >
            {isConnected ? (
              <>
                <Square className="mr-2 h-4 w-4" />
                Disconnect
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Connect to Server
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
