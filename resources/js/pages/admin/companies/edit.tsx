import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Plus, Trash2, Shield, Users, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import CompanyController from '@/actions/App/Http/Controllers/Admin/CompanyController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CompanyUser = {
    id: number;
    name: string;
    email: string;
};

type AvailableGroup = {
    id: number;
    name: string;
};

type LeaveApprovalRule = {
    id: string;
    name: string;
    group_ids: number[];
    is_default?: boolean;
    requirement: 'any' | 'all';
    workflow_type: 'parallel' | 'sequential';
    approver_ids: (number | string)[];
};

type CompanyFormProps = {
    company: {
        id: number;
        name: string;
        whatsapp_groups?: string[];
        leave_approval_settings?: {
            rules: LeaveApprovalRule[];
        };
        users?: CompanyUser[];
    };
    available_groups?: AvailableGroup[];
};

interface GroupSelectorProps {
    availableGroups: AvailableGroup[];
    selectedGroupIds: number[];
    onSelectGroup: (groupId: number) => void;
    onRemoveGroup: (groupId: number) => void;
}

function GroupSelector({
    availableGroups,
    selectedGroupIds,
    onSelectGroup,
    onRemoveGroup,
}: GroupSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedGroups = selectedGroupIds.map((id) => {
        const found = availableGroups.find((g) => g.id === id);

        return found || { id, name: `Grup #${id}` };
    });

    const unselectedGroups = availableGroups.filter(
        (g) => !selectedGroupIds.includes(g.id) && g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-2.5" ref={containerRef}>
            {/* Selected Badges */}
            {selectedGroups.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedGroups.map((g) => (
                        <span
                            key={g.id}
                            className="inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-900 shadow-xs transition-colors"
                        >
                            <span>{g.name}</span>
                            <button
                                type="button"
                                onClick={() => onRemoveGroup(g.id)}
                                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-brand-600 hover:bg-brand-200/60 hover:text-brand-900 focus:outline-none cursor-pointer"
                                title={`Hapus ${g.name}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Searchable Select Input */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder={
                            selectedGroups.length === 0
                                ? 'Cari dan pilih grup...'
                                : 'Tambah grup lain...'
                        }
                        className="pl-8 text-sm"
                    />
                </div>

                {isOpen && (
                    <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-52 overflow-y-auto p-1 text-sm">
                        {availableGroups.length === 0 ? (
                            <div className="p-3 text-xs text-muted-foreground text-center">
                                Belum ada grup yang tersedia di sistem.
                            </div>
                        ) : unselectedGroups.length === 0 ? (
                            <div className="p-3 text-xs text-muted-foreground text-center">
                                {selectedGroups.length === availableGroups.length
                                    ? 'Semua grup telah dipilih.'
                                    : 'Tidak ada grup yang sesuai dengan pencarian.'}
                            </div>
                        ) : (
                            unselectedGroups.map((g) => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectGroup(g.id);
                                        setSearchQuery('');
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between cursor-pointer transition-colors"
                                >
                                    <span className="font-medium">{g.name}</span>
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Plus className="h-3 w-3" /> Pilih
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {selectedGroups.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                    Belum ada grup yang dipilih untuk aturan ini.
                </p>
            )}
        </div>
    );
}

export default function CompanyEdit({ company, available_groups = [] }: CompanyFormProps) {
    const rawRules = company.leave_approval_settings?.rules;
    const initialRules: LeaveApprovalRule[] = Array.isArray(rawRules) && rawRules.length > 0
        ? rawRules
        : [
            {
                id: 'rule_default',
                name: 'Aturan Default',
                group_ids: [],
                is_default: true,
                requirement: 'any',
                workflow_type: 'parallel',
                approver_ids: [],
            },
        ];

    const { data, setData, put, processing, errors } = useForm({
        name: company.name,
        whatsapp_groups: company.whatsapp_groups || ([] as string[]),
        leave_approval_settings: {
            rules: initialRules,
        },
    });

    const [expandedRuleIds, setExpandedRuleIds] = useState<Record<string, boolean>>({});

    const toggleRuleExpand = (ruleId: string) => {
        setExpandedRuleIds((prev) => ({
            ...prev,
            [ruleId]: !prev[ruleId],
        }));
    };

    const addGroup = () => {
        setData('whatsapp_groups', [...data.whatsapp_groups, '']);
    };

    const removeGroup = (index: number) => {
        setData('whatsapp_groups', data.whatsapp_groups.filter((_, i) => i !== index));
    };

    const updateGroup = (index: number, val: string) => {
        const newArr = [...data.whatsapp_groups];
        newArr[index] = val;
        setData('whatsapp_groups', newArr);
    };

    const addRule = () => {
        const newRuleId = 'rule_' + Date.now() + Math.random().toString(36).substring(2, 6);
        const newRule: LeaveApprovalRule = {
            id: newRuleId,
            name: `Aturan Khusus ${data.leave_approval_settings.rules.length + 1}`,
            group_ids: [],
            is_default: false,
            requirement: 'any',
            workflow_type: 'parallel',
            approver_ids: [],
        };
        setData('leave_approval_settings', {
            rules: [...data.leave_approval_settings.rules, newRule],
        });
        setExpandedRuleIds((prev) => ({
            ...prev,
            [newRuleId]: true,
        }));
    };

    const removeRule = (ruleIndex: number) => {
        if (data.leave_approval_settings.rules.length <= 1) {
            return;
        }

        const ruleToRemove = data.leave_approval_settings.rules[ruleIndex];
        const filtered = data.leave_approval_settings.rules.filter((_, i) => i !== ruleIndex);
        setData('leave_approval_settings', {
            rules: filtered,
        });

        if (ruleToRemove) {
            setExpandedRuleIds((prev) => {
                const next = { ...prev };
                delete next[ruleToRemove.id];

                return next;
            });
        }
    };

    const updateRule = (ruleIndex: number, fields: Partial<LeaveApprovalRule>) => {
        const updated = [...data.leave_approval_settings.rules];
        updated[ruleIndex] = { ...updated[ruleIndex], ...fields };
        setData('leave_approval_settings', {
            rules: updated,
        });
    };

    const addGroupToRule = (ruleIndex: number, groupId: number) => {
        const currentRule = data.leave_approval_settings.rules[ruleIndex];
        const currentGroupIds = currentRule.group_ids || [];

        if (!currentGroupIds.includes(groupId)) {
            updateRule(ruleIndex, { group_ids: [...currentGroupIds, groupId] });
        }
    };

    const removeGroupFromRule = (ruleIndex: number, groupId: number) => {
        const currentRule = data.leave_approval_settings.rules[ruleIndex];
        const currentGroupIds = currentRule.group_ids || [];
        updateRule(ruleIndex, { group_ids: currentGroupIds.filter((id) => id !== groupId) });
    };

    const addApproverToRule = (ruleIndex: number) => {
        const currentRule = data.leave_approval_settings.rules[ruleIndex];
        const newApprovers = [...currentRule.approver_ids, ''];
        updateRule(ruleIndex, { approver_ids: newApprovers });
    };

    const removeApproverFromRule = (ruleIndex: number, approverIndex: number) => {
        const currentRule = data.leave_approval_settings.rules[ruleIndex];
        const newApprovers = currentRule.approver_ids.filter((_, i) => i !== approverIndex);
        updateRule(ruleIndex, { approver_ids: newApprovers });
    };

    const updateApproverInRule = (ruleIndex: number, approverIndex: number, val: string) => {
        const currentRule = data.leave_approval_settings.rules[ruleIndex];
        const newApprovers = [...currentRule.approver_ids];
        newApprovers[approverIndex] = parseInt(val) || '';
        updateRule(ruleIndex, { approver_ids: newApprovers });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(CompanyController.update({ company: company.id }).url);
    };

    return (
        <>
            <Head title={`Edit Perusahaan: ${company.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle>Edit Data Perusahaan</CardTitle>
                            <CardDescription>Ubah detail untuk cabang atau pusat operasional.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={CompanyController.index().url}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-4 max-w-lg">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Perusahaan <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                    <p className="text-xs text-muted-foreground pt-1">
                                        Perhatian: Jika Anda mengubah nama perusahaan, URL slug untuk cabang ini juga akan berubah secara otomatis.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Daftar WhatsApp Grup (Opsional)</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
                                            <Plus className="mr-2 h-4 w-4" /> Tambah Grup
                                        </Button>
                                    </div>

                                    {data.whatsapp_groups.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic">Belum ada grup yang ditambahkan.</p>
                                    )}

                                    {data.whatsapp_groups.map((group, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    value={group}
                                                    onChange={(e) => updateGroup(index, e.target.value)}
                                                    placeholder="Misal: 628123456789-123456"
                                                />
                                                <InputError message={errors[`whatsapp_groups.${index}`]} className="mt-1" />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeGroup(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {/* General array error */}
                                    {errors.whatsapp_groups && typeof errors.whatsapp_groups === 'string' && (
                                        <InputError message={errors.whatsapp_groups} />
                                    )}
                                </div>
                                
                                {/* Multi-Rule Leave Approval Settings */}
                                <div className="space-y-4 pt-6 border-t">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-lg font-medium flex items-center gap-2">
                                                <Shield className="h-5 w-5 text-brand-600" />
                                                Aturan Persetujuan Cuti
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Buat aturan persetujuan dan tentukan grup kerja mana saja yang menerapkan aturan tersebut.
                                            </p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addRule}>
                                            <Plus className="mr-2 h-4 w-4" /> Tambah Aturan Baru
                                        </Button>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        {data.leave_approval_settings.rules.map((rule, ruleIndex) => {
                                            const isOnlyOne = data.leave_approval_settings.rules.length === 1;
                                            const isExpanded = !!expandedRuleIds[rule.id];

                                            return (
                                                <div
                                                    key={rule.id}
                                                    className="rounded-lg border bg-card shadow-xs transition-all overflow-hidden"
                                                >
                                                    {/* Collapsible Rule Header */}
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => toggleRuleExpand(rule.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                toggleRuleExpand(rule.id);
                                                            }
                                                        }}
                                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                                                    >
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800 text-xs font-semibold">
                                                                {ruleIndex + 1}
                                                            </span>
                                                            <span className="font-semibold text-sm text-foreground">
                                                                {rule.name || `Aturan ${ruleIndex + 1}`}
                                                            </span>

                                                            {/* Status Badges */}
                                                            {rule.is_default && (
                                                                <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                                                    DEFAULT
                                                                </span>
                                                            )}

                                                            <span
                                                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                                                                    rule.requirement === 'any'
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                                }`}
                                                            >
                                                                {rule.requirement === 'any' ? '1 Approver Cukup' : 'Semua Approver'}
                                                            </span>

                                                            {rule.requirement === 'all' && (
                                                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200">
                                                                    {rule.workflow_type === 'sequential' ? 'Sekuensial' : 'Paralel'}
                                                                </span>
                                                            )}

                                                            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border">
                                                                <Users className="h-3 w-3" />
                                                                {(rule.group_ids || []).length} Grup
                                                            </span>

                                                            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border">
                                                                <Shield className="h-3 w-3" />
                                                                {(rule.approver_ids || []).filter(Boolean).length} PIC
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                                                            {!isOnlyOne && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:bg-destructive/10 h-8 px-2"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeRule(ruleIndex);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-1" /> Hapus
                                                                </Button>
                                                            )}

                                                            <div className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Form Content */}
                                                    {isExpanded && (
                                                        <div className="border-t p-4 space-y-4 bg-card">
                                                            {/* Rule Name & Default checkbox */}
                                                            <div className="grid gap-4 sm:grid-cols-2">
                                                                <div className="space-y-2">
                                                                    <Label>Nama Aturan <span className="text-destructive">*</span></Label>
                                                                    <Input
                                                                        value={rule.name}
                                                                        onChange={(e) => updateRule(ruleIndex, { name: e.target.value })}
                                                                        placeholder="Misal: Aturan Shift DCO / Aturan Default"
                                                                        required
                                                                    />
                                                                </div>

                                                                <div className="space-y-2 flex flex-col justify-end">
                                                                    <label className="flex items-center gap-2 cursor-pointer text-xs rounded-md border p-2.5 bg-muted/20 hover:bg-muted/40">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={rule.is_default || false}
                                                                            onChange={(e) => updateRule(ruleIndex, { is_default: e.target.checked })}
                                                                            className="rounded border-input text-brand-600 focus:ring-brand-500 h-4 w-4"
                                                                        />
                                                                        <span>Jadikan <strong>Aturan Default</strong> (untuk grup lainnya yang tidak spesifik)</span>
                                                                    </label>
                                                                </div>
                                                            </div>

                                                            {/* Assigned Groups */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="flex items-center gap-1.5">
                                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                                        Terapkan ke Grup
                                                                    </Label>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Pilih grup yang menerapkan aturan ini
                                                                    </span>
                                                                </div>

                                                                <GroupSelector
                                                                    availableGroups={available_groups}
                                                                    selectedGroupIds={rule.group_ids || []}
                                                                    onSelectGroup={(groupId) => addGroupToRule(ruleIndex, groupId)}
                                                                    onRemoveGroup={(groupId) => removeGroupFromRule(ruleIndex, groupId)}
                                                                />
                                                            </div>

                                                            {/* Requirement & Workflow Selection */}
                                                            <div className="grid gap-4 sm:grid-cols-2">
                                                                <div className="space-y-2">
                                                                    <Label>Syarat Persetujuan</Label>
                                                                    <select
                                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                                        value={rule.requirement}
                                                                        onChange={(e) => {
                                                                            const newReq = e.target.value as 'any' | 'all';
                                                                            updateRule(ruleIndex, {
                                                                                requirement: newReq,
                                                                                workflow_type: newReq === 'any' ? 'parallel' : rule.workflow_type,
                                                                            });
                                                                        }}
                                                                    >
                                                                        <option value="any">Cukup 1 Approver</option>
                                                                        <option value="all">Harus Semua Approver</option>
                                                                    </select>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {rule.requirement === 'any'
                                                                            ? 'Cuti langsung disetujui begitu salah satu approver dalam daftar menyetujuinya.'
                                                                            : 'Cuti baru disetujui setelah semua approver dalam daftar menyetujuinya.'}
                                                                    </p>
                                                                </div>

                                                                {/* Workflow is ONLY shown when requirement is 'all' */}
                                                                {rule.requirement === 'all' && (
                                                                    <div className="space-y-2">
                                                                        <Label>Tipe Alur (Workflow)</Label>
                                                                        <select
                                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                                            value={rule.workflow_type}
                                                                            onChange={(e) => updateRule(ruleIndex, { workflow_type: e.target.value as 'parallel' | 'sequential' })}
                                                                        >
                                                                            <option value="parallel">Paralel (Semua approver dapat notif bersamaan)</option>
                                                                            <option value="sequential">Sekuensial (Satu per satu secara berurutan)</option>
                                                                        </select>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {rule.workflow_type === 'parallel'
                                                                                ? 'Approver dapat menyetujui kapan saja tanpa perlu menunggu giliran.'
                                                                                : 'Approver dinotifikasi berurutan. Approver berikutnya baru bertindak setelah approver sebelumnya menyetujui.'}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Approvers for this rule */}
                                                            <div className="space-y-3 pt-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label>Daftar Approver (PIC)</Label>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => addApproverToRule(ruleIndex)}
                                                                    >
                                                                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Approver
                                                                    </Button>
                                                                </div>

                                                                {rule.approver_ids.length === 0 ? (
                                                                    <p className="text-xs text-muted-foreground italic rounded-md border p-2 bg-muted/20">
                                                                        Belum ada approver untuk aturan ini. Jika kosong, cuti akan tertahan di status pending.
                                                                    </p>
                                                                ) : (
                                                                    rule.requirement === 'all' && rule.workflow_type === 'sequential' && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Urutan approver menentukan langkah: Approver paling atas = Langkah 1.
                                                                        </p>
                                                                    )
                                                                )}

                                                                <div className="space-y-2">
                                                                    {rule.approver_ids.map((approverId: string | number, approverIndex: number) => (
                                                                        <div key={approverIndex} className="flex items-center gap-2">
                                                                            <span className="text-xs font-semibold text-muted-foreground w-6 text-center">
                                                                                #{approverIndex + 1}
                                                                            </span>
                                                                            <div className="flex-1">
                                                                                <select
                                                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                                                    value={approverId}
                                                                                    onChange={(e) => updateApproverInRule(ruleIndex, approverIndex, e.target.value)}
                                                                                >
                                                                                    <option value="">-- Pilih Engineer / Approver --</option>
                                                                                    {company.users?.map((u) => (
                                                                                        <option key={u.id} value={u.id}>
                                                                                            {u.name} ({u.email})
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="text-destructive hover:bg-destructive/10"
                                                                                onClick={() => removeApproverFromRule(ruleIndex, approverIndex)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t mt-6">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CompanyEdit.layout = {
    breadcrumbs: [
        { title: 'Manajemen Perusahaan', href: CompanyController.index().url },
        { title: 'Edit Perusahaan', href: '#' }
    ],
};
