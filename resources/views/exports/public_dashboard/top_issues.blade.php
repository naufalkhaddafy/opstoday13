<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body>
    <!-- Title Card -->
    <table>
        <tr>
            <td colspan="4" style="background-color: #1e3a8a; color: #ffffff; font-size: 16px; font-weight: bold; text-align: center; height: 35px; vertical-align: middle;">
                TOP ISSUES DASHBOARD{{ !empty($companyName) ? ' | ' . $companyName : '' }}
            </td>
        </tr>
        <tr>
            <td colspan="4" style="background-color: #1e40af; color: #e0e7ff; font-size: 12px; text-align: center; height: 25px; vertical-align: middle;">
                Date Range: {{ $dateFrom->format('d M Y') }} - {{ $dateTo->format('d M Y') }} | Exported At: {{ now()->format('d M Y H:i:s') }}
            </td>
        </tr>
        <tr>
            <td colspan="4" style="height: 10px;"></td> <!-- Spacer -->
        </tr>
    </table>

    <!-- Cards Summary -->
    <table>
        <tr>
            <td colspan="2" style="background-color: #eff6ff; color: #1e3a8a; font-weight: bold; text-align: center; border: 1px solid #bfdbfe; height: 30px; vertical-align: middle;">Total Tickets in Period</td>
            <td colspan="1" style="background-color: #f0fdf4; color: #166534; font-weight: bold; text-align: center; border: 1px solid #bbf7d0; vertical-align: middle;">Total Unique AI Issues</td>
            <td colspan="1" style="background-color: #fefce8; color: #854d0e; font-weight: bold; text-align: center; border: 1px solid #fef08a; vertical-align: middle;">Work Group Categories</td>
        </tr>
        <tr>
            <td colspan="2" style="background-color: #ffffff; color: #1e3a8a; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #bfdbfe; height: 30px; vertical-align: middle;">{{ $stats['total_tickets'] ?? 0 }}</td>
            <td colspan="1" style="background-color: #ffffff; color: #166534; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #bbf7d0; vertical-align: middle;">{{ $stats['top_trending_count'] ?? 0 }}</td>
            <td colspan="1" style="background-color: #ffffff; color: #854d0e; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #fef08a; vertical-align: middle;">{{ $stats['top_workgroup_count'] ?? 0 }}</td>
        </tr>
        <tr>
            <td colspan="4" style="height: 15px;"></td> <!-- Spacer -->
        </tr>
    </table>

    <!-- Data Tables -->
    
    <!-- Table 1: Top AI Predictions -->
    <table>
        <thead>
            <tr>
                <th colspan="4" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #4338ca; height: 25px;">All Trending Issues (AI Prediction)</th>
            </tr>
            <tr>
                <th style="background-color: #818cf8; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #6366f1; ">Issue Category</th>
                <th style="background-color: #818cf8; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #6366f1; ">Total Tickets</th>
                <th style="background-color: #818cf8; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #6366f1; ">Trend</th>
                <th style="background-color: #818cf8; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #6366f1; ">Change (%)</th>
            </tr>
        </thead>
        <tbody>
        @foreach($aiTrends as $index => $trend)
            <tr>
                <td style="border: 1px solid #d1d5db;">
                    {{ $index + 1 }}.
                    {{ $trend['phrase'] }}
                </td>
                <td style="border: 1px solid #d1d5db; text-align: center; font-weight: {{ $index < 3 ? 'bold' : 'normal' }};">{{ $trend['count'] }}</td>
                <td style="border: 1px solid #d1d5db; text-align: center;">{{ ucfirst($trend['trend']) }}</td>
                <td style="border: 1px solid #d1d5db; text-align: center;">{{ $trend['percentage'] }}%</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <table>
        <tr><td colspan="4" style="height: 15px;"></td></tr> <!-- Spacer -->
    </table>

    <!-- Table 2: Top Work Groups -->
    <table>
        <thead>
            <tr>
                <th colspan="4" style="background-color: #0ea5e9; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0284c7; height: 25px;">Top 10 Work Groups (Standard Categories)</th>
            </tr>
            <tr>
                <th colspan="3" style="background-color: #38bdf8; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0ea5e9; ">Work Group Name</th>
                <th colspan="1" style="background-color: #38bdf8; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0ea5e9; ">Total Tickets</th>
            </tr>
        </thead>
        <tbody>
        @foreach($workGroups as $wg)
            <tr>
                <td colspan="3" style="border: 1px solid #d1d5db;">{{ $wg['name'] }}</td>
                <td colspan="1" style="border: 1px solid #d1d5db; text-align: center;">{{ $wg['total'] }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

</body>
</html>

