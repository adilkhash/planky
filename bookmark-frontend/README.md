# Planky Frontend

A modern React frontend for the Planky bookmarking service.

## Overview

This project is the frontend application for the Planky bookmarking service. It allows users to save, organize, and manage their bookmarks with features like tagging, favorites, and search.

## Technology Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **API Communication**: Axios
- **Form Handling**: Formik with Yup validation
- **Styling**: Tailwind CSS
- **Icons**: Heroicons

## Project Structure

```
planky-frontend/
├── public/               # Static assets
├── src/
│   ├── assets/           # Static assets imported in components
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── .env.development      # Development environment variables
├── .env.production       # Production environment variables
├── index.html            # HTML template
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd planky-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Configure environment variables:
   - Copy `.env.development` to `.env.local` and update the values if needed

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to http://localhost:5173

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for issues

## Features

- **Authentication**: Login, registration, and protected routes
- **Bookmark Management**: Create, view, update, and delete bookmarks
- **Organization**: Tag bookmarks and mark as favorites or pinned
- **Search & Filter**: Search and filter bookmarks by various criteria
- **Responsive Design**: Works on desktop and mobile devices

## API Integration

The frontend communicates with the Planky backend API using Axios. API requests include:

- Authentication (login, register, get user profile)
- Bookmark operations (CRUD, tagging, favorites)
- Tag management

## Deployment

To deploy the application:

1. Build the project:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. The build output will be in the `dist` directory, which can be deployed to any static hosting service.

## Configuration

Environment variables:

- `VITE_API_URL`: Backend API URL
- `VITE_ENV`: Current environment (development or production)
