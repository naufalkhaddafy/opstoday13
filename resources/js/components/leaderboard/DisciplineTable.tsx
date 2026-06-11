import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Clock, AlertTriangle, Timer } from 'lucide-react';
import { LeaderboardEntry } from '@/types/dashboard'; // I will define this interface in dashboard types

export function DisciplineTable({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
    return (
        <Card className="border-border/60 shadow-sm flex flex-col h-full">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Trophy className="h-4 w-4 text-amber-500" /> Discipline Leaderboard
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Rank</th>
                                <th className="px-4 py-3 font-medium">Engineer</th>
                                <th className="px-4 py-3 font-medium text-center">Score</th>
                                <th className="px-4 py-3 font-medium text-right">Overtime</th>
                                <th className="px-4 py-3 font-medium text-right">Late</th>
                                <th className="px-4 py-3 font-medium text-right">Mangkir</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        No attendance data available.
                                    </td>
                                </tr>
                            ) : (
                                leaderboard.map((entry, index) => (
                                    <tr key={entry.user_id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                                        <td className="px-4 py-3 font-bold text-muted-foreground">
                                            {index === 0 ? <span className="text-amber-500">🥇 1</span> : 
                                             index === 1 ? <span className="text-gray-400">🥈 2</span> : 
                                             index === 2 ? <span className="text-amber-700">🥉 3</span> : 
                                             index + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-foreground">{entry.name}</div>
                                            <div className="text-xs text-muted-foreground">{entry.employee_id}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                                ${entry.score >= 90 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                  entry.score >= 70 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                                  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                                {entry.score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                                {entry.total_overtime_minutes > 0 ? (
                                                    <>
                                                        <Timer className="h-3 w-3 text-emerald-500" />
                                                        <span className="text-emerald-600 dark:text-emerald-400">+{entry.total_overtime_minutes}m</span>
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground/50">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-col items-end justify-center text-muted-foreground">
                                                {entry.total_late_minutes > 0 ? (
                                                    <div className="flex items-center gap-1" title={`Net penalized: ${entry.net_penalized_minutes}m`}>
                                                        <Clock className="h-3 w-3 text-amber-500" />
                                                        <span className={entry.net_penalized_minutes === 0 ? "text-emerald-500 line-through opacity-70" : ""}>
                                                            {entry.total_late_minutes}m
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-emerald-500">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                                {entry.mangkir_days > 0 ? (
                                                    <>
                                                        <AlertTriangle className="h-3 w-3 text-rose-500" />
                                                        <span>{entry.mangkir_days}d</span>
                                                    </>
                                                ) : (
                                                    <span className="text-emerald-500">-</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
