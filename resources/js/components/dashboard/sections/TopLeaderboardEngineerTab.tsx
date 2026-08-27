import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Trophy,
    Award,
    Medal,
    Search,
    Calendar,
    User,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Target,
    Layers,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    TrendingUp,
} from 'lucide-react';
import { EngineerSummary, LeaderboardEntry, SharePointInitiativeItem } from '@/types/dashboard';
import { EngineerTrendChart } from '@/components/charts/EngineerTrendChart';
import { DonutChart } from '@/components/dashboard/DonutChart';

interface TopLeaderboardEngineerTabProps {
    engineers?: EngineerSummary[];
    leaderboard?: LeaderboardEntry[];
    initiatives?: SharePointInitiativeItem[];
}

export function TopLeaderboardEngineerTab({
    engineers = [],
    leaderboard = [],
    initiatives = [],
}: TopLeaderboardEngineerTabProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [expandedEngineerId, setExpandedEngineerId] = useState<number | null>(null);

    const getInitiativePeopleStrings = (item: SharePointInitiativeItem): string[] => {
        const results: string[] = [];
        const addVal = (val: any) => {
            if (!val) return;
            if (typeof val === 'string' && val.trim() !== '') {
                results.push(val.trim().toLowerCase());
            } else if (typeof val === 'object') {
                if (Array.isArray(val)) {
                    val.forEach(addVal);
                } else {
                    const name = val.LookupValue ?? val.Email ?? val.Title ?? val.Name ?? val.label;
                    if (typeof name === 'string' && name.trim() !== '') {
                        results.push(name.trim().toLowerCase());
                    }
                }
            }
        };

        addVal(item.pic);
        addVal(item.submitted_by);
        if (item.data && typeof item.data === 'object') {
            const keys = [
                'PIC', 'PIC / Engineer', 'Engineer', 'Assignee', 'AssignedTo', 'Assigned To',
                'SubmittedBy', 'Submitted By', 'Author', 'Owner', 'Lead', 'PICName', 'PIC_Name'
            ];
            keys.forEach((k) => addVal(item.data[k]));
        }
        return results;
    };

    const isInitiativeForEngineer = (init: SharePointInitiativeItem, eng: EngineerSummary): boolean => {
        const people = getInitiativePeopleStrings(init);
        const name = eng.name.toLowerCase();
        const empId = eng.employee_id ? eng.employee_id.toLowerCase() : null;

        const normalize = (s: string) => s.replace(/[^a-z0-9]/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
        const normName = normalize(eng.name);
        const nameWords = normName.split(' ').filter(w => w.length >= 3 && !['dso', 'dco', 'kpc', 'ext', 'it'].includes(w));

        return people.some((p) => {
            const normP = normalize(p);
            if (normP.includes(normName) || normName.includes(normP)) return true;
            if (empId && normP.includes(empId)) return true;

            const pWords = normP.split(' ').filter(w => w.length >= 3 && !['dso', 'dco', 'kpc', 'ext', 'it'].includes(w));
            if (nameWords.length > 0 && pWords.length > 0) {
                const common = nameWords.filter(w => pWords.includes(w));
                if (common.length >= 2 || (nameWords.length === 1 && common.length === 1) || (pWords.length === 1 && common.length === 1)) {
                    return true;
                }
            }
            return false;
        });
    };

    // Combine parameters to rank engineers
    const rankedEngineers = useMemo(() => {
        return engineers.map((eng) => {
            const discipline = leaderboard.find(
                (l) => l.user_id === eng.id || (eng.employee_id && l.employee_id === eng.employee_id)
            );

            // Use backend pre-matched initiatives if available, otherwise match dynamically from JSON data
            const userInitiatives = eng.initiatives && eng.initiatives.length > 0
                ? eng.initiatives
                : initiatives.filter((init) => isInitiativeForEngineer(init, eng));

            const completedTickets = eng.completed_today ?? 0;
            const metResolutionSla = eng.met_resolution_sla ?? 0;
            const totalTickets = eng.total ?? 1;

            // Calculate SLA Compliance based on compliant tickets vs total closed
            const slaPercent = completedTickets > 0 ? Math.round((metResolutionSla / completedTickets) * 100) : 0;
            const disciplineScore = discipline?.score ?? 100;
            const initiativeCount = eng.initiative_count ?? userInitiatives.length;

            // Composite Score formula (40% SLA, 30% Discipline, 20% Volume, 10% Initiatives)
            const compositeScore = Math.min(
                100,
                Math.round(
                    slaPercent * 0.4 +
                    disciplineScore * 0.3 +
                    Math.min(completedTickets * 5, 20) +
                    Math.min(initiativeCount * 5, 10)
                )
            );

            return {
                ...eng,
                slaPercent,
                disciplineScore,
                initiativeCount,
                userInitiatives,
                compositeScore,
            };
        }).sort((a, b) => b.compositeScore - a.compositeScore);
    }, [engineers, leaderboard, initiatives]);

    const getSubmittedByName = (item: SharePointInitiativeItem) => {
        if (item.submitted_by && item.submitted_by.trim() !== '') {
            return item.submitted_by;
        }
        const submitted = item.data?.['SubmittedBy'] ?? item.data?.['Submitted By'];
        if (Array.isArray(submitted) && submitted.length > 0) {
            return submitted.map((s: any) => s?.LookupValue ?? s?.Email ?? s).join(', ');
        }
        if (submitted && typeof submitted === 'object') {
            return (submitted as any).LookupValue ?? (submitted as any).Email ?? 'Unknown';
        }
        if (typeof submitted === 'string' && submitted.trim() !== '') {
            return submitted;
        }
        return item.pic ?? 'Unassigned';
    };

    const getInitiativeStatus = (item: SharePointInitiativeItem) => {
        return (
            item.status ||
            item.data?.['InitiativeStatus'] ||
            item.data?.['Initiative Status'] ||
            item.data?.['ApprovalStatus'] ||
            item.data?.['Approval Status'] ||
            item.data?.['Status'] ||
            null
        );
    };

    const getInitiativeImpact = (item: SharePointInitiativeItem) => {
        return (
            item.impact_level ||
            item.data?.['ImpactLevel'] ||
            item.data?.['Impact Level'] ||
            item.data?.['Impact'] ||
            item.data?.['Priority'] ||
            item.data?.['StrategicImpact'] ||
            item.data?.['Strategic Impact'] ||
            null
        );
    };

    const getInitiativeTimeline = (item: SharePointInitiativeItem) => {
        return (
            item.target_timeline ||
            item.data?.['TargetTimeline'] ||
            item.data?.['Target Timeline'] ||
            item.data?.['Timeline'] ||
            item.data?.['DueDate'] ||
            item.data?.['Due Date'] ||
            null
        );
    };

    // Filter initiatives
    const filteredInitiatives = useMemo(() => {
        if (!searchQuery.trim()) return initiatives;
        const q = searchQuery.toLowerCase();
        return initiatives.filter((item) => {
            const title = item.title?.toLowerCase() ?? '';
            const submitted = getSubmittedByName(item).toLowerCase();
            const status = (getInitiativeStatus(item) ?? '').toLowerCase();
            const impact = (getInitiativeImpact(item) ?? '').toLowerCase();
            return title.includes(q) || submitted.includes(q) || status.includes(q) || impact.includes(q);
        });
    }, [initiatives, searchQuery]);

    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredInitiatives.length / ITEMS_PER_PAGE));
    const paginatedInitiatives = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredInitiatives.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredInitiatives, currentPage]);

    const getMedalIcon = (index: number) => {
        switch (index) {
            case 0:
                return <Trophy className="h-5 w-5 text-amber-500 fill-amber-500/20" />;
            case 1:
                return <Award className="h-5 w-5 text-slate-400 fill-slate-400/20" />;
            case 2:
                return <Medal className="h-5 w-5 text-amber-700 fill-amber-700/20" />;
            default:
                return (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {index + 1}
                    </span>
                );
        }
    };

    const getStatusBadge = (status: string | null) => {
        if (!status) return <Badge variant="outline">Unknown</Badge>;
        const s = status.toLowerCase();
        if (s.includes('complete') || s.includes('done') || s.includes('approved')) {
            return (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {status}
                </Badge>
            );
        }
        if (s.includes('progress') || s.includes('ongoing')) {
            return (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                    {status}
                </Badge>
            );
        }
        if (s.includes('hold') || s.includes('delay') || s.includes('pending')) {
            return (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                    {status}
                </Badge>
            );
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    const getImpactBadge = (impact: string | null) => {
        if (!impact) {
            return (
                <Badge variant="outline" className="border-slate-200 text-muted-foreground bg-muted/20 font-normal">
                    Normal
                </Badge>
            );
        }
        const i = impact.toLowerCase();
        if (i.includes('high') || i.includes('critical')) {
            return (
                <Badge variant="outline" className="border-rose-300 text-rose-600 bg-rose-50 dark:bg-rose-950/30">
                    🔥 High Impact
                </Badge>
            );
        }
        if (i.includes('medium')) {
            return (
                <Badge variant="outline" className="border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
                    ⚡ Medium Impact
                </Badge>
            );
        }
        if (i.includes('low')) {
            return (
                <Badge variant="outline" className="border-slate-300 text-slate-600 bg-slate-50 dark:bg-slate-900/30">
                    🍃 Low Impact
                </Badge>
            );
        }
        return <Badge variant="outline">{impact}</Badge>;
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Standard Section Header */}
            <section className="flex flex-col gap-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Trophy className="h-5 w-5 text-[#2E7D32]" /> Top Leaderboard Engineer
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 -mt-2 mb-2">
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                            Executive ranking evaluated across Compliance, Ticket Solved Volume, Attendance Discipline, and Strategic SharePoint Initiatives.
                        </p>
                    </div>
                </div>

                {/* Dashboard Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-border/60 shadow-sm md:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Active Engineers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DonutChart 
                                segments={[{ label: 'Active', value: rankedEngineers.length, color: '#2E7D32' }]} 
                                centerLabel="Engineers" 
                                centerValue={rankedEngineers.length} 
                                size="sm" 
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm md:col-span-3">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Podium (Top 3 Engineers)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                            {rankedEngineers.slice(0, 3).map((eng, idx) => (
                                <div key={eng.id} className="flex items-center gap-3 bg-muted/20 hover:bg-muted/40 transition-colors rounded-xl p-3 flex-1 border w-full">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm shadow-sm ${
                                        idx === 0 ? 'bg-[#FDD835] text-amber-900' :
                                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                                        'bg-amber-600/20 text-amber-900 dark:text-amber-500'
                                    }`}>
                                        #{idx + 1}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-semibold text-sm text-foreground truncate" title={eng.name}>{eng.name}</p>
                                        <p className="text-xs text-muted-foreground font-medium mt-0.5">Score: {eng.compositeScore.toFixed(1)}</p>
                                    </div>
                                </div>
                            ))}
                            {rankedEngineers.length === 0 && (
                                <div className="text-sm text-muted-foreground w-full text-center py-4">No data available</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Engineer Multi-Parameter Leaderboard Table */}
            <Card className="shadow-sm border">
                <CardHeader className="border-b bg-muted/20 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold">Top Engineer Leaderboard</CardTitle>
                            <CardDescription className="text-xs">
                                Composite scores combining Ticket Compliance %, Attendance Discipline, and SharePoint Milestones
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/40 border-b text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium text-center w-16">Rank</th>
                                <th className="px-4 py-3 font-medium">Engineer Name</th>
                                <th className="px-4 py-3 font-medium text-center">Compliance Tickets</th>
                                <th className="px-4 py-3 font-medium text-center">Tickets Solved</th>
                                <th className="px-4 py-3 font-medium text-center">Attendance Discipline</th>
                                <th className="px-4 py-3 font-medium text-center">SharePoint Initiatives</th>
                                <th className="px-4 py-3 font-medium text-right">Composite Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rankedEngineers.length > 0 ? (
                                rankedEngineers.map((eng, idx) => (
                                    <React.Fragment key={eng.id}>
                                        <tr
                                            className={`hover:bg-muted/30 transition-colors cursor-pointer ${idx === 0 ? 'bg-amber-50/50 dark:bg-amber-950/20 font-medium' : ''
                                                }`}
                                            onClick={() => setExpandedEngineerId(expandedEngineerId === eng.id ? null : eng.id)}
                                        >
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center">{getMedalIcon(idx)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950 dark:text-emerald-300">
                                                        {eng.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{eng.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {eng.employee_id ?? 'No ID'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        eng.slaPercent >= 90
                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : eng.slaPercent >= 70
                                                                ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                                : 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                                    }
                                                >
                                                    {eng.slaPercent}%
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium">
                                                {eng.completed_today} / {eng.total}
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium">
                                                {eng.disciplineScore} pt
                                            </td>
                                            <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2.5 rounded-full bg-muted/60 hover:bg-muted font-semibold text-xs inline-flex items-center gap-1.5"
                                                    onClick={() => setExpandedEngineerId(expandedEngineerId === eng.id ? null : eng.id)}
                                                >
                                                    <Layers className="h-3.5 w-3.5 text-[#2E7D32]" />
                                                    {eng.initiativeCount} active
                                                    {eng.initiativeCount > 0 && (
                                                        expandedEngineerId === eng.id ? (
                                                            <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
                                                        ) : (
                                                            <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                                                        )
                                                    )}
                                                </Button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-bold text-[#2E7D32] dark:text-emerald-400">
                                                    {eng.compositeScore}
                                                </span>
                                                <span className="text-xs text-muted-foreground"> / 100</span>
                                            </td>
                                        </tr>

                                        {/* Expanded Initiatives and Trend Row */}
                                        {expandedEngineerId === eng.id && (
                                            <tr className="bg-muted/15 border-b">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                                                        {/* Ticket Trend Chart */}
                                                        <div className="xl:col-span-1">
                                                            <EngineerTrendChart data={eng.monthly_trend} engineerName={eng.name} />
                                                        </div>

                                                        {/* SharePoint Initiatives */}
                                                        <div className="xl:col-span-2 rounded-xl border bg-card p-4 shadow-sm">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                                    <Layers className="h-4 w-4 text-[#2E7D32]" />
                                                                    SharePoint Initiatives Assigned to {eng.name} ({eng.userInitiatives.length})
                                                                </h4>
                                                            </div>
                                                            {eng.userInitiatives.length > 0 ? (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {eng.userInitiatives.map((initItem: any) => (
                                                                        <div
                                                                            key={initItem.id}
                                                                            className="rounded-lg border bg-background p-3 text-xs flex flex-col justify-between gap-2 shadow-2xs hover:border-[#2E7D32]/50 transition-colors"
                                                                        >
                                                                            <div>
                                                                                <div className="font-semibold text-foreground text-sm line-clamp-2">
                                                                                    {initItem.title ?? 'Untitled Initiative'}
                                                                                </div>
                                                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                                    {getStatusBadge(getInitiativeStatus(initItem))}
                                                                                    {getImpactBadge(getInitiativeImpact(initItem))}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-[11px] text-muted-foreground border-t pt-2 mt-1 flex items-center justify-between">
                                                                                <span>PIC: {initItem.pic ?? eng.name}</span>
                                                                                <span>{initItem.target_timeline ?? 'No deadline'}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-muted-foreground italic">
                                                                    No active initiatives found for {eng.name}.
                                                                </p>
                                                            )}
                                                        </div>

                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        No engineer data available for this date range.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* SharePoint Initiatives & Milestones Showcase */}
            <Card className="shadow-sm border">
                <CardHeader className="border-b bg-muted/20 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Layers className="h-5 w-5 text-[#2E7D32]" />
                                Initiative Milestones
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Real-time operational initiatives synchronized from Microsoft SharePoint List
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by title, PIC, status..."
                                className="pl-8 text-xs h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <th className="px-4 py-3.5 w-12 text-center">No</th>
                                    <th className="px-4 py-3.5 min-w-[240px]">Initiative Title & Type</th>
                                    <th className="px-4 py-3.5">Target Timeline</th>
                                    <th className="px-4 py-3.5">Submitted By</th>
                                    <th className="px-4 py-3.5">Impact Level</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {paginatedInitiatives.length > 0 ? (
                                    paginatedInitiatives.map((item, index) => {
                                        const isExpanded = expandedId === item.id;
                                        const rowNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr className="hover:bg-muted/40 transition-colors">
                                                    <td className="px-4 py-3.5 text-center font-medium text-muted-foreground">
                                                        {rowNumber}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-semibold text-foreground text-sm leading-snug">
                                                            {item.title ?? 'Untitled Initiative'}
                                                        </div>
                                                        {item.data['InitiativeType'] && (
                                                            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                                                {Array.isArray(item.data['InitiativeType'])
                                                                    ? item.data['InitiativeType'].join(' • ')
                                                                    : String(item.data['InitiativeType'])}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 font-medium text-foreground text-sm">
                                                        {getInitiativeTimeline(item) || '-'}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="inline-flex items-center gap-1.5 font-medium text-xs text-foreground bg-muted/50 px-2 py-1 rounded-md">
                                                            <User className="h-3.5 w-3.5 text-[#2E7D32]" />
                                                            {getSubmittedByName(item)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {getImpactBadge(getInitiativeImpact(item))}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {getStatusBadge(getInitiativeStatus(item))}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs flex items-center gap-1 ml-auto"
                                                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    Hide <ChevronUp className="h-3.5 w-3.5" />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Details <ChevronDown className="h-3.5 w-3.5" />
                                                                </>
                                                            )}
                                                        </Button>
                                                    </td>
                                                </tr>

                                                {/* Expanded JSON details drawer row */}
                                                {isExpanded && (
                                                    <tr className="bg-muted/15 border-b">
                                                        <td colSpan={7} className="px-6 py-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                                {(item.data['ExpectedResult'] || item.data['Expected Result']) && (
                                                                    <div className="bg-card p-3 rounded-lg border shadow-sm">
                                                                        <span className="font-semibold text-foreground block mb-1">
                                                                            Expected Result
                                                                        </span>
                                                                        <p className="text-muted-foreground whitespace-pre-wrap break-words">
                                                                            {item.data['ExpectedResult'] || item.data['Expected Result']}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {(item.data['ActionNeeded'] || item.data['Action Needed']) && (
                                                                    <div className="bg-card p-3 rounded-lg border shadow-sm">
                                                                        <span className="font-semibold text-foreground block mb-1">
                                                                            Action Needed
                                                                        </span>
                                                                        <p className="text-muted-foreground whitespace-pre-wrap break-words">
                                                                            {item.data['ActionNeeded'] || item.data['Action Needed']}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {(item.data['PainPoints'] || item.data['Pain Points']) && (
                                                                    <div className="bg-card p-3 rounded-lg border shadow-sm">
                                                                        <span className="font-semibold text-foreground block mb-1">
                                                                            Pain Points
                                                                        </span>
                                                                        <p className="text-muted-foreground whitespace-pre-wrap break-words">
                                                                            {item.data['PainPoints'] || item.data['Pain Points']}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {item.data['Comments'] && (
                                                                    <div className="bg-card p-3 rounded-lg border shadow-sm">
                                                                        <span className="font-semibold text-foreground block mb-1">
                                                                            Comments
                                                                        </span>
                                                                        <p className="text-muted-foreground whitespace-pre-wrap break-words">
                                                                            {item.data['Comments']}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {(item.data['InitiativeType'] || item.data['Initiative Type'] || item.data['Initiative_Type']) && (
                                                                    <div className="bg-card p-3 rounded-lg border shadow-sm">
                                                                        <span className="font-semibold text-foreground block mb-1">
                                                                            Initiative Type
                                                                        </span>
                                                                        <div className="text-muted-foreground flex flex-wrap gap-1">
                                                                            {(Array.isArray(item.data['InitiativeType'] || item.data['Initiative Type'] || item.data['Initiative_Type'])
                                                                                ? (item.data['InitiativeType'] || item.data['Initiative Type'] || item.data['Initiative_Type'])
                                                                                : [item.data['InitiativeType'] || item.data['Initiative Type'] || item.data['Initiative_Type']]).map((type: string, idx: number) => (
                                                                                    <span key={idx} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px]">
                                                                                        {type}
                                                                                    </span>
                                                                                ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                                                                <span>SharePoint Item ID: #{item.sharepoint_item_id}</span>
                                                                <span>Last Synced: {item.last_synced_at ?? 'Just now'}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center">
                                                <Layers className="h-10 w-10 opacity-20 mb-3 text-[#2E7D32]" />
                                                <p className="text-sm font-medium">No SharePoint initiatives available</p>
                                                <p className="text-xs text-muted-foreground/80 mt-1">
                                                    Try running the SharePoint sync artisan command or adjusting your search query.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    {filteredInitiatives.length > 0 && (
                        <div className="flex items-center justify-between border-t px-6 py-3 bg-muted/10 text-xs text-muted-foreground">
                            <div>
                                Showing{' '}
                                <span className="font-medium text-foreground">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium text-foreground">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredInitiatives.length)}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium text-foreground">
                                    {filteredInitiatives.length}
                                </span>{' '}
                                initiatives
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                                </Button>
                                <span className="font-medium text-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
