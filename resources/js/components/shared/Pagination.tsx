import React from 'react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';

type PaginationLinks = {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
};

type PaginationMeta = {
    current_page: number;
    from: number | null;
    last_page: number;
    links?: { url: string | null; label: string; active: boolean }[];
    path?: string;
    per_page: number;
    to: number | null;
    total: number;
};

type PaginationProps = {
    links: PaginationLinks;
    meta: PaginationMeta;
};

export function Pagination({ links, meta }: PaginationProps) {
    if (meta.last_page <= 1) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <div className="text-sm text-muted-foreground w-full sm:w-auto text-center sm:text-left">
                Menampilkan <span className="font-medium text-foreground">{meta.from || 0}</span> hingga <span className="font-medium text-foreground">{meta.to || 0}</span> dari <span className="font-medium text-foreground">{meta.total}</span> hasil
            </div>
            
            {meta.links && meta.links.length > 3 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto justify-center sm:justify-end">
                    {meta.links.map((link: any, i: number) => (
                        <Button
                            key={i}
                            variant={link.active ? "default" : "outline"}
                            size="sm"
                            disabled={!link.url}
                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
