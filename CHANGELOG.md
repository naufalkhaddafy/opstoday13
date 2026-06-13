# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
