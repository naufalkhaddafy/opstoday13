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
        <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
                Menampilkan <span className="font-medium text-foreground">{meta.from || 0}</span> hingga <span className="font-medium text-foreground">{meta.to || 0}</span> dari <span className="font-medium text-foreground">{meta.total}</span> hasil
            </div>
            <div className="flex gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!links.prev}
                    onClick={() => links.prev && router.get(links.prev, {}, { preserveState: true, preserveScroll: true })}
                >
                    Sebelumnya
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!links.next}
                    onClick={() => links.next && router.get(links.next, {}, { preserveState: true, preserveScroll: true })}
                >
                    Selanjutnya
                </Button>
            </div>
        </div>
    );
}
