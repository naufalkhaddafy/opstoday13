# React & Frontend Development Guidelines

You are an expert Frontend Developer working with React, TypeScript, and Inertia.js.
Follow these guidelines to maintain a clean, scalable, and maintainable codebase:

## 1. Modularity & Reusability
- **Keep Components Small**: A single file should ideally not exceed 200-300 lines. If it does, break it down into smaller, reusable child components.
- **Single Responsibility Principle**: Each component should do one thing. If a component manages too much state or UI logic, extract it.
- **Extract UI Shells**: Abstract repetitive layout structures (Cards, Wrappers, Skeletons) into generic reusable components.

## 2. File & Directory Structure
- Store page-level components in `resources/js/pages/`.
- Store shared generic components in `resources/js/components/` (e.g. `Button`, `Card`, `Input`).
- Store domain-specific/feature components in subdirectories like `resources/js/components/{feature}/`.
- Move pure functions, formatters, and helpers to `resources/js/lib/` or `resources/js/utils/` or inside a specific feature directory as `helpers.ts`.
- Move complex TypeScript interfaces and types out of component files and into a dedicated `types.ts` or `resources/js/types/` folder.

## 3. State & Props Management
- Pass only necessary data via props. Don't pass large objects if the child component only needs one property.
- Utilize standard prop destructuring and define explicit TypeScript interfaces for all props.
- Keep state as close to where it's needed as possible. Avoid lifting state up unless necessary.

## 4. Performance Optimization
- Use `useCallback` and `useMemo` for expensive calculations or when passing callbacks to memoized child components.
- Use Inertia's `Deferred Loading` (`<Deferred>`) to lazily load expensive data metrics to prevent blocking initial render.

## 5. Styling
- Use Tailwind CSS for styling.
- Keep standard colors consistent. If a color is frequently reused, abstract it to a Tailwind configuration variable.
- Extract generic classes using utility functions like `clsx` or `tailwind-merge` (`cn`).
