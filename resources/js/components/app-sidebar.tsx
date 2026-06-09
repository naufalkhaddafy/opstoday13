import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, Users, Building, CalendarClock, CalendarRange, TerminalSquare, Ticket as TicketIcon, Activity } from 'lucide-react';
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
import AttendanceController from '@/actions/App/Http/Controllers/AttendanceController';
import TicketController from '@/actions/App/Http/Controllers/TicketController';
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
    {
        title: 'Attendance Overview',
        href: AttendanceController.index().url,
        icon: CalendarClock,
    },
    {
        title: 'Ticket Overview',
        href: TicketController.index().url,
        icon: TicketIcon,
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
];

const systemLogItems: NavItem[] = [
    {
        title: 'Schedule Logs',
        href: '/admin/schedule-logs',
        icon: TerminalSquare,
    },
    {
        title: 'Activity Logs',
        href: '/admin/activity-logs',
        icon: Activity,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const isSuperAdmin = auth?.user?.role === 'super_admin';
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
                {isSuperAdmin && (
                    <>
                        <NavMain items={managementItems} title="Master Data" />
                        <NavMain items={systemLogItems} title="System Log" />
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
