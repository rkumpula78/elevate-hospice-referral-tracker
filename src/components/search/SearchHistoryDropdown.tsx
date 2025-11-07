import React from 'react';
import { Clock, X, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SearchHistoryItem {
  query: string;
  timestamp: string;
}

interface SearchHistoryDropdownProps {
  history: SearchHistoryItem[];
  onSelectHistory: (query: string) => void;
  onClearHistory: () => void;
  onRemoveItem: (index: number) => void;
}

export const SearchHistoryDropdown = ({
  history,
  onSelectHistory,
  onClearHistory,
  onRemoveItem
}: SearchHistoryDropdownProps) => {
  if (history.length === 0) {
    return (
      <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg bg-background border">
        <CardContent className="p-4 text-center">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No recent searches</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg bg-background border">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Recent Searches</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="h-6 px-2 text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {history.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 cursor-pointer group"
              onClick={() => onSelectHistory(item.query)}
            >
              <div className="flex-1">
                <p className="text-sm text-foreground">{item.query}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleDateString()} at{' '}
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(index);
                }}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
