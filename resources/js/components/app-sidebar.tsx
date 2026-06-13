import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, Users, Building, CalendarClock, CalendarRange, TerminalSquare, Ticket as TicketIcon, Activity, ArrowLeft } from 'lucide-react';
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
import VerificationController from '@/actions/App/Http/Controllers/Admin/VerificationController';
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
        title: 'Work Roster',
        href: RosterController.index().url,
        icon: CalendarRange,
    },
    {
        title: 'Leave Requests',
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
    {
        title: 'Overall Ticket',
        href: '/tickets/overall',
        icon: TicketIcon,
    },
];

const managementItems: NavItem[] = [
    {
        title: 'Users',
        href: UserController.index().url,
        icon: Users,
    },
    {
        title: 'Companies',
        href: CompanyController.index().url,
        icon: Building,
    },
    {
        title: 'Groups',
        href: GroupController.index().url,
        icon: Users,
    },
    {
        title: 'Shifts',
        href: ShiftController.index().url,
        icon: CalendarClock,
    },
    {
        title: 'Holidays',
        href: '/admin/holidays',
        icon: CalendarClock,
    },
    {
        title: 'Account Verification',
        href: VerificationController.index().url,
        icon: Users,
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
    const { auth, app_version } = usePage().props as any;
    const isSuperAdmin = auth?.user?.role === 'super_admin';
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className="pt-2 pb-4 px-2">
                        <AppLogo version={app_version} />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={dashboardItems} title="Main" />
                <NavMain items={rosterItems} title="Operational" />
                {(isSuperAdmin || auth?.user?.role === 'supv') && (
                    <NavMain
                        items={managementItems.filter(item => isSuperAdmin || item.title === 'Account Verification' || item.title === 'Holidays' || item.title === 'Users')}
                        title="Master Data Management"
                    />
                )}
                {isSuperAdmin && (
                    <NavMain items={systemLogItems} title="System Logs" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Back to Live Board">
                            <Link href="/">
                                <ArrowLeft />
                                <span>Back to Live Board</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
