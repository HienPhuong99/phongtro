---
version: alpha
name: Quản lý phòng trọ Design System
description: Design Engineering specification for Quản lý phòng trọ Web App, Mobile PWA, and React Native Expo Go app, governed by ui-skills.com (baseline-ui, fixing-accessibility, fixing-motion-performance).
colors:
  background-canvas: "#F8FAFC"
  background-surface: "#FFFFFF"
  background-subtle: "#F1F5F9"
  foreground-primary: "#0F172A"
  foreground-secondary: "#475569"
  foreground-muted: "#64748B"
  border-default: "#E2E8F0"
  accent-primary: "#2563EB"
  accent-primary-hover: "#1D4ED8"
  status-success: "#059669"
  status-warning: "#D97706"
  status-danger: "#E11D48"
typography:
  sans:
    fontFamily: Inter
    fontSize: 14px
    lineHeight: 20px
    fontWeight: 400
  heading:
    fontFamily: Inter
    fontSize: 20px
    lineHeight: 28px
    fontWeight: 700
  mono:
    fontFamily: ui-monospace
    fontSize: 12px
    lineHeight: 16px
    fontWeight: 600
rounded:
  base: 12px
  card: 16px
  modal: 20px
spacing:
  page: 24px
  card: 20px
  compact: 12px
---

## Overview

**Quản lý phòng trọ** is a property, contract, utility billing, and FIFO payment management system built for both Desktop Web (`src/`) and Mobile PWA / React Native Expo Go (`mobile-expo/`). Its visual language follows `ui-skills.com` (`baseline-ui`, `fixing-accessibility`, `fixing-motion-performance`): high-contrast financial hierarchy, `tabular-nums` alignment for all monetary and meter values, restrained semantic accents, and zero-jank compositor transitions.

## Colors

- Use `#F8FAFC` (`background-canvas`) for the application canvas and `#FFFFFF` (`background-surface`) for elevated cards, tables, and modals.
- Reserve `#2563EB` (`accent-primary`) for primary interactive affordances, active navigation states, and selected filters.
- Map room and invoice lifecycle states strictly to semantic tokens:
  - Occupied / Active: `#2563EB`
  - Vacant / Paid / Positive cashflow: `#059669`
  - Expiring soon / Partial / Pending reading: `#D97706`
  - Overdue debt / Maintenance / Expense: `#E11D48`

## Typography

- Apply `font-variant-numeric: tabular-nums` (`tabular-nums`) to every currency figure, meter index, room badge, KPI counter, and table cell across Web and React Native.
- Apply `text-balance` to section headings and `text-pretty` to descriptive subtitles and helper copy.

## Layout

- Use `min-h-dvh` instead of `min-h-screen` to prevent mobile browser toolbar clipping.
- Desktop (`>= 768px`) uses a persistent 240px left navigation rail (`aside`) paired with a sticky topbar and a `max-w-7xl` content container.
- Mobile (`< 768px` and `?mode=mobile`) uses a compact sticky header, single-column or 2-column responsive cards, and a fixed bottom navigation bar respecting `env(safe-area-inset-bottom)`.

## Components

- **Brand Logo (`public/logo.svg`)**: Custom house-roof & room-window mark on a `#2563EB → #1D4ED8` rounded square with an emerald status badge (`#10B981`).
- **Room Cards**: Display room code, status pill, monthly rent in `tabular-nums`, one-click `Sửa giá` trigger, tenant/occupancy summary, and deposit/utility metadata.
- **Modals**: Trap and restore focus, close on `Escape` or backdrop click, and keep header/footer sticky while scrolling body content.
- **Icon-Only Controls**: Every icon-only button must provide an explicit `aria-label`.

## Do's and Don'ts

- **Do** use `tabular-nums` on all VND amounts, percentages, dates, and electricity/water meter readings.
- **Do** keep interaction transitions under `200ms` using `ease-out` on `transform` and `opacity`.
- **Don't** use continuous `animate-bounce` on toasts or banners.
- **Don't** use purple/multicolor decorative gradients on primary data cards.
