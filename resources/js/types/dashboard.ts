export type AttendanceStats = {
    total_users: number;
    total_scheduled: number;
    total_present: number;
    total_leave: number;
    total_absent: number;
    total_late: number;
    total_early_leave: number;
};

export type EmployeeStatus = {
    id: number;
    name: string;
    shift_name: string;
    shift_time: string;
    status: string;
    check_in: string | null;
    check_out: string | null;
    late_minutes: number;
    early_leave_minutes: number;
    extended_minutes: number;
    leave_description: string | null;
    period_stats: {
        present_days: number;
        leave_days: number;
        sick_days: number;
        permit_days: number;
        absent_days: number;
        scheduled_days: number;
        scheduled_working_days: number;
        late_minutes: number;
        early_leave_minutes: number;
        extended_minutes: number;
    };
};

export type TicketStats = {
    assigned: number;
    pending: number;
    in_progress: number;
    open_total: number;
    completed_today: number;
    created_today: number;
};

export type KpiStats = {
    current: {
        response_sla_percent: number | null;
        resolution_sla_percent: number | null;
        avg_response_seconds: number | null;
        avg_response_label: string | null;
        avg_resolution_hours: number | null;
        avg_resolution_label: string | null;
        total_resolved: number;
    };
    previous: {
        response_sla_percent: number | null;
        resolution_sla_percent: number | null;
        avg_response_seconds: number | null;
        avg_resolution_hours: number | null;
        total_resolved: number;
    };
    targets: {
        response_sla_seconds: number;
        resolution_sla_hours: number;
    };
};

export type EngineerSummary = {
    id: number;
    name: string;
    employee_id: string | null;
    assigned: number;
    pending: number;
    in_progress: number;
    completed_today: number;
    global_active_tickets: number;
    total: number;
    avg_response_time_seconds: number | null;
    avg_response_time_label: string | null;
    avg_resolution_time_hours: number | null;
    avg_resolution_time_label: string | null;
};

export type TicketRow = {
    id: number;
    ticket_no: string;
    title: string | null;
    category: string | null;
    status: 'assigned' | 'pending_on_hold' | 'in_progress' | 'closed' | null;
    status_label: string | null;
    assigned_to_name: string | null;
    assigned_user: { id: number; name: string } | null;
    requested_for: string | null;
    created_date: string | null;
    completed_date: string | null;
    response_time_label: string | null;
    resolution_time_label: string | null;
    updated_at: string | null;
};

export type PaginationLink = { url: string | null; label: string; active: boolean };

export type CompanyOption = { id: number; name: string };

export type DashboardFilters = {
    company_id: number | null;
    work_group: string | null;
    date_from: string;
    date_to: string;
    search: string | null;
    sort_by: string | null;
    sort_dir: string;
    status: string | null;
    slaHighTicketLoad: number;
    defaults: {
        company_id: number | null;
        work_group: string | null;
        date_from: string;
        date_to: string;
        search: string | null;
        sort_by: string | null;
        sort_dir: string;
        status: string | null;
    };
};

export type DashboardProps = {
    date: string;
    holiday_name?: string | null;
    attendance?: { stats: AttendanceStats; employees: EmployeeStatus[] };
    ticket_stats?: TicketStats;
    kpi_stats?: KpiStats;
    companies: CompanyOption[];
    workGroups: string[];
    filters: DashboardFilters;
    engineers?: EngineerSummary[];
    tickets?: {
        data: TicketRow[];
        meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
        links: PaginationLink[];
    };
    analytics?: {
        leaderboard: LeaderboardEntry[];
        lateTrend: Record<string, number>;
        issueTrends: IssueTrendItem[];
        workGroupDistribution: { name: string; total: number }[];
    };
};

export type IssueTrendItem = {
    phrase: string;
    count: number;
    previous_count: number;
    trend: 'up' | 'down' | 'stable' | 'new';
    percentage: number;
};

export type LeaderboardEntry = {
    user_id: number;
    name: string;
    employee_id: string | null;
    total_late_minutes: number;
    total_overtime_minutes: number;
    net_penalized_minutes: number;
    late_days: number;
    mangkir_days: number;
    score: number;
};

export type Segment = { label: string; value: number; color: string };
