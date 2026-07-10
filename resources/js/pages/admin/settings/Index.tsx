import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Play, Clock, Server, CheckCircle2, Bot, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BRAND_ICON_BOX, BRAND_PAGE_HEADER } from '@/lib/brand';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import axios from 'axios';
import { Progress } from '@/components/ui/progress';

interface SettingItem {
    value: string | number;
    type: string;
    description: string;
}

interface GroupedSettings {
    [group: string]: {
        [key: string]: SettingItem;
    };
}

interface Props {
    grouped_settings: GroupedSettings;
}

export default function SettingsIndex({ grouped_settings }: Props) {
    // Transform settings back to a flat key-value object for the form
    const initialData: Record<string, any> = {};
    Object.keys(grouped_settings).forEach((group) => {
        Object.keys(grouped_settings[group]).forEach((key) => {
            initialData[key] = grouped_settings[group][key].value;
        });
    });

    const { data, setData, post, processing, isDirty } = useForm({
        settings: initialData,
    });

    const [testingCmd, setTestingCmd] = useState<string | null>(null);
    const [activeJobs, setActiveJobs] = useState<{ [key: string]: any }>({});
    const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
    const [activeTab, setActiveTab] = useState<string>(Object.keys(grouped_settings)[0] || 'AI Integrations');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/settings', {
            preserveScroll: true,
        });
    };

    useEffect(() => {
        // Coba lanjutkan polling jika ada proses yang sedang berjalan sebelum refresh
        const keysStr = localStorage.getItem('active_test_cmd_keys');
        if (keysStr) {
            const keys = JSON.parse(keysStr);
            if (keys && keys.length > 0) {
                startPolling(keys);
            }
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, []);

    const handleTestCommand = (command: string) => {
        setTestingCmd(command);
        
        let key = '';
        if (command.includes('backfill-ai-tickets')) {
            key = 'ops_backfill';
        } else {
            key = command.replace(/[: \-]/g, '_');
        }

        // Initialize state for this specific job
        setActiveJobs(prev => ({
            ...prev,
            [key]: { status: 'starting', progress: 0, message: 'Menyiapkan...' }
        }));
        
        router.post('/admin/settings/test', { command }, {
            preserveScroll: true,
            onFinish: () => {
                const keysStr = localStorage.getItem('active_test_cmd_keys');
                let keys = keysStr ? JSON.parse(keysStr) : [];
                if (!keys.includes(key)) {
                    keys.push(key);
                    localStorage.setItem('active_test_cmd_keys', JSON.stringify(keys));
                }
                startPolling(keys);
            },
        });
    };

    const startPolling = (keys: string[]) => {
        if (pollInterval) clearInterval(pollInterval);
        if (!keys || keys.length === 0) return;

        const interval = setInterval(() => {
            axios.get(`/admin/settings/test-status?keys=${keys.join(',')}`)
                .then((res: { data: any }) => {
                    const data = res.data;
                    
                    setActiveJobs(prev => ({
                        ...prev,
                        ...data
                    }));

                    let updatedKeys = [...keys];
                    let shouldUpdateStorage = false;

                    for (const k of keys) {
                        if (data[k] && (data[k].status === 'completed' || data[k].status === 'error')) {
                            // Stop polling this specific key
                            updatedKeys = updatedKeys.filter(uk => uk !== k);
                            shouldUpdateStorage = true;
                        }
                    }

                    if (shouldUpdateStorage) {
                        localStorage.setItem('active_test_cmd_keys', JSON.stringify(updatedKeys));
                        startPolling(updatedKeys);
                    }
                })
                .catch(() => {
                    // Ignore transient errors
                });
        }, 1500);

        setPollInterval(interval);
    };

    return (
        <>
            <Head title="System Configuration" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={BRAND_ICON_BOX}>
                                <SettingsIcon className="h-6 w-6 text-brand-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">System Configuration</CardTitle>
                                <CardDescription>Manage global settings, SLAs, and schedules.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="mb-4">
                                    {Object.keys(grouped_settings).map((group) => (
                                        <TabsTrigger key={group} value={group}>{group}</TabsTrigger>
                                    ))}
                                </TabsList>

                                {Object.keys(grouped_settings).map((group) => (
                                    <TabsContent key={group} value={group} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {Object.entries(grouped_settings[group]).map(([key, setting]) => (
                                                <div key={key} className="space-y-2">
                                                    <Label htmlFor={key} className="capitalize">
                                                        {key.replace(/_/g, ' ')}
                                                    </Label>
                                                    <Input
                                                        id={key}
                                                        type={setting.type === 'integer' ? 'number' : 'text'}
                                                        value={data.settings[key]}
                                                        onChange={(e) => setData('settings', { ...data.settings, [key]: e.target.value })}
                                                    />
                                                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                                                    {key === 'sync_completed_tickets_cron' && (
                                                        <div className="mt-2 text-xs bg-muted p-2 rounded-md border border-border text-muted-foreground space-y-1">
                                                            <p className="font-semibold">Format Cron (Menit Jam Tanggal Bulan Hari)</p>
                                                            <ul className="list-disc pl-4 space-y-1">
                                                                <li><code>0 6,18 * * *</code> : Setiap jam 06:00 dan 18:00</li>
                                                                <li><code>0 0 * * *</code> : Setiap tengah malam (00:00)</li>
                                                                <li><code>*/30 * * * *</code> : Setiap 30 menit</li>
                                                            </ul>
                                                            <p className="mt-1"><a href="https://crontab.guru" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Pelajari lebih lanjut (crontab.guru)</a></p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Testing Action Buttons inside Scheduler tab */}
                                        {group === 'Scheduler' && (
                                            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
                                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                                    <Server className="h-4 w-4" /> System Tests
                                                </h4>
                                                <div className="flex flex-wrap gap-3">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        disabled={testingCmd === 'ops:send-snapshot morning'}
                                                        onClick={() => handleTestCommand('ops:send-snapshot morning')}
                                                    >
                                                        <Play className="mr-2 h-3 w-3" /> Test Morning WA
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        disabled={testingCmd === 'ops:send-snapshot evening'}
                                                        onClick={() => handleTestCommand('ops:send-snapshot evening')}
                                                    >
                                                        <Play className="mr-2 h-3 w-3" /> Test Evening WA
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        disabled={testingCmd === 'tickets:sync-open'}
                                                        onClick={() => handleTestCommand('tickets:sync-open')}
                                                    >
                                                        <Play className="mr-2 h-3 w-3" /> Test Sync Open Tickets
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        disabled={testingCmd === 'tickets:sync-completed'}
                                                        onClick={() => handleTestCommand('tickets:sync-completed')}
                                                    >
                                                        <Play className="mr-2 h-3 w-3" /> Test Sync Completed Tickets
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        disabled={testingCmd === 'attendance:sync'}
                                                        onClick={() => handleTestCommand('attendance:sync')}
                                                    >
                                                        <Play className="mr-2 h-3 w-3" /> Test Sync Attendance
                                                    </Button>
                                                </div>
                                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs rounded-md border border-blue-100 dark:border-blue-900/50 flex items-start gap-2">
                                                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                                    <p>
                                                        <strong>Catatan:</strong> Tombol tes di atas akan mengirimkan perintah ke sistem antrean (Job Queue). Proses berjalan di latar belakang (asinkron) sehingga Anda bebas berpindah halaman tanpa memutus proses. Hasil eksekusi akan tampil di terminal log di bawah.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Backfill Button inside AI Integrations tab */}
                                        {group === 'AI Integrations' && (
                                            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
                                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                                    <Bot className="h-4 w-4" /> Prediksi AI & Backfill
                                                </h4>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Fitur ini akan mensinkronisasikan dan memprediksi kembali kategori (*cluster/sub-cluster*) pada tiket lama yang belum memiliki kategori AI. Proses ini berjalan secara asinkron di belakang layar.
                                                </p>
                                                <div className="flex gap-3">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        disabled={testingCmd === 'ops:backfill-ai-tickets --force'}
                                                        onClick={() => handleTestCommand('ops:backfill-ai-tickets --force')}
                                                    >
                                                        <Play className="mr-2 h-3 w-3" /> Mulai Backfill AI
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>
                                ))}

                            </Tabs>

                            {/* Tampilan Progress Bar Live (Global untuk semua test) */}
                            {Object.entries(activeJobs).length > 0 && (
                                <div className="mt-6 space-y-4">
                                    {Object.entries(activeJobs).map(([jobKey, jobStatus]) => {
                                        if (!jobStatus || jobStatus.status === 'idle') return null;
                                        return (
                                            <div key={jobKey} className="p-4 bg-background border border-border rounded-md shadow-sm">
                                                <div className="flex justify-between items-center text-sm mb-2">
                                                    <span className="font-semibold text-brand-600 flex items-center gap-2">
                                                        {jobKey.replace(/_/g, ' ').toUpperCase()} 
                                                        — 
                                                        {jobStatus.status === 'completed' ? 'Selesai' : 
                                                         jobStatus.status === 'error' ? 'Gagal' : 'Sedang Berjalan...'}
                                                    </span>
                                                    <span className="text-muted-foreground">{jobStatus.progress ?? 0}%</span>
                                                </div>
                                                <Progress value={jobStatus.progress ?? 0} className="h-2" />
                                                <div className="mt-2 text-xs font-mono bg-muted p-3 rounded-md text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap">
                                                    {'> '} {jobStatus.message || 'Waiting for process to start...'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                                <div className="flex justify-end pt-6 border-t mt-6">
                                    <Button type="submit" disabled={processing || !isDirty}>
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'System Configuration',
        href: '/admin/settings',
    },
];

SettingsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
