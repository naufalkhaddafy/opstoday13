import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { IssueTrendItem } from '@/types/dashboard';

interface IssueTrendPanelProps {
    trends: IssueTrendItem[];
    dateFrom: string;
    dateTo: string;
    className?: string;
}

export function IssueTrendPanel({ trends, dateFrom, dateTo, className = '' }: IssueTrendPanelProps) {
    if (!trends || trends.length === 0) {
        return (
            <Card className={`h-full flex flex-col ${className}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Top Issue Trends
                    </CardTitle>
                    <CardDescription>
                        Tren masalah terbanyak berdasarkan periode pencarian
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                    Belum ada data topik spesifik di periode ini.
                </CardContent>
            </Card>
        );
    }

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4 text-red-500" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-emerald-500" />;
            case 'stable':
                return <Minus className="w-4 h-4 text-slate-500" />;
            case 'new':
                return <Sparkles className="w-4 h-4 text-amber-500" />;
            default:
                return null;
        }
    };

    const getTrendText = (item: IssueTrendItem) => {
        if (item.trend === 'new') return 'Topik baru di periode ini';
        if (item.trend === 'stable') return 'Tidak ada perubahan';
        
        const direction = item.trend === 'up' ? 'Naik' : 'Turun';
        return `${direction} ${item.percentage}% dari periode sebelumnya`;
    };

    const getTrendColorClass = (trend: string) => {
        switch (trend) {
            case 'up': return 'text-red-600 bg-red-50';
            case 'down': return 'text-emerald-600 bg-emerald-50';
            case 'stable': return 'text-slate-600 bg-slate-50';
            case 'new': return 'text-amber-600 bg-amber-50';
            default: return '';
        }
    }

    return (
        <Card className={`h-full flex flex-col ${className}`}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Top Issue Trends
                </CardTitle>
                <CardDescription className="text-xs">
                    Top 5 most frequent topics
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                {trends.map((item, index) => (
                    <div key={index} className="flex items-start justify-between px-3 py-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-start gap-2.5">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0 mt-0.5">
                                {index + 1}
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm leading-none mb-1">{item.phrase}</h4>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium text-[10px] ${getTrendColorClass(item.trend)}`}>
                                        {getTrendIcon(item.trend)}
                                        {getTrendText(item)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right shrink-0 ml-3 mt-0.5">
                            <div className="text-base font-bold leading-none">{item.count}</div>
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Tiket</div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
