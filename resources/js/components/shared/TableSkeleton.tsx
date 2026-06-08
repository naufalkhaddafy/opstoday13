import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function TableSkeleton({ columns = 6, rows = 5 }: { columns?: number, rows?: number }) {
    return (
        <Card className="border-border/60 shadow-sm animate-pulse">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40 text-left">
                                {Array.from({ length: columns }).map((_, i) => (
                                    <th key={i} className="px-4 py-3">
                                        <div className="h-3 w-16 rounded bg-muted"></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: rows }).map((_, i) => (
                                <tr key={i} className="border-b last:border-0">
                                    {Array.from({ length: columns }).map((_, j) => (
                                        <td key={j} className="px-4 py-4">
                                            {j === 0 ? (
                                                <>
                                                    <div className="mb-2 h-3 w-24 rounded bg-muted"></div>
                                                    <div className="h-4 w-32 rounded bg-muted"></div>
                                                </>
                                            ) : (
                                                <div className={`h-3 rounded bg-muted ${j % 2 === 0 ? 'w-20' : 'w-24'}`}></div>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

export function TableRowSkeleton({ columns = 6, rows = 5 }: { columns?: number, rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b last:border-0 animate-pulse">
                    {Array.from({ length: columns }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                            {j === 0 ? (
                                <>
                                    <div className="mb-2 h-3 w-24 rounded bg-muted"></div>
                                    <div className="h-4 w-32 rounded bg-muted"></div>
                                </>
                            ) : (
                                <div className={`h-3 rounded bg-muted ${j % 2 === 0 ? 'w-20' : 'w-24'}`}></div>
                            )}
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
