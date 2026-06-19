<?php

namespace App\Exports\Sheets;

use App\Repositories\Contracts\TicketDashboardRepositoryInterface;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class TopIssuesSheet implements FromView, WithTitle, ShouldAutoSize
{
    private $dateFrom;
    private $dateTo;
    private $companyId;
    private $companyName;

    public function __construct($dateFrom, $dateTo, $companyId, $companyName = null)
    {
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->companyId = $companyId;
        $this->companyName = $companyName;
    }

    public function view(): View
    {
        $repo = app(TicketDashboardRepositoryInterface::class);
        
        // Trending keywords based on AI Predictions
        $aiTrends = $repo->getTrendingKeywords(
            $this->dateFrom,
            $this->dateTo,
            $this->companyId,
            null
        );
        
        // Tickets by Work Group (Standard Categories)
        $workGroups = $repo->getTicketsByWorkGroup(
            $this->dateFrom,
            $this->dateTo,
            $this->companyId
        );
        $globalStats = $repo->globalStats(
            $this->dateFrom,
            $this->dateTo,
            $this->companyId
        );

        $stats = [
            'total_tickets' => $globalStats['created_today'] ?? 0,
            'top_trending_count' => count($aiTrends),
            'top_workgroup_count' => count($workGroups),
        ];

        return view('exports.public_dashboard.top_issues', [
            'aiTrends' => $aiTrends,
            'workGroups' => $workGroups,
            'stats' => $stats,
            'dateFrom' => $this->dateFrom,
            'dateTo' => $this->dateTo,
            'companyName' => $this->companyName,
        ]);
    }

    public function title(): string
    {
        return 'Top 10 Issues';
    }
}
