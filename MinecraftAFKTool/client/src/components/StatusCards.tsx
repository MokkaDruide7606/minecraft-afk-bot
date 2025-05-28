import { Card, CardContent } from '@/components/ui/card';
import { Clock, Wifi, Activity } from 'lucide-react';
import { BotStats } from '@/types/bot';

interface StatusCardsProps {
  stats: BotStats;
}

export function StatusCards({ stats }: StatusCardsProps) {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-mc-surface border-mc-border">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-900 rounded-lg">
              <Clock className="h-5 w-5 text-mc-green" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Uptime</p>
              <p className="text-lg font-semibold">{formatUptime(stats.uptime)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-mc-surface border-mc-border">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-900 rounded-lg">
              <Wifi className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Ping</p>
              <p className="text-lg font-semibold">{stats.ping}ms</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-mc-surface border-mc-border">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-900 rounded-lg">
              <Activity className="h-5 w-5 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Actions</p>
              <p className="text-lg font-semibold">{stats.actions.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
