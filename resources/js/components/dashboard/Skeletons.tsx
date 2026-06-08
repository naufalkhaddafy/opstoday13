import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function StatCardSkeleton() {
    return (
        <Card className="overflow-hidden border-border/60 shadow-sm animate-pulse">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="h-3 w-20 rounded bg-muted"></div>
                    <div className="h-8 w-8 rounded-lg bg-muted"></div>
                </div>
                <div className="mt-3 h-8 w-16 rounded bg-muted"></div>
                <div className="mt-2 h-2 w-24 rounded bg-muted"></div>
            </CardContent>
        </Card>
    );
}

export function EngineerCardSkeleton() {
    return (
        <Card className="border-border/60 shadow-sm animate-pulse">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-muted"></div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="space-y-2">
                                <div className="h-4 w-32 rounded bg-muted"></div>
                                <div className="h-3 w-20 rounded bg-muted"></div>
                            </div>
                            <div className="h-5 w-16 rounded-full bg-muted"></div>
                        </div>
                        <div className="mt-2 flex gap-2">
                            <div className="h-3 w-24 rounded bg-muted"></div>
                            <div className="h-3 w-16 rounded bg-muted"></div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 border-t pt-3">
                    <div className="mb-2 flex justify-between">
                        <div className="h-3 w-24 rounded bg-muted"></div>
                        <div className="h-4 w-8 rounded bg-muted"></div>
                    </div>
                    <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="h-3 w-20 rounded bg-muted"></div>
                                <div className="h-2 flex-1 rounded-full bg-muted"></div>
                                <div className="h-3 w-5 rounded bg-muted"></div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                        <div className="h-12 rounded-lg bg-muted"></div>
                        <div className="h-12 rounded-lg bg-muted"></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function TableSkeleton() {
    return (
        <Card className="border-border/60 shadow-sm animate-pulse">
            <CardContent className="p-0">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/40 text-left">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <th key={i} className="px-4 py-3">
                                    <div className="h-3 w-16 rounded bg-muted"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4].map((i) => (
                            <tr key={i} className="border-b last:border-0">
                                <td className="px-4 py-3">
                                    <div className="mb-1 h-3 w-24 rounded bg-muted"></div>
                                    <div className="h-4 w-32 rounded bg-muted"></div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="h-3 w-20 rounded bg-muted"></div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="h-3 w-24 rounded bg-muted"></div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="h-5 w-20 rounded-full bg-muted"></div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="h-3 w-16 rounded bg-muted"></div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="h-3 w-16 rounded bg-muted"></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}
