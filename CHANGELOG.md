# Changelog

All notable changes to the College Notes project will be documented in this file.

## [Unreleased]

### Added
- **Dashboard Redesign:** Transitioned to a persistent sidebar layout and segmented routes.
  - Implemented `src/components/layout/dashboard-shell.tsx` providing a desktop sidebar and a mobile-responsive slide-in drawer using `framer-motion`.
  - Created a root `src/app/dashboard/layout.tsx` Server Component to wrap the shell.
  - Added placeholders for all required dashboard routes: `/upload`, `/browse`, `/my-notes`, `/bookmarks`, `/profile`, `/settings`, and `/admin`.
- **Framer Motion:** Added dependency to support high-quality animations and mobile slide-in interactions.

### Changed
- Refactored `src/app/dashboard/page.tsx` to strip out the previously hard-coded top header and outer wrappers, integrating it seamlessly into the new `DashboardShell` layout.
- The `page.tsx` now purely serves as the interactive dashboard home page showcasing user statistics, timeline events, and recent activity.

### Fixed
- Fixed a JSX parsing issue (`Unterminated regexp literal`) caused by a leftover closing `</div>` tag after the layout restructure in `src/app/dashboard/page.tsx`.
