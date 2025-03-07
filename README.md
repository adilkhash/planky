# Planky - Bookmarking Service

Planky is a modern bookmarking service with a RESTful API that allows users to save, organize, and retrieve their bookmarks.

## Features

- **User Authentication**: Secure authentication with JWT tokens
- **Bookmark Management**: Create, read, update, and delete bookmarks
- **Organization**: Tag bookmarks, mark as favorite or pinned
- **Advanced Filtering**: Search, filter, and sort bookmarks
- **RESTful API**: Comprehensive API for integration with other services

## Technology Stack

- **Backend**: Django with Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker with docker-compose

## Getting Started

### Prerequisites

- Docker and docker-compose installed on your system

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values as needed
3. Build and start the containers:

```bash
docker-compose up --build
```

4. Access the API at http://localhost:8000/api/

### Creating a superuser

```bash
docker-compose exec web python manage.py createsuperuser
```

## API Documentation

The API provides endpoints for managing bookmarks, tags, and user authentication. Key endpoints include:

- `/api/auth/register/`: Register a new user
- `/api/auth/login/`: Authenticate and receive JWT tokens
- `/api/bookmarks/`: List and create bookmarks
- `/api/bookmarks/{id}/`: Retrieve, update, or delete a bookmark
- `/api/bookmarks/favorites/`: List favorite bookmarks
- `/api/bookmarks/pinned/`: List pinned bookmarks
- `/api/tags/`: List and create tags

Full API documentation is available in the [API Documentation](API_DOCUMENTATION.md) file.

## Authentication

The API uses JWT tokens for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

## Features

### Bookmark Management

- Create bookmarks with URL, title, description, and favicon
- Mark bookmarks as favorite or pinned
- Organize bookmarks with tags
- Search and filter your bookmark collection

### Advanced Filtering

- Filter by favorite or pinned status
- Search in title, description, and URL
- Filter by creation date
- Order by various fields

## Development

### Running Tests

```bash
docker-compose exec web python manage.py test
```

### API Endpoints

The API follows RESTful conventions and includes:

- Pagination (10 items per page)
- Proper error handling
- Validation for all inputs
- Comprehensive test suite

## License

This project is licensed under the MIT License - see the LICENSE file for details.
