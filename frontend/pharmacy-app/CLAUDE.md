# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Environment Setup

- `npm run start:dev` - Start development server with dev environment variables
- `npm run start:prod` - Start with production environment variables
- `npm run start` - Start with CSS watching, Prettier, and React dev server concurrently

### Building

- `npm run build:dev` - Build for development environment
- `npm run build:prod` - Build for production environment
- `npm run build` - Standard production build (runs CSS build + React build)

### CSS/SCSS

- `npm run watch-css` - Watch and compile SCSS files using Gulp
- `npm run build-css` - One-time SCSS compilation
- All SCSS files are compiled into a single `public/styles.css` file

### Testing & Code Quality

- `npm run test` - Run Jest test suite
- `npm run prettier-watch` - Auto-format files on change
- Pre-commit hooks run Prettier on staged files

### Deployment

- `npm run deploy dev` - Deploy to development Firebase project
- `npm run deploy prod` - Deploy to production Firebase project
- Deployment scripts handle dependency cleanup, reinstallation, and Firebase project switching

## High-Level Architecture

### Multi-Route Architecture

The application uses a dynamic routing system based on user features:

- **PharmaPaRouteConfig**: Pharmaceutical prior authorization workflow
- **NycbsPharmaPaRouteConfig**: NYCBS-specific pharmaceutical workflow
- **ExternalWorklistRouteConfig**: External worklist management
- **PaRouteConfig**: Standard prior authorization workflow
- **DefaultRouteConfig**: Fallback routes

Route configuration is determined by `LocalStorageKeys.FEATURES` stored after authentication.

### State Management (Redux)

- **Store**: `src/redux/store/store.ts` - 170+ slice configurations for comprehensive state management
- **Authentication**: `firebaseAuthentication` slice for user auth state
- **Domain-Specific Slices**:
  - CMM (Care Management Module) slices for pharmaceutical workflows
  - Medical PA slices for prior authorization management
  - Configuration slices for system settings
- **Async Operations**: Redux Thunk for Firebase interactions

### Firebase Integration

- **Authentication**: Firebase Auth with MFA support
- **Database**: Firestore for real-time data with custom service layer (`src/api/firebase/firestoreService.ts`)
- **Storage**: Firebase Storage for document management
- **Hosting**: Multi-environment deployment (dev/prod)
- **Configuration**: Environment-specific config files in `src/api/firebase/`

### Component Architecture

- **Pages**: Route-level components in `src/pages/`
- **Components**: Reusable components in `src/components/`
- **Modals**: Extensive modal system for forms and data viewing
- **Custom Table**: Sophisticated table component with pagination, sorting, and filtering
- **Context Providers**: React Context for form fields and table state

### Data Layer

- **Data Models**: TypeScript interfaces in `src/data-model/`
- **Enums**: Application constants in `src/enums/`
- **API Services**: Organized by domain in `src/api/`
- **Utilities**: Helper functions in `src/utils/`

### CSS/Styling

- **SCSS**: Component-specific SCSS files compiled via Gulp
- **Tailwind CSS**: Utility-first CSS framework
- **Sass Configuration**: Custom Sass compilation pipeline
- **CSS Output**: All styles compiled to single `public/styles.css`

### Key Workflow Types

1. **Prior Authorization Management**: Medical and pharmaceutical PA workflows
2. **Patient Management**: Patient data and order tracking
3. **Form Configuration**: Dynamic form generation and validation
4. **Document Management**: PDF viewing, uploading, and processing
5. **Analytics**: Usage tracking and reporting
6. **User Management**: Authentication, roles, and facility management

### Environment Configuration

- Development and production Firebase projects
- Environment-specific variables in `.env.development` and `.env.production`
- Feature flags control route configuration and functionality

### Testing Strategy

- Jest for unit testing
- React Testing Library for component testing
- Manual deployment testing across environments
