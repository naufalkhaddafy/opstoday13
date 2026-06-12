import { BRAND_LOGO_SRC } from '@/lib/brand';
import { Link, usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export default function AppLogo({ version }: { version?: string }) {
    const { changelog_data } = usePage().props as any;

    return (
        <div className="flex items-center gap-2 w-full">
            <Link href={dashboard().url} className="flex aspect-square size-8 items-center justify-center rounded-md bg-white shadow-sm border p-1 shrink-0 hover:opacity-80 transition-opacity">
                <img src={BRAND_LOGO_SRC} alt="B-Hero" className="size-full object-contain" />
            </Link>
            <div className="flex flex-col flex-1 text-left group-data-[collapsible=icon]:hidden">
                <Link href={dashboard().url} className="truncate leading-tight font-bold text-lg text-foreground hover:text-foreground/80 transition-colors">
                    B-Hero
                </Link>
                {version && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <button className="text-left w-fit truncate text-[10px] font-mono text-muted-foreground uppercase leading-none mt-0.5 hover:text-foreground transition-colors cursor-pointer">
                                {version}
                            </button>
                        </DialogTrigger>
                        <DialogContent 
                            className="sm:max-w-md md:max-w-lg lg:max-w-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DialogHeader>
                                <DialogTitle>Release Notes</DialogTitle>
                                <DialogDescription>
                                    Jejak pembaruan sistem dan penambahan fitur.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[60vh] overflow-y-auto pr-2">
                                {changelog_data && changelog_data.length > 0 ? (
                                    changelog_data.map((log: any, index: number) => (
                                        <Collapsible key={log.version} defaultOpen={index === 0} className="mb-4 border-b pb-4 last:border-0 group/collapsible">
                                            <CollapsibleTrigger className="flex items-center justify-between w-full text-left font-semibold text-foreground hover:underline mb-2 cursor-pointer">
                                                <span>
                                                    {log.version} <span className="text-muted-foreground font-normal text-xs ml-2">({log.date})</span>
                                                </span>
                                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="space-y-4 text-sm text-muted-foreground mt-3">
                                                    {Object.entries(log.categories).map(([category, items]: [string, any]) => {
                                                        let emoji = '🚀';
                                                        if (category === 'Changed') emoji = '⚡';
                                                        if (category === 'Fixed') emoji = '🐛';
                                                        if (category === 'Removed' || category === 'Deprecated') emoji = '🗑️';
                                                        
                                                        return (
                                                            <div key={category}>
                                                                <h4 className="font-semibold text-foreground mb-1">{emoji} {category}</h4>
                                                                <ul className="list-disc pl-5 space-y-1">
                                                                    {items.map((item: string, i: number) => (
                                                                        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Tidak ada catatan rilis yang tersedia.</p>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}
