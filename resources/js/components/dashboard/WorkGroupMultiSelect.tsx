import { ChevronsUpDown } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface WorkGroupMultiSelectProps {
    options: string[];
    value: string[];
    onChange: (groups: string[]) => void;
}

export function WorkGroupMultiSelect({ options, value, onChange }: WorkGroupMultiSelectProps) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [draft, setDraft] = useState(value);
    const matches = options.filter((group) => group.toLowerCase().includes(search.toLowerCase()));

    return (
        <Popover open={open} onOpenChange={(next) => {
            if (next) {
                setDraft(value);
                setSearch('');
            }

            setOpen(next);
        }}>
            <PopoverTrigger asChild>
                <Button variant="outline" aria-label="Work groups" className="h-10 w-full justify-between gap-2 font-normal">
                    <span className="truncate">{value.length === 0 ? 'All work groups' : value.length === 1 ? value[0] : `${value.length} work groups selected`}</span>
                    <ChevronsUpDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-3">
                <Input aria-label="Search work groups" placeholder="Search work groups..." value={search} onChange={(event) => setSearch(event.target.value)} />
                <div className="my-2 max-h-60 overflow-y-auto" role="group" aria-label="Available work groups">
                    {matches.length === 0 ? <p className="p-2 text-sm text-muted-foreground">No work groups found.</p> : matches.map((group, index) => (
                        <label key={group} htmlFor={`${id}-${index}`} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent">
                            <Checkbox id={`${id}-${index}`} checked={draft.includes(group)} onCheckedChange={(checked) => {
                                setDraft((selected) => checked === true ? [...selected, group] : selected.filter((item) => item !== group));
                            }} />
                            <span className="min-w-0 break-words">{group}</span>
                        </label>
                    ))}
                </div>
                <div className="flex items-center justify-between gap-2 border-t pt-3">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDraft([])}>Clear</Button>
                    <Button type="button" size="sm" onClick={() => {
                        onChange(draft);
                        setOpen(false);
                    }}>Apply{draft.length > 0 ? ` (${draft.length})` : ''}</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
