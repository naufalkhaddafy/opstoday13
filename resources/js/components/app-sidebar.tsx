import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, Users, Building, CalendarClock, CalendarRange, TerminalSquare } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import CompanyController from '@/actions/App/Http/Controllers/Admin/CompanyController';
import ShiftController from '@/actions/App/Http/Controllers/Admin/ShiftController';
import RosterController from '@/actions/App/Http/Controllers/Admin/RosterController';
import GroupController from '@/actions/App/Http/Controllers/Admin/GroupController';
import type { NavItem } from '@/types';

const dashboardItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
];

const rosterItems: NavItem[] = [
    {
        title: 'Roster Kerja',
        href: RosterController.index().url,
        icon: CalendarRange,
    },
    {
        title: 'Pengajuan Cuti',
        href: '/leaves',
        icon: CalendarRange,
    },
];

const managementItems: NavItem[] = [
    {
        title: 'Manajemen User',
        href: UserController.index().url,
        icon: Users,
    },
    {
        title: 'Manajemen Perusahaan',
        href: CompanyController.index().url,
        icon: Building,
    },
    {
        title: 'Manajemen Grup',
        href: GroupController.index().url,
        icon: Users,
    },
    {
        title: 'Manajemen Shift',
        href: ShiftController.index().url,
        icon: CalendarClock,
    },
    {
        title: 'Schedule Logs',
        href: '/admin/schedule-logs',
        icon: TerminalSquare,
    },
];


const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={dashboardItems} title="Utama" />
                <NavMain items={rosterItems} title="Operasional" />
                <NavMain items={managementItems} title="Master Data" />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
