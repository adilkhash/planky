# Incremental Development Prompts for Bookmarking Service

## Phase 1: Project Foundation and Core Models

### Prompt 1: Django Project Setup

```
Create a new Django project for a bookmarking service with the following specifications:

1. Project name: 'bookmark_service'
2. Create an app named 'bookmarks'
3. Configure PostgreSQL as the database with the following settings:
   - Name: bookmark_db
   - Use environment variables for credentials
4. Set up a requirements.txt file with the following dependencies:
   - Django>=4.2.0
   - psycopg2-binary>=2.9.3
   - djangorestframework>=3.14.0
   - django-cors-headers>=4.0.0
   - pyjwt>=2.6.0
   - python-dotenv>=1.0.0
5. Create a basic .env file template
6. Configure CORS to allow requests from the frontend
7. Set up basic Django settings including timezone and language
8. Create a Docker configuration with docker-compose for development

Provide the complete project structure and configurations.
```

### Prompt 2: Custom User Model

```
Extend the bookmarking service by implementing a custom User model with the following features:

1. Create a custom User model in the 'bookmarks' app that extends AbstractUser
2. Add fields for:
   - email (make it unique and required)
   - username (optional)
   - date_joined
   - last_login
   - is_active
   - auth_provider (CharField with choices for: 'email', 'github', 'telegram')
3. Set email as the USERNAME_FIELD
4. Create a UserManager class that handles creating users and superusers
5. Update settings.py to use the custom User model
6. Create migrations for the model
7. Implement a basic Django admin interface for the User model

Ensure the model is designed to support multiple authentication methods in the future.
```

### Prompt 3: JWT Authentication

```
Implement JWT-based authentication for the bookmarking service:

1. Add djangorestframework-simplejwt to requirements.txt
2. Configure JWT settings in settings.py:
   - Access token lifetime: 1 hour
   - Refresh token lifetime: 7 days
3. Create API endpoints for:
   - User registration (email/password)
   - Login (returning JWT tokens)
   - Token refresh
   - Logout (blacklisting tokens)
4. Implement permission classes for protected routes
5. Create serializers for user registration and login
6. Set up URL patterns for authentication endpoints
7. Add basic test cases for authentication flow

Ensure all authentication endpoints follow RESTful conventions and include appropriate validation.
```

### Prompt 4: Core Bookmark Model

```
Create the core Bookmark model for the bookmarking service:

1. In the 'bookmarks' app, create a Bookmark model with the following fields:
   - url (URLField, required)
   - title (CharField, required)
   - description (TextField, optional)
   - favicon_url (URLField, optional)
   - created_at (DateTimeField, auto_now_add)
   - updated_at (DateTimeField, auto_now)
   - user (ForeignKey to User model)
   - is_favorite (BooleanField, default=False)
   - is_pinned (BooleanField, default=False)
2. Add a Meta class for ordering (newest first)
3. Create a __str__ method that returns the title
4. Add validation for URL format
5. Create migrations for the model
6. Register the model in the admin interface
7. Create a basic test case for the model

Ensure proper indexing for fields that will be frequently queried.
```

### Prompt 5: Basic Bookmark API

```
Implement a RESTful API for bookmark management:

1. Set up Django REST Framework in settings.py
2. Create a BookmarkSerializer that includes all bookmark fields
3. Implement a BookmarkViewSet with standard CRUD operations:
   - List (GET) - with pagination (10 items per page)
   - Create (POST)
   - Retrieve (GET)
   - Update (PUT/PATCH)
   - Delete (DELETE)
4. Add permissions to ensure users can only access their own bookmarks
5. Configure URL patterns using DefaultRouter
6. Create basic filtering for is_favorite and is_pinned
7. Implement ordering by created_at (newest first by default)
8. Add test cases for all API endpoints

Ensure proper error handling and validation for all API operations.
```

## Phase 2: Tag Management System

### Prompt 6: Tag Model and Relationships

```
Create a tagging system for bookmarks:

1. Create a Tag model with:
   - name (CharField, required)
   - user (ForeignKey to User)
   - created_at (DateTimeField, auto_now_add)
   - is_ai_generated (BooleanField, default=False)
2. Create a BookmarkTag model for the many-to-many relationship with:
   - bookmark (ForeignKey to Bookmark)
   - tag (ForeignKey to Tag)
   - created_at (DateTimeField, auto_now_add)
3. Add a tags field to the Bookmark model (ManyToManyField through BookmarkTag)
4. Implement validation to ensure tag uniqueness per user
5. Update the BookmarkSerializer to include tags
6. Create migrations for the new models
7. Register models in the admin interface
8. Add test cases for tag creation and assignment

Ensure tags are properly indexed for efficient querying.
```

### Prompt 7: Tag API Endpoints

```
Implement API endpoints for tag management:

1. Create a TagSerializer that includes all tag fields
2. Implement a TagViewSet with CRUD operations:
   - List all tags for current user
   - Create new tags
   - Update existing tags
   - Delete tags (with warning about removing from bookmarks)
3. Extend the BookmarkViewSet to handle:
   - Adding tags to bookmarks
   - Removing tags from bookmarks
   - Filtering bookmarks by tags (exact match)
4. Update the BookmarkSerializer to handle tag assignments
5. Configure URL patterns for tag endpoints
6. Add permissions to ensure users can only access their own tags
7. Create test cases for tag API endpoints

Ensure proper error handling for tag operations, especially for deletion.
```

## Phase 3: Frontend Foundation

### Prompt 8: React Project Setup

```
Set up a React frontend project for the bookmarking service:

1. Create a new React application using Create React App or Vite
2. Set up the following directory structure:
   - src/
     - components/
     - pages/
     - services/
     - hooks/
     - utils/
     - assets/
     - context/
3. Install and configure dependencies:
   - react-router-dom for routing
   - axios for API requests
   - formik and yup for form handling
   - tailwindcss for styling
   - heroicons for icons
4. Create a basic API client using axios with:
   - Base URL configuration
   - Request/response interceptors for authentication
   - Error handling
5. Set up React Router with basic routes:
   - Home
   - Login
   - Register
   - Bookmarks
6. Create an AuthContext for managing authentication state
7. Implement a basic layout component

Ensure proper configuration for development and production environments.
```

### Prompt 9: Authentication UI

```
Implement authentication UI components for the bookmarking service:

1. Create a LoginPage component with:
   - Email and password inputs
   - Form validation
   - Error handling
   - "Remember me" checkbox
   - Login button
   - Link to registration page
2. Create a RegisterPage component with:
   - Email, username, and password inputs
   - Password confirmation
   - Form validation
   - Error handling
   - Register button
   - Link to login page
3. Implement an AuthContext provider that:
   - Manages authentication state
   - Handles token storage in localStorage
   - Provides login, register, and logout functions
4. Create a PrivateRoute component to protect authenticated routes
5. Add a user profile dropdown in the header
6. Implement a logout function

Ensure all forms have proper validation with user-friendly error messages.
```

### Prompt 10: Bookmark List and Creation UI

```
Create UI components for listing and creating bookmarks:

1. Implement a BookmarkList component that:
   - Fetches bookmarks from the API
   - Displays bookmarks in a responsive grid or list
   - Shows bookmark title, URL, and favicon
   - Includes options to edit, delete, or mark as favorite
   - Handles loading and error states
   - Implements pagination
2. Create a BookmarkItem component for individual bookmarks with:
   - Favicon display
   - Title and URL with proper truncation
   - Created timestamp
   - Action buttons (edit, delete, favorite, pin)
3. Implement a CreateBookmarkForm component:
   - URL input with validation
   - Title input
   - Description textarea
   - Submit button
   - Loading state during submission
4. Add a floating action button for creating new bookmarks
5. Implement sorting by date (newest first by default)

Ensure responsive design and accessibility for all components.
```

## Phase 4: Notes and Search Features

### Prompt 11: Notes Feature

```
Implement a notes feature for bookmarks:

1. Update the Bookmark model to include a notes field (TextField, optional)
2. Modify the BookmarkSerializer to include notes
3. Update the API to handle notes in create and update operations
4. Create a NotesEditor component in the frontend:
   - Textarea for editing notes
   - Save button
   - Character count
   - Auto-save functionality
5. Implement NotesView component for displaying formatted notes
6. Add notes to the BookmarkDetail page
7. Update the CreateBookmarkForm to include notes
8. Add test cases for notes functionality

Ensure proper validation and sanitization for note content.
```

### Prompt 12: Search and Filtering

```
Enhance the API and UI with search and filtering capabilities:

1. Implement backend search functionality:
   - Search by title (partial matches)
   - Filter by exact tag matches
   - Filter by favorite status
   - Filter by pinned status
2. Create API endpoints for search operations
3. Implement a SearchBar component in the frontend:
   - Input field with instant search
   - Clear button
   - Search history
4. Create FilterControls component:
   - Tag filter dropdown
   - Favorite filter toggle
   - Pinned filter toggle
5. Implement a SearchResultsPage that:
   - Displays results in the same format as BookmarkList
   - Shows applied filters
   - Allows clearing individual filters
6. Add keyboard shortcuts for search (e.g., '/' to focus search)
7. Create comprehensive test cases for search and filtering

Ensure efficient querying with proper indexing on the backend.
```

## Phase 5: Tag Management UI

### Prompt 13: Tag Management Interface

```
Create a comprehensive tag management interface:

1. Implement a TagsPage component that:
   - Lists all user's tags
   - Shows tag usage count
   - Provides options to edit or delete tags
   - Allows creation of new tags
2. Create a TagListItem component showing:
   - Tag name
   - Usage count
   - Edit and delete buttons
3. Implement a TagEditModal for editing tag names
4. Create a TagsFilterBar component for the BookmarkList:
   - Selected tags display
   - Tag selection dropdown
   - Clear filters button
5. Add a CreateTagForm component
6. Implement tag management in the BookmarkForm:
   - Add existing tags
   - Create new tags on-the-fly
   - Remove tags
7. Add proper validation for tag names

Ensure all tag operations provide immediate UI feedback with optimistic updates.
```

## Phase 6: LLM Integration for Auto-tagging

### Prompt 14: LLM Service Setup

```
Set up an LLM integration service for auto-tagging:

1. Install openai and langchain packages
2. Create an LLMService class with methods for:
   - Initializing the LLM client with API keys
   - Preparing prompts for tag generation
   - Handling API responses
   - Error handling and retries
3. Implement environment configuration for:
   - API keys storage
   - Model selection
   - Request parameters (temperature, max tokens)
4. Create a tag generation prompt template
5. Implement tag extraction from LLM responses
6. Add rate limiting to prevent API overuse
7. Create a fallback mechanism for API failures
8. Implement logging for all LLM interactions

Ensure secure handling of API keys and efficient prompt engineering.
```

### Prompt 15: Auto-tagging Implementation

```
Implement auto-tagging functionality for bookmarks:

1. Create a background task system using Celery:
   - Install Celery and configure it
   - Set up Redis as the message broker
2. Implement a task for generating tags:
   - Extract content from bookmark URL
   - Generate a context-aware prompt
   - Call the LLM service
   - Parse and validate returned tags
   - Save tags to the database
3. Modify the Bookmark model to track:
   - Auto-tagging status
   - Last tagging attempt
   - Tagging error (if any)
4. Update the bookmark creation flow to:
   - Accept a URL and initiate metadata extraction
   - Queue auto-tagging in background
   - Update the bookmark when tagging completes
5. Add API endpoints for:
   - Manually triggering auto-tagging
   - Getting auto-tagging status
6. Implement tag deduplication
7. Add maximum tag limit (5 AI-generated tags)

Ensure proper error handling and asynchronous processing for optimal performance.
```

### Prompt 16: Metadata Extraction

```
Create a service for extracting metadata from URLs:

1. Install requests, beautifulsoup4, and lxml packages
2. Implement a MetadataExtractor class with methods for:
   - Fetching page content safely
   - Extracting title from HTML
   - Extracting meta description
   - Finding favicon URL
3. Create a background task for metadata extraction
4. Modify the bookmark creation flow to:
   - Accept a URL and queue metadata extraction
   - Update the bookmark when extraction completes
5. Add error handling for:
   - Network failures
   - Invalid URLs
   - Missing metadata
6. Create API endpoints for:
   - Manually triggering metadata refresh
   - Previewing metadata before saving
7. Implement proper timeout handling

Ensure respectful web scraping practices with appropriate request headers and rate limiting.
```

### Prompt 17: Auto-tag UI Integration

```
Create UI components for managing AI-generated tags:

1. Implement an AITagsSection showing:
   - AI-generated tags with visual distinction
   - Accept/reject buttons for each tag
   - Status indicator during generation
   - Retry button for failed generation
2. Create a TagsSuggestionList component
3. Update the BookmarkForm to:
   - Show auto-tagging status
   - Display AI-generated tags
   - Allow accepting/rejecting individual tags
4. Implement a RefreshMetadataButton with loading state
5. Create error handling UI for failed auto-tagging
6. Add visual distinction between AI-generated and user-created tags
7. Implement optimistic UI updates

Ensure clear user feedback during the auto-tagging process.
```

## Phase 7: Chrome Extension

### Prompt 18: Chrome Extension Setup

```
Set up a Chrome extension project for the bookmarking service:

1. Create a manifest.json file (v3) with:
   - Basic extension information
   - Permissions for activeTab, storage, and host permissions
   - Action button configuration
2. Implement the extension structure:
   - popup/ directory for the popup UI
   - background/ for service worker
   - content/ for content scripts
   - assets/ for icons and images
3. Create a basic popup UI with:
   - Login form
   - Bookmark current page button
4. Implement a service worker for:
   - Authentication state management
   - API communication
   - Background tasks
5. Create content scripts for extracting page metadata
6. Set up extension storage for authentication tokens
7. Implement basic API client for backend communication

Ensure the extension follows Chrome's Manifest v3 requirements and security best practices.
```

### Prompt 19: Chrome Extension Authentication

```
Implement authentication for the Chrome extension:

1. Create a login popup with:
   - Email and password fields
   - "Remember me" option
   - Login button
   - Error handling
2. Implement secure token storage in chrome.storage.local
3. Create an authentication service that:
   - Handles login requests
   - Manages token refresh
   - Provides logout functionality
   - Checks authentication status
4. Implement an AuthStateManager in the service worker
5. Add API client interceptors for:
   - Adding authentication headers
   - Handling 401 errors with token refresh
6. Create UI components for:
   - Authenticated state
   - Unauthenticated state
   - Loading state
7. Implement proper error handling

Ensure secure handling of authentication tokens and proper session management.
```

### Prompt 20: Bookmark Creation in Extension

```
Implement bookmark creation functionality in the Chrome extension:

1. Create a BookmarkForm component in the popup:
   - Auto-filled URL and title from current page
   - Description input
   - Tags input with autocomplete
   - Save button
2. Implement a content script that:
   - Extracts page title, URL, description, and favicon
   - Sends data to the popup
3. Create a tag suggestion feature that:
   - Fetches user's existing tags
   - Provides autocomplete
4. Implement a success state with:
   - Confirmation message
   - View bookmark link
5. Add options for:
   - Mark as favorite
   - Pin bookmark
   - Add notes
6. Implement error handling for:
   - Network issues
   - Duplicate bookmarks
   - Validation errors

Ensure smooth user experience with minimal required inputs for quick bookmarking.
```

## Phase 8: Telegram Bot

### Prompt 21: Telegram Bot Setup

```
Set up a Telegram bot for the bookmarking service:

1. Install python-telegram-bot package
2. Create a TelegramBot class that:
   - Initializes the bot with token
   - Sets up command handlers
   - Configures error handling
3. Implement basic commands:
   - /start - Introduction and authentication
   - /help - List available commands
   - /login - Start authentication process
   - /status - Check connection status
4. Create a user binding mechanism:
   - Generate one-time tokens
   - Validate and link Telegram users to accounts
5. Set up webhook handling for production
6. Implement conversation handlers for multi-step interactions
7. Create a message queue for handling rate limits
8. Set up logging and monitoring

Ensure secure authentication flow and proper error handling for all commands.
```

### Prompt 22: Bookmark Management via Telegram

```
Implement bookmark management functionality in the Telegram bot:

1. Create command handlers for:
   - /save <url> - Save URL as bookmark
   - /list - Show recent bookmarks
   - /search <query> - Search bookmarks
   - /tags - List user's tags
2. Implement URL detection in regular messages
3. Create inline keyboard menus for:
   - Confirming bookmark creation
   - Adding tags to new bookmarks
   - Managing bookmark options (favorite, pin)
4. Implement conversation handlers for:
   - Adding notes to bookmarks
   - Adding tags
   - Editing bookmark details
5. Create paginated results for bookmark listings
6. Implement tag filtering via inline keyboards
7. Add support for inline mode to search bookmarks
8. Create proper error messages for all operations

Ensure user-friendly interactions with clear instructions and feedback.
```

### Prompt 23: Telegram Authentication Integration

```
Implement Telegram authentication for the web service:

1. Configure Telegram Login Widget settings:
   - Bot username
   - Bot token
   - Redirect URL
2. Implement backend authentication flow:
   - Telegram authentication data validation
   - User creation/retrieval
   - JWT token issuance
3. Create API endpoints for:
   - Validating Telegram login data
   - Converting Telegram data to JWT
4. Update the User model to store Telegram IDs
5. Create frontend components:
   - "Login with Telegram" button
   - Telegram login widget integration
   - Telegram account linking in user settings
6. Implement secure data validation for Telegram auth

Ensure proper validation of Telegram authentication data to prevent spoofing.
```

## Phase 9: GitHub Authentication and User Settings

### Prompt 24: GitHub OAuth Integration

```
Implement GitHub OAuth authentication:

1. Install django-allauth and configure it in settings.py
2. Set up GitHub OAuth application credentials in settings:
   - Client ID
   - Client Secret
   - Callback URL
3. Create a SocialApp instance for GitHub
4. Implement the backend authentication flow:
   - GitHub login URL generation
   - Callback handling
   - User creation/retrieval
   - JWT token issuance
5. Create API endpoints for:
   - Initiating GitHub OAuth flow
   - Handling OAuth callbacks
   - Converting OAuth tokens to JWT
6. Update the User model to store GitHub IDs
7. Create frontend components:
   - "Login with GitHub" button
   - OAuth callback handler
   - GitHub account linking in user settings
8. Implement error handling for OAuth failures

Ensure security best practices for OAuth flow and token handling.
```

### Prompt 25: User Settings and Password Reset

```
Implement user settings and password reset functionality:

1. Create models for password reset tokens
2. Set up email backend configuration
3. Implement API endpoints for:
   - Requesting password reset
   - Validating reset tokens
   - Setting new password
   - Updating user profile
4. Create email templates for password reset
5. Implement frontend pages:
   - UserSettingsPage with sections for profile, security, connections
   - ForgotPasswordPage with email input
   - ResetPasswordPage with token validation and new password form
6. Add form validation for password strength
7. Implement security measures:
   - Token expiration (24 hours)
   - One-time use tokens
   - Rate limiting for reset requests
8. Create comprehensive test cases for the reset flow

Ensure proper error handling and user feedback throughout the process.
```

## Phase 10: Data Export and Final Features

### Prompt 26: Data Export Functionality

```
Implement data export functionality:

1. Create an ExportService class with methods for:
   - Generating CSV exports
   - Generating JSON exports
   - Handling large datasets with chunking
2. Implement API endpoints for:
   - Requesting exports
   - Downloading export files
3. Create background tasks for generating exports
4. Implement security measures:
   - Temporary download links
   - Authentication for downloads
5. Create frontend components:
   - ExportModal with format selection
   - Download button
6. Add options for:
   - Selecting bookmark fields to export
   - Filtering by date range
   - Including tags and notes

Ensure efficient handling of large datasets and proper security for exported data.
```

### Prompt 27: Favorites and Pinned Bookmarks

```
Implement favorites and pinned bookmarks functionality:

1. Ensure the Bookmark model has:
   - is_favorite field with index
   - is_pinned field with index
2. Enhance the BookmarkSerializer to include these fields
3. Create API endpoints for:
   - Toggling favorite status
   - Toggling pinned status
   - Fetching favorite bookmarks
   - Fetching pinned bookmarks
4. Implement frontend components:
   - FavoriteButton with toggle functionality
   - PinButton with toggle functionality
   - FavoritesPage for viewing all favorites
   - PinnedSection at the top of BookmarkList
5. Add keyboard shortcuts for favorite/pin actions
6. Implement proper sorting (pinned items first)
7. Add test cases for favorites and pinned functionality

Ensure optimistic UI updates and proper syncing with the backend.
```

## Phase 11: Testing and Deployment

### Prompt 28: Comprehensive Testing

```
Implement comprehensive testing for the bookmarking service:

1. Set up testing frameworks:
   - pytest for backend
   - Jest and React Testing Library for frontend
   - Playwright for end-to-end tests
2. Create backend test suites for:
   - Models and validation
   - API endpoints
   - Authentication flows
   - Permission checks
   - Background tasks
3. Implement frontend test suites for:
   - Component rendering
   - User interactions
   - State management
   - API integrations
4. Create end-to-end test scenarios for:
   - User registration and login
   - Bookmark creation and management
   - Search and filtering
   - Extension functionality
5. Set up test fixtures and factories
6. Implement CI pipeline integration
7. Create test coverage reporting

Ensure all critical functionality is covered by tests to maintain code quality.
```

### Prompt 29: Production Deployment

```
Create a production deployment setup for the bookmarking service:

1. Finalize Docker configuration:
   - Dockerfile for backend
   - Dockerfile for frontend
   - docker-compose.yml for production setup
2. Create deployment scripts for:
   - Database migration
   - Static files collection
   - Environment configuration
3. Set up CI/CD pipeline:
   - GitHub Actions workflow
   - Build and test stages
   - Deployment automation
4. Implement environment-specific configurations:
   - Development
   - Staging
   - Production
5. Set up monitoring and logging:
   - Application metrics
   - Error tracking
   - Performance monitoring
6. Implement backup strategies
7. Create scaling configurations

Ensure secure handling of credentials and proper resource optimization.
```

### Prompt 30: Final Integration and Documentation

```
Complete the project with final integration and documentation:

1. Ensure all components work together seamlessly:
   - Web application
   - Chrome extension
   - Telegram bot
2. Create comprehensive documentation:
   - API documentation with examples
   - Installation and setup guide
   - User manual
   - Developer guide
3. Implement a simple onboarding flow for new users
4. Add a dashboard with usage statistics
5. Create "Getting Started" guides for each platform
6. Perform final security audit
7. Optimize performance across all platforms
8. Create a project roadmap for future enhancements

Ensure the application is user-friendly and all features are properly documented.
```
