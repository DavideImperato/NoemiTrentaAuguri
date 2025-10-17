# Noemi30Cam - Birthday Photo Booth Application

## Overview

Noemi30Cam is a single-purpose birthday photo booth web application designed for Noemi's 30th birthday celebration. The application allows party guests to capture photos using their device cameras, apply a custom decorative birthday frame overlay, and save the photos to Google Drive. Built with a festive rose pink and gold color scheme, it provides an Instagram/Snapchat-style camera interface optimized for mobile-first usage at the celebration event.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**UI Component Library**: Shadcn/ui (New York style) - A comprehensive set of Radix UI primitives with Tailwind CSS styling. The application uses a curated set of pre-built accessible components including buttons, cards, toasts, dialogs, and form elements.

**Styling System**: Tailwind CSS with custom theme configuration featuring:
- Custom color palette centered around rose pink (#f7c8d0), light gold (#f9e79f), and white
- CSS variables for dynamic theming (HSL color format)
- Mobile-first responsive design with breakpoint-based utilities
- Custom spacing and border radius scales

**Typography**: 
- Primary decorative font: "Great Vibes" (script style for headings)
- Secondary UI font: "Poppins" (sans-serif for body and interface elements)

**State Management**: 
- React hooks (useState, useEffect, useRef) for local component state
- TanStack Query (React Query) for server state management (configured but minimal usage in this single-page app)
- Custom hooks for mobile detection and toast notifications

**Routing**: Wouter - lightweight client-side routing library (single route "/" to camera page)

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js

**Server Setup**: Custom Vite integration for development with HMR (Hot Module Replacement) support. Production builds use esbuild for server bundling.

**API Structure**: RESTful API design with `/api` prefix (minimal routes defined - extensible architecture)

**Middleware**: 
- JSON body parsing
- URL-encoded form data parsing
- Request logging with timing and response capture
- Error handling middleware for centralized error responses

### Data Storage Solutions

**ORM**: Drizzle ORM configured for PostgreSQL with Neon serverless adapter

**Database Schema**: Minimal user table defined with:
- UUID primary key (generated via `gen_random_uuid()`)
- Username (unique, text)
- Password (text)

**Schema Validation**: Zod schemas derived from Drizzle table definitions for runtime type safety

**Storage Interface**: Abstracted storage layer with in-memory implementation (MemStorage) allowing future database swap without code changes. Interface defines CRUD operations for users.

**Migration Strategy**: Drizzle Kit configured for schema migrations with PostgreSQL dialect

### Authentication and Authorization

**Current Implementation**: Basic user schema exists but no active authentication flow is implemented in the photo booth application. The app is designed for open access at a private party event.

**Session Management**: Connect-pg-simple package included for PostgreSQL-backed session storage (configured but not actively used).

### External Dependencies

**Google APIs Integration**:
- Google Sign-In (accounts.google.com/gsi/client) - OAuth authentication for Drive access
- Google APIs Client Library (apis.google.com/js/api.js) - Drive API interaction for photo upload
- Client-side dynamic script loading for API initialization
- Requires OAuth token management and Drive API scopes for file creation

**Camera Access**: Browser MediaStream API (getUserMedia) for accessing device camera with video preview

**Image Processing**: HTML5 Canvas API for:
- Capturing video frames as images
- Compositing camera output with decorative frame overlay
- Generating downloadable image files (JPEG/PNG)

**Asset Management**: Custom Vite alias for attached_assets directory containing the birthday frame overlay image

**Development Tools**:
- Replit-specific plugins for development banner, cartographer (code navigation), and runtime error modal
- TypeScript for type safety across client and server
- PostCSS with Autoprefixer for CSS processing

**UI Libraries**:
- Radix UI primitives (accordion, dialog, dropdown, popover, tooltip, etc.)
- Lucide React for iconography
- class-variance-authority (CVA) for component variant management
- clsx and tailwind-merge for className composition
- date-fns for date formatting utilities
- embla-carousel-react for carousel components

**Form Handling**:
- React Hook Form for form state management
- Hookform Resolvers for validation integration