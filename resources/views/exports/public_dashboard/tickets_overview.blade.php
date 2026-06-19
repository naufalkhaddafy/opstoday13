<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body>
    <!-- Title Card -->
    <table>
        <tr>
            <td colspan="8" style="background-color: #1e3a8a; color: #ffffff; font-size: 16px; font-weight: bold; text-align: center; height: 35px; vertical-align: middle;">
                TICKET OVERVIEW DASHBOARD{{ !empty($companyName) ? ' | ' . $companyName : '' }}
            </td>
        </tr>
        <tr>
            <td colspan="8" style="background-color: #1e40af; color: #e0e7ff; font-size: 12px; text-align: center; height: 25px; vertical-align: middle;">
                Date Range: {{ $dateFrom->format('d M Y') }} - {{ $dateTo->format('d M Y') }} | Exported At: {{ now()->format('d M Y H:i:s') }}
            </td>
        </tr>
        <tr>
            <td colspan="8" style="height: 10px;"></td> <!-- Spacer -->
        </tr>
    </table>

    <!-- Cards Summary -->
    <table>
        <tr>
            <td colspan="1" style="background-color: #eff6ff; color: #1e3a8a; font-weight: bold; text-align: center; border: 1px solid #bfdbfe; height: 30px; vertical-align: middle;">Total Created</td>
            <td colspan="1" style="background-color: #f0fdf4; color: #166534; font-weight: bold; text-align: center; border: 1px solid #bbf7d0; vertical-align: middle;">Total Completed</td>
            <td colspan="1" style="background-color: #fefce8; color: #854d0e; font-weight: bold; text-align: center; border: 1px solid #fef08a; vertical-align: middle;">Total Open</td>
            <td colspan="1" style="background-color: #fef2f2; color: #991b1b; font-weight: bold; text-align: center; border: 1px solid #fecaca; vertical-align: middle;">Assigned</td>
            <td colspan="1" style="background-color: #fef2f2; color: #991b1b; font-weight: bold; text-align: center; border: 1px solid #fecaca; vertical-align: middle;">In Progress</td>
            <td colspan="3" style="background-color: #faf5ff; color: #6b21a8; font-weight: bold; text-align: center; border: 1px solid #e9d5ff; vertical-align: middle;">Pending / On Hold</td>
        </tr>
        <tr>
            <td colspan="1" style="background-color: #ffffff; color: #1e3a8a; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #bfdbfe; height: 30px; vertical-align: middle;">{{ $stats['created_today'] ?? 0 }}</td>
            <td colspan="1" style="background-color: #ffffff; color: #166534; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #bbf7d0; vertical-align: middle;">{{ $stats['completed_today'] ?? 0 }}</td>
            <td colspan="1" style="background-color: #ffffff; color: #854d0e; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #fef08a; vertical-align: middle;">{{ $stats['open_total'] ?? 0 }}</td>
            <td colspan="1" style="background-color: #ffffff; color: #991b1b; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #fecaca; vertical-align: middle;">{{ $stats['assigned'] ?? 0 }}</td>
            <td colspan="1" style="background-color: #ffffff; color: #991b1b; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #fecaca; vertical-align: middle;">{{ $stats['in_progress'] ?? 0 }}</td>
            <td colspan="3" style="background-color: #ffffff; color: #6b21a8; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #e9d5ff; vertical-align: middle;">{{ $stats['pending'] ?? 0 }}</td>
        </tr>
        <tr>
            <td colspan="8" style="height: 15px;"></td> <!-- Spacer -->
        </tr>
    </table>
    <!-- Engineer Table -->
    <table>
        <thead>
            <tr>
                <th colspan="8" style="background-color: #059669; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #047857; height: 25px;">Team Ticket Workload</th>
            </tr>
            <tr>
                <th style="background-color: #10b981; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #059669;">Engineer Name</th>
                <th style="background-color: #10b981; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #059669;">Total Tickets</th>
                <th style="background-color: #10b981; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #059669;">Assigned</th>
                <th style="background-color: #10b981; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #059669;">In Progress</th>
                <th style="background-color: #10b981; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #059669;">Pending</th>
                <th style="background-color: #10b981; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #059669;">Completed</th>
                <th style="background-color: #10b981; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #059669;">Avg Response (Hrs)</th>
                <th style="background-color: #10b981; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #059669;">Avg Resolution (Hrs)</th>
            </tr>
        </thead>
        <tbody>
        @foreach($engineers as $eng)
            <tr>
                <td style="border: 1px solid #d1d5db;">{{ $eng['name'] }}</td>
                <td style="border: 1px solid #d1d5db; text-align: center; font-weight: bold;">{{ $eng['total'] }}</td>
                <td style="border: 1px solid #d1d5db; text-align: center;">{{ $eng['assigned'] }}</td>
                <td style="border: 1px solid #d1d5db; text-align: center;">{{ $eng['in_progress'] }}</td>
                <td style="border: 1px solid #d1d5db; text-align: center;">{{ $eng['pending'] }}</td>
                <td style="border: 1px solid #d1d5db; text-align: center;">{{ $eng['completed_today'] }}</td>
                <td style="border: 1px solid #d1d5db; text-align: center;">{{ $eng['avg_response_time_seconds'] !== null ? round($eng['avg_response_time_seconds'] / 3600, 2) : '-' }}</td>
                <td style="border: 1px solid #d1d5db; text-align: center;">{{ $eng['avg_resolution_time_hours'] !== null ? $eng['avg_resolution_time_hours'] : '-' }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <table>
        <tr>
            <td colspan="8" style="height: 15px;"></td> <!-- Spacer -->
        </tr>
    </table>

    <!-- Data Table -->
    <table>
        <thead>
            <tr>
                <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #2563eb; ">Ticket No</th>
                <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #2563eb; ">Status</th>
                <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #2563eb; ">Requested For</th>
                <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #2563eb; ">Assigned To</th>
                <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #2563eb; ">Created Date</th>
                <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #2563eb; ">Completed Date</th>
                <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #2563eb; ">First Response (Hrs)</th>
                <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #2563eb; ">Resolution Time (Hrs)</th>
            </tr>
        </thead>
        <tbody>
        @foreach($tickets as $ticket)
            <tr>
                <td style="border: 1px solid #d1d5db;">{{ $ticket->ticket_no }}</td>
                <td style="border: 1px solid #d1d5db;">{{ $ticket->status?->value ?? (is_string($ticket->status) ? $ticket->status : (string) $ticket->status) }}</td>
                <td style="border: 1px solid #d1d5db;">{{ $ticket->requested_for }}</td>
                <td style="border: 1px solid #d1d5db;">{{ $ticket->assignedUser ? $ticket->assignedUser->name : $ticket->assigned_to_name }}</td>
                <td style="border: 1px solid #d1d5db;">{{ $ticket->api_creation_date ? $ticket->api_creation_date->format('Y-m-d') : '' }}</td>
                <td style="border: 1px solid #d1d5db;">{{ $ticket->completed_date ? $ticket->completed_date->format('Y-m-d') : '' }}</td>
                <td style="border: 1px solid #d1d5db; text-align: right;">{{ $ticket->response_time_seconds !== null ? round($ticket->response_time_seconds / 3600, 2) : '' }}</td>
                <td style="border: 1px solid #d1d5db; text-align: right;">{{ $ticket->resolution_time }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
</body>
</html>

