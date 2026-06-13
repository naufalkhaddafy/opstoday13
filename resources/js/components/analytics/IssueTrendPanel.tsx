import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingUp, TrendingDown, Minus, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { IssueTrendItem } from '@/types/dashboard';

interface IssueTrendPanelProps {
    trends: IssueTrendItem[];
    dateFrom?: string | null;
    dateTo?: string | null;
    className?: string;
    onItemClick?: (phrase: string) => void;
}

export function IssueTrendPanel({ trends, dateFrom, dateTo, className = '', onItemClick }: IssueTrendPanelProps) {
    if (!trends || trends.length === 0) {
        return (
            <Card className={`h-full flex flex-col ${className}`}>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Flame className="w-4 h-4 text-orange-500" />
                        Top 10 Issue Trends
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Most frequent issues this period
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                    No specific topic data in this period.
                </CardContent>
            </Card>
        );
    }

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up':
                return <ArrowUp className="w-3.5 h-3.5 text-rose-500" />;
            case 'down':
                return <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />;
            case 'stable':
                return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
            case 'new':
                return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
            default:
                return null;
        }
    };

    const getTrendColorClass = (trend: string) => {
        switch (trend) {
            case 'up': return 'text-rose-600';
            case 'down': return 'text-emerald-600';
            case 'stable': return 'text-muted-foreground';
            case 'new': return 'text-amber-600';
            default: return '';
        }
    };

    return (
        <Card className={`h-full flex flex-col ${className}`}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Top 10 Issue Trends
                </CardTitle>
                <CardDescription className="text-xs">
                    Most frequent issues this period
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-1.5">
                {trends.map((item, index) => (
                    <div 
                        key={index} 
                        onClick={() => onItemClick && onItemClick(item.phrase)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${onItemClick ? 'cursor-pointer hover:border-primary/30' : ''}`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0">
                                {index + 1}
                            </div>
                            <h4 className="font-semibold text-xs truncate max-w-[200px] xl:max-w-[300px]" title={item.phrase}>{item.phrase}</h4>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                            <div className={`flex items-center gap-1 font-medium text-[11px] ${getTrendColorClass(item.trend)} bg-transparent px-0 py-0`}>
                                {getTrendIcon(item.trend)}
                                {item.trend === 'new' ? 'New' : item.trend === 'stable' ? '0%' : `${item.percentage}%`}
                            </div>
                            <div className="text-right w-12">
                                <div className="text-sm font-bold leading-none">{item.count}</div>
                                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Tickets</div>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
