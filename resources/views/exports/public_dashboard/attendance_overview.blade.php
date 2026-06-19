<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body>
@php
    $dateCount = count($period);
    $totalCols = 11 + $dateCount;
    $colSpanCard1 = max(3, intval($totalCols / 4));
    $colSpanCard2 = max(3, intval($totalCols / 4));
    $colSpanCard3 = max(3, intval($totalCols / 4));
    $colSpanCard4 = $totalCols - ($colSpanCard1 + $colSpanCard2 + $colSpanCard3);
@endphp
    <!-- Title Card -->
    <table>
        <tr>
            <td colspan="{{ $totalCols }}" style="background-color: #1e3a8a; color: #ffffff; font-size: 16px; font-weight: bold; text-align: center; height: 35px; vertical-align: middle;">
                ATTENDANCE OVERVIEW DASHBOARD{{ !empty($companyName) ? ' | ' . $companyName : '' }}
            </td>
        </tr>
        <tr>
            <td colspan="{{ $totalCols }}" style="background-color: #1e40af; color: #e0e7ff; font-size: 12px; text-align: center; height: 25px; vertical-align: middle;">
                Date Range: {{ $dateFrom->format('d M Y') }} - {{ $dateTo->format('d M Y') }} | Exported At: {{ now()->format('d M Y H:i:s') }}
            </td>
        </tr>
        <tr>
            <td colspan="{{ $totalCols }}" style="height: 10px;"></td> <!-- Spacer -->
        </tr>
    </table>

    <!-- Cards Summary -->
    <table>
        <tr>
            <td colspan="{{ $colSpanCard1 }}" style="background-color: #eff6ff; color: #1e3a8a; font-weight: bold; text-align: center; border: 1px solid #bfdbfe; height: 30px; vertical-align: middle;">Total Employees</td>
            <td colspan="{{ $colSpanCard2 }}" style="background-color: #f0fdf4; color: #166534; font-weight: bold; text-align: center; border: 1px solid #bbf7d0; vertical-align: middle;">Total Present (Period)</td>
            <td colspan="{{ $colSpanCard3 }}" style="background-color: #fef2f2; color: #991b1b; font-weight: bold; text-align: center; border: 1px solid #fecaca; vertical-align: middle;">Total Absent (Period)</td>
            <td colspan="{{ $colSpanCard4 }}" style="background-color: #fefce8; color: #854d0e; font-weight: bold; text-align: center; border: 1px solid #fef08a; vertical-align: middle;">Total Late (Period)</td>
        </tr>
        <tr>
            <td colspan="{{ $colSpanCard1 }}" style="background-color: #ffffff; color: #1e3a8a; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #bfdbfe; height: 30px; vertical-align: middle;">{{ $stats['total_users'] ?? 0 }}</td>
            <td colspan="{{ $colSpanCard2 }}" style="background-color: #ffffff; color: #166534; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #bbf7d0; vertical-align: middle;">{{ $stats['total_present'] ?? 0 }}</td>
            <td colspan="{{ $colSpanCard3 }}" style="background-color: #ffffff; color: #991b1b; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #fecaca; vertical-align: middle;">{{ $stats['total_absent'] ?? 0 }}</td>
            <td colspan="{{ $colSpanCard4 }}" style="background-color: #ffffff; color: #854d0e; font-weight: bold; font-size: 14px; text-align: center; border: 1px solid #fef08a; vertical-align: middle;">{{ $stats['total_late'] ?? 0 }}</td>
        </tr>
        <tr>
            <td colspan="{{ $totalCols }}" style="height: 15px;"></td> <!-- Spacer -->
        </tr>
    </table>

    <!-- Data Table -->
    <table>
        <thead>
            <tr>
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">No</th>
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">Name</th>
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">Shift</th>
                @foreach($period as $date)
                <th style="background-color: #0f766e; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #115e59; ">{{ $date->format('d M') }}</th>
                @endforeach
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">Period Present</th>
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">Period Absent</th>
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">Period Sick</th>
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">Period Permit</th>
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">Period Leave</th>
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">Late (Mins)</th>
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">Early (Mins)</th>
                <th style="background-color: #0d9488; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #0f766e; ">Extended (Mins)</th>
            </tr>
        </thead>
        <tbody>
        @foreach($employees as $emp)
            <tr>
                <td style="border: 1px solid #d1d5db; text-align: center;">{{ $loop->iteration }}</td>
                <td style="border: 1px solid #d1d5db;">{{ $emp['name'] }}</td>
                <td style="border: 1px solid #d1d5db;">{{ $emp['shift_name'] }}</td>
                
                @foreach($period as $date)
                @php
                    $dateStr = $date->toDateString();
                    $dayStatus = $emp['daily_details'][$dateStr]['status'] ?? '-';
                    // Simplify the output so columns aren't too wide.
                    $statusLabel = match($dayStatus) {
                        'hadir' => 'Hadir',
                        'tidak_lengkap' => 'Tdk Lkp',
                        'absen' => 'Absen',
                        'tidak_hadir' => 'Absen',
                        'cuti' => 'Cuti',
                        'sakit' => 'Sakit',
                        'izin' => 'Izin',
                        'holiday' => 'Libur',
                        'off_day' => 'Libur',
                        default => ucfirst($dayStatus)
                    };
                    
                    $bgColor = match($statusLabel) {
                        'Hadir' => '#dcfce7',
                        'Absen' => '#fee2e2',
                        'Libur' => '#f3f4f6',
                        'Sakit', 'Izin', 'Cuti' => '#fef9c3',
                        default => '#ffffff'
                    };
                @endphp
                <td style="border: 1px solid #d1d5db; text-align: center; background-color: {{ $bgColor }};">{{ $statusLabel }}</td>
                @endforeach
                
                <td style="border: 1px solid #d1d5db; text-align: right;">{{ $emp['period_stats']['present_days'] ?? 0 }}</td>
                <td style="border: 1px solid #d1d5db; text-align: right;">{{ $emp['period_stats']['absent_days'] ?? 0 }}</td>
                <td style="border: 1px solid #d1d5db; text-align: right;">{{ $emp['period_stats']['sick_days'] ?? 0 }}</td>
                <td style="border: 1px solid #d1d5db; text-align: right;">{{ $emp['period_stats']['permit_days'] ?? 0 }}</td>
                <td style="border: 1px solid #d1d5db; text-align: right;">{{ $emp['period_stats']['leave_days'] ?? 0 }}</td>
                <td style="border: 1px solid #d1d5db; text-align: right;">{{ $emp['period_stats']['late_minutes'] ?? 0 }}</td>
                <td style="border: 1px solid #d1d5db; text-align: right;">{{ $emp['period_stats']['early_leave_minutes'] ?? 0 }}</td>
                <td style="border: 1px solid #d1d5db; text-align: right;">{{ $emp['period_stats']['extended_minutes'] ?? 0 }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
</body>
</html>

