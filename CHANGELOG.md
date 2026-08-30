# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.5.1] - 2026-08-31

### Added
- **Leaderboard Filter Decoupling**: The Top Leaderboard Engineer tab now has its own independent Month and Year dropdown filters, decoupling it from the global dashboard date range. This allows historical leaderboard viewing without affecting main dashboard metrics.
- **Leaderboard Skeleton Loading**: Implemented skeleton loading animations for the active engineers and podium cards, preventing visual layout jumps during asynchronous Inertia requests.
- **Admin SharePoint Control**: Added UI controls in the Admin Settings to easily trigger manual SharePoint syncs ("Test Sync Initiatives") and configure its background Cron schedule (`sync_sharepoint_initiatives_cron`) dynamically.
- **Docker Compose Integration**: The `SettingSeeder` is now fully idempotent (`firstOrCreate`) and securely embedded into the `docker-compose.yml` initialization process, ensuring seamless CI/CD deployments.

### Changed
- **Robust ETL Pivot Matching**: Transitioned the frontend fuzzy-matching logic entirely to the backend. The `SharePointSyncService` now accurately bridges SharePoint initiatives to exact engineer accounts via an `initiative_user` pivot table using strict multi-word NLP boundaries, eliminating false positive overlaps (e.g., matching "Aryawijaya" with "Wijaya").

### Fixed
- **Inertia Deferred Props**: Fixed a critical bug where deferred properties (such as `engineers` data) would silently vanish ("No data available") during partial Inertia filter visits.

## [v1.5.0] - 2026-08-27

### Added
- **SharePoint Initiatives Integration**: Implemented a highly optimized, bulk-processing synchronization engine (`SharePointSyncService`) to fetch active initiatives from Microsoft SharePoint Lists directly into the local database without N+1 query issues.
- **Top Engineer Leaderboard Overhaul**: Redesigned the Top Engineer Leaderboard UI with a new dynamic expanded panel. It now features an interactive 6-Month historical "Ticket Solved Volume" trend chart (`EngineerTrendChart`) and an active list of the engineer's assigned SharePoint Initiatives.
- **Scheduler Logs**: Automated background tasks (like `opstoday:sync-sharepoint`) are now tightly integrated with the `ScheduleLog` model to track execution times, statuses, and robust error metrics in real-time.

### Changed
- **SLA Exemption for Non-Standard Tickets**: Adjusted the SLA calculation logic across the board. Tickets containing non-numeric characters (e.g., NSS, IA) in their `ticket_no` are now forcefully exempted from Average Response Time, Average Resolution Time, and Compliance Trend Chart calculations. Their workload volume is still safely counted in the "Closed" / "In Progress" tallies, but their SLA fields will cleanly output a dash (`-`).

## [v1.4.3] - 2026-08-13

### Added
- **Account Inactive Badges**: Added visual indicators for inactive accounts on the Attendance Report page. A prominent "Account Inactive" badge now appears next to the user's name, and days without attendance are explicitly labeled as "Nonaktif" rather than "Alpha" to preserve accurate statistics. Historical attendance data from before deactivation is still safely retained and displayed.

### Changed
- **Inactive User Filtering**: System-wide hardening to ensure inactive users (`is_active = false`) are completely excluded from backend syncs and queues. They are now actively blocked from being processed during Ticket Synchronization (`TicketSyncService`) and removed from the Admin Verification Queue.

### Fixed
- **Docker OpenSSL Configuration**: Fixed a critical infrastructure issue where a custom OpenSSL configuration (intended for legacy SQL Server TLS 1.0 support) was causing segmentation faults (`exit code 139`) during the Docker build stage and breaking `cURL` (HTTPS) requests. The OpenSSL override is now isolated solely to the final production stage and correctly uses the `TLSv1` syntax protocol.

## [v1.4.2] - 2026-08-13

### Changed
- **Direct SQL Server Attendance Sync**: Migrated the attendance (fingerprint) synchronization architecture. The system now directly connects to the SQL Server database (`smartweb_b/up`) via a new `fingerprint_sqlsrv` database connection, completely bypassing the legacy external Node.js API.
- **Dynamic Attendance Filtering**: Replaced static NIK queries with dynamic fetching of all active employees (`is_active = true`), ensuring seamless data integrity for new or reactivated personnel.

## [v1.4.1] - 2026-08-10

### Fixed
- **NSS Ticket Creation Date Bug**: Fixed a bug in the automated string-ticket (e.g., NSS, REQ, INC) cleanup process where the `api_creation_date` of a forcefully closed ticket was incorrectly being overwritten with its closing date. Now, the system safely preserves the original API creation date, or falls back to `first_seen_at`, ensuring that ticket intake (created) volume charts remain accurate.

## [v1.4.0] - 2026-07-30

### Added
- **Compliance Trend Line Chart**: Introduced a new line chart in the Team KPI section that visualizes the average Response Time and Resolution Time over time, with configurable SLA target threshold lines drawn directly on the chart for easy comparison.
- **Compliance Ticket Volume Bar Chart**: Added a new stacked bar chart alongside the trend chart that breaks down ticket volumes into four categories: Compliant, Exceeded Response Target, Exceeded Resolution Target, and Unresolved (In Progress) — giving a clear picture of compliance performance at a glance.
- **Multi-Period Chart Views**: Both new charts support three viewing modes — 7 Days (Daily), This Month (Weekly), and This Year (Monthly) — automatically adjusting to the date range selected in the dashboard filter.
- **Unresolved Tickets on Volume Chart**: The Volume chart includes an "Unresolved (In Progress)" category shown in blue, making it easy to see how many tickets are still open alongside completed ones.
- **Minute Conversion on Chart Hover**: Hovering over data points on the Trend line chart now automatically shows the equivalent in minutes or hours+minutes (e.g., `0.8 hr → 48 mins`, `4.5 hr → 4h 30m`), so you no longer need to manually calculate decimal hour values.
- **Skeleton Loading for Charts**: The Ticket Overview section now displays proper skeleton placeholders while the compliance charts are loading, providing a smoother visual experience.

### Changed
- **Renamed "SLA" to "Compliance"**: All labels, titles, and descriptions across the dashboard now use "Compliance" and "Target" terminology instead of "SLA" for clearer, more intuitive language (e.g., "Compliant", "Exceeded Response Target", "Exceeded Resolution Target").
- **Unified Chart Filter Controls**: The time period selector (7 Days, This Month, This Year) for both the Trend and Volume charts is combined into a single shared toolbar for a cleaner, more streamlined experience.
- **Consistent Chart Layout**: Both dashboard charts now have the same height and a single-row legend layout, eliminating visual misalignment between cards.
- **Ticket Overview Section Restructure**: The Ticket Overview area (Active Ticket Distribution + Issue Trends) has been restructured with improved container nesting and spacing to accommodate the new compliance charts below it.
- **Public Dashboard Architecture Refactor**: Refactored the dashboard page from a large monolithic component (~900 lines) into a clean, highly maintainable composition layout (~230 lines) by extracting custom hooks (`useDashboardFilters`) and 5 dedicated UI section components, strictly adhering to frontend design guidelines.

### Fixed
- **Incorrect Average Resolution on Chart**: Fixed a bug where the average resolution time shown on the Compliance Trend chart was significantly different from the value on the KPI summary card. Both now display the exact same number when viewing the same period.

## [v1.3.4] - 2026-07-25

### Fixed
- **Shift Auto-Match Tie-Breaker**: Fixed an issue where users were being assigned an incorrect shift (e.g., 8-17 instead of 8-12) if multiple shifts started at the exact same time, causing massive false "Early Leave" penalties (e.g., 300 minutes). The system now intelligently uses the user's `Check-Out` time as a tie-breaker to accurately assign the shift that best matches their actual work duration.
- **Dropdown Filter Blinking**: Resolved a UI glitch on the Public Dashboard where the selected text inside the "Work Group" dropdown would temporarily disappear or flash during partial Inertia data fetching. The data is now loaded synchronously on initial render.

## [v1.3.3] - 2026-07-25

### Added
- **Work Group Filter on Public Dashboard**: Added a new "Work Group" dropdown in the public dashboard's filter pane. This pulls data dynamically from the `Group` master data and accurately filters the entire dashboard (attendance, ticket metrics, KPIs, and engineer summaries) by scoping to the assigned user's group rather than the ticket's static work group field.

## [v1.3.2] - 2026-07-24

### Added
- **Auto-Sweep NSS Tickets**: Introduced an automated sweep function during the Completed Ticket Sync process to instantly detect, calculate resolution times, and gracefully close legacy non-standard (NSS) tickets that were stuck in a 'disappeared' state.

### Changed
- **Proactive Ticket Disappearance**: Adjusted the Open Ticket Sync logic so that whenever non-numeric tickets (e.g., NSS-) disappear from the API, they are immediately forcefully closed rather than just flagged as missing.
- **DRY Time Calculations**: Refactored the resolution time and completion date calculation for string-based tickets into a centralized, reusable `forceCloseStringTicket` repository helper.

### Fixed
- **Dashboard Chart Label Overlap**: Fixed visual clutter on the public dashboard's `WorkGroupChart` where X-axis labels would overlap on smaller screens. Implemented dynamic 45-degree text rotation, strict character truncation (limiting to 12 chars), and automatic label skipping.
- **Chart TypeScript Typings**: Resolved a strict TypeScript compilation error regarding `this.getLabelForValue` within the Chart.js callback by explicitly referencing the local `labels` array index via closure instead.

## [v1.3.1] - 2026-07-09

### Added
- **System Configuration Module**: Introduced a comprehensive System Configuration page allowing super admins to dynamically manage SLA variables, Scheduler crons, and other settings directly from the UI without modifying `.env` or database manually.
- **Real-Time AI Progress Tracking**: Integrated a live progress bar and pseudo-terminal console within the new "AI Integrations" tab. The UI now actively polls Redis to display the real-time execution progress of the `ops:backfill-ai-tickets` background command.
- **In-App Command Testing**: Added action buttons inside the Scheduler tab to manually trigger background jobs immediately (e.g., Morning/Evening WhatsApp Snapshots, Ticket Syncs) and receive direct UI feedback upon completion.

### Changed
- **Unified Settings UI**: Merged the 'SLA' and 'Attendance' settings into a single, cohesive 'SLA KPC' configuration group. Tabs in the configuration page are now rendered dynamically based on database groups.
- **Command Execution Architecture**: Restructured `SettingController` to execute UI test commands synchronously (`Artisan::call`) to guarantee reliable WhatsApp Snapshot delivery on Windows, while preserving asynchronous, non-blocking execution (`Process::start`) exclusively for long-running AI Backfill tasks.

### Fixed
- **Redis Cache Serialization**: Resolved persistent `__PHP_Incomplete_Class` exceptions by standardizing the `SettingRepository` cache layer to strictly use pure associative arrays, preventing Eloquent Model deserialization crashes when using Redis.

## [v1.2.2] - 2026-06-21

### Added
- **Group Filter for Roster Export**: Roster Excel exports now accurately reflect the selected "Group" filter, only including employees within that specific group.
- **Dynamic Export Subtitles**: The Roster Export Excel file now displays the selected Company and Group names directly in the header title (e.g., `Company: PT Berca | Group: IT Support`).
- **Comprehensive User Exports**: Added dynamic header titles to `UserAttendanceExport` and `UserTicketsExport`, clearly stating the Employee's Name, Period, and exact Export Date.
- **Team Ticket Workload Table**: Introduced a new breakdown table in the Public Dashboard's Ticket Overview export to show total tickets, statuses, and average resolution/response times per user.

### Changed
- **Export Styling Standardization**: Upgraded `UserAttendanceExport` and `UserTicketsExport` Excel formats to match the Roster layout, including Auto-Sizing columns, solid header colors, frozen panes, and centered alignments.
- **Top Issues Export Tweaks**: Replaced the "Total Classified Issues" metric with "Total Tickets in Period" on the Top Issues Dashboard export for better clarity.
- **Simplified Top 10 Styling**: Removed background color highlights and medal icons from the Top 10 Issues export list, reverting to a clean, professional numbered list.
- **Export Button UX**: Download buttons across the dashboard now display a spinning loading state and disable themselves during Excel generation to prevent duplicate requests.

## [v1.2.1] - 2026-06-13

### Added
- **AI Trend Search Support**: The UI Search Field now natively searches against the AI-generated `cluster_label`, allowing users to easily filter tickets by specific AI trends (e.g. "Email & Akun").
- **Interactive Trend Filtering**: Items in the Top 10 Issue Trends panel are now clickable. Clicking an issue automatically scrolls down to the ticket table and instantly searches for tickets belonging to that specific sub-cluster topic.

### Changed
- **Seamless Pagination UX**: Upgraded the Ticket Table pagination on the public dashboard to use Inertia's partial reloads (`preserveState` and `only`). Navigating between pages now seamlessly fetches only the ticket data and displays a smooth skeleton loader, preventing full-page refreshes.
- **Dashboard UI Optimization**: Redesigned the `IssueTrendPanel` into a highly compact, 1-line layout. Perfectly balanced the container heights (`360px`) to align cleanly with the Donut and Bar charts without any visual clipping.
- **Dynamic Chart Resizing**: Shrunk the Donut Chart size and implemented strict flex-box boundaries (`relative min-h-0`) to prevent `Chart.js` components from expanding beyond their layout constraints.
- **Label Formatting Integrity**: Disabled forced title-casing in `TicketTrendAnalyzer` so that dashboard trends retain their exact database casing (e.g. preserving acronyms like "MDM" or "API").
- **Explicit Category Mapping**: The AI Engine (`model.py`) now maps known keywords to broad, human-readable IT categories (e.g., "Email & Akun", "Hardware PC/Laptop") for better and larger grouping.
- **Fallback Extraction**: For unrecognized issues, the AI falls back to extracting exactly 1 top TF-IDF word to group tickets precisely.
- **AI Database Schema**: Dropped `category`/`keyword` columns in favor of `cluster_id`/`cluster_label` in `ticket_ai_predictions` via a new migration, and updated the `TicketAIPrediction` model accordingly.

### Fixed
- **Command Response Parsing**: Fixed the `ops:backfill-ai-tickets` console command to parse the updated API response keys from the AI Engine smoothly.

## [v1.2.0] - 2026-06-13

### Added
- **AI Engine Dockerization**: Introduced a `Dockerfile` for the AI Engine to enable true "Zero Touch" deployment, integrating it directly into `docker-compose.yml` within a secure, internal Docker network (no public port exposure).
- **Auto-Retrain Support**: Configured `ai-engine/retrain.py` to directly fetch completed tickets from the Laravel MySQL database using `.env` credentials, replacing the old mock-data simulation.
- **Force Re-evaluate Command**: Added a `--force` option to the `ops:backfill-ai-tickets` artisan command to safely wipe and recalculate predictions for all legacy tickets.

### Changed
- **Smarter Trend Labels**: Overhauled the Dashboard Trend logic to display highly specific combinations of `Category (Problem)` instead of letting one dominant keyword hijack the entire category.
- **Advanced Keyword Extraction**: Modified the AI keyword extractor (`model.py`) to extract up to 3 words instead of 2. Crucial problem keywords (e.g., "rusak", "error", "mati", "gagal") are now explicitly preserved rather than treated as stop words.
- **Zero-Touch Configs**: Centralized AI Engine configuration in `config/services.php`, allowing dynamic switching between `127.0.0.1` for local testing and `ai-engine` Docker DNS via `.env`.
- **Cleanup**: Removed unused dummy data generation logic from `ai-engine/train.py`.

### Fixed
- **Trend Duplicate Grouping**: Implemented an alphabetical word sorting and deduplication mechanism for AI keywords in the dashboard. Cases like "printer rusak" and "rusak printer" are now seamlessly merged into a single trend.

## [v1.1.1] - 2026-06-13

### Changed
- **Smart Analytics Stop Words**: Expanded the Indonesian stop words list (added `akses`, `login`, `notif`, etc.) to further refine the 1-word issue extraction.
- **UI Localization**: Translated the Top Issue Trends panel description to English ("Top 5 most frequent topics") for better consistency.

## [v1.1.0] - 2026-06-13

### Added
- **Top Issue Trends Panel**: Added a new panel on the Public Dashboard displaying the top 5 most frequent ticket issues using smart keyword extraction (Unigram) to identify hot topics accurately.
- **Work Group Distribution Chart**: Integrated a new colorful Bar Chart within the Active Ticket Distribution card to visualize the total number of active tickets grouped by operational work groups.
- **Enhanced Ticket Search**: The search field for tickets within a specific period (Dashboard) now supports searching by the ticket `title`, in addition to ticket number and assignee name.

### Changed
- **Dashboard Layout Optimization**: Re-aligned the layout of the Active Ticket Distribution card, minimizing white space by pushing the Donut Chart higher and adjusting the Bar Chart to fit perfectly within the available space.
- **Smart Analytics Refinement**: Updated the Ticket Trend Analyzer algorithm to extract precisely 1-word keywords (Unigrams) and improved stop-word filtering (excluding words like "cannot", "can", "unable") for more precise issue trend insights.

## [v1.0.0] - 2026-06-12

### Added
- 🚀 **Initial Release**: Perilisan perdana sistem OpsToday! Selamat datang di era operasional yang baru.
