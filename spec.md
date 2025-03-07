# Bookmarking Service Specification

## Overview
The bookmarking service allows users to store, categorize, and manage interesting links. Users can save links via a web service, a Chrome browser extension, and a Telegram bot. The system automatically extracts metadata and enables organization via tagging.

## Features

### Link Saving
- Users can save links through:
  - Web service
  - Chrome browser extension
  - Telegram bot
- Automatically extracts metadata:
  - Page title
  - Meta description
  - Favicon (if available)
  - Up to 5 AI-generated tags using LLMs (e.g., ChatGPT, Claude)
- Users can edit metadata (title, description, favicon, tags)
- Users can manually add an unlimited number of their own tags

### Organization & Search
- Tagging is the primary method of categorization (no folders or collections)
- Users can search and filter bookmarks based on exact matches of:
  - Tags
  - Page titles
- Sorting:
  - Sortable by date only (default: descending order)
- Users can mark bookmarks as:
  - Favorites
  - Pinned (appear at the top)

### Notes & Metadata
- Users can add personal notes or summaries to each bookmark
- Notes have no character limit
- No additional metadata such as screenshots, reading time estimates, or archived page copies

### User Authentication
- Login methods:
  - Telegram
  - GitHub
  - Username/password
- Password reset via email verification
- No role-based access control (all users have the same permissions)

### Collaboration & Sharing
- No sharing or collaboration features (bookmarks are private to each user)

### Data Export
- Users can export bookmarks to CSV or JSON
- No import functionality from other services

## System Architecture

### Backend
- API-based backend
- Stack: Node.js (Express) or Python (FastAPI/Django)
- Database: PostgreSQL or MongoDB
- Authentication: JWT-based session management
- LLM integration for auto-tagging (e.g., OpenAI API, Claude API)

### Frontend
- Web-based interface (React, Vue, or Svelte)
- Chrome extension for easy bookmarking
- Telegram bot for saving links

### Storage & Data Handling
- Bookmarks stored in a relational (PostgreSQL) or document (MongoDB) database
- User authentication credentials securely stored with bcrypt hashing
- AI-generated tags cached to reduce API calls to LLMs
- Favicon storage via external URLs (no local storage to avoid scalability issues)

## Error Handling & Validation
- Validate URLs before saving
- Handle API errors from LLM integrations gracefully
- Prevent duplicate bookmarks
- Return clear error messages for invalid operations
- Secure authentication to prevent unauthorized access

## Testing Plan
- Unit tests for core functionalities (saving, editing, searching, tagging)
- Integration tests for API endpoints
- UI tests for web and Chrome extension interactions
- Performance testing for large bookmark collections
- Security audits for authentication & authorization flows

## Deployment & Scalability Considerations
- Cloud hosting (AWS, DigitalOcean, or Vercel for frontend)
- Database optimization for efficient querying
- Rate limiting for LLM API calls
- CDN caching for frequently accessed assets (favicons, metadata)

---

This document provides a solid foundation for development. Let me know if you want to refine any aspects!

