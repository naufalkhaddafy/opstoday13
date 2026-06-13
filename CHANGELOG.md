# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
