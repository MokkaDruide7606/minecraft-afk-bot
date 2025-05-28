import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, Download } from 'lucide-react';
import { ActivityLogEntry } from '@/types/bot';

interface ActivityFeedProps {
  sessionId: number | null;
}

export function ActivityFeed({ sessionId }: ActivityFeedProps) {
  const { data: logs = [], refetch } = useQuery({
    queryKey: ['/api/sessions', sessionId, 'logs'],
    enabled: sessionId !== null,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'bg-mc-green';
      case 'INFO': return 'bg-blue-400';
      case 'WARNING': return 'bg-yellow-400';
      case 'ERROR': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleExport = () => {
    if (logs.length === 0) return;
    
    const csvContent = logs.map((log: ActivityLogEntry) => 
      `${formatTime(log.timestamp.toString())},${log.type},${log.message}`
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity-log.csv';
    a.click();
  };

  return (
    <Card className="bg-mc-surface border-mc-border">
      <CardHeader className="border-b border-mc-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-mc-green flex items-center">
            <List className="mr-2 h-5 w-5" />
            Activity Log
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="text-gray-400 hover:text-white"
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">
              No activity logs yet. Connect to a server to start logging.
            </div>
          ) : (
            logs.map((log: ActivityLogEntry) => (
              <div key={log.id} className="px-6 py-3 border-b border-gray-700 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 ${getStatusColor(log.type)} rounded-full`} />
                    <span className="text-sm font-mono text-gray-300">
                      {formatTime(log.timestamp.toString())}
                    </span>
                    <span className="text-sm text-white">{log.message}</span>
                  </div>
                  <span className="text-xs text-gray-500">{log.type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
