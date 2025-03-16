from rest_framework import viewsets, filters, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db.models import Count
from .models import Bookmark, Tag
from .serializers import BookmarkSerializer, UserSerializer
from .permissions import IsOwner
from .filters import BookmarkFilter
from .services import fetch_url_metadata

User = get_user_model()


class BookmarkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bookmarks.

    Supports:
    - Full CRUD operations
    - Search by title, description, URL, and notes
    - Filter by tags (single or multiple)
    - Filter by favorite/pinned status
    - Date range filtering
    - Sorting by various fields
    """

    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = BookmarkFilter
    search_fields = ["title", "description", "url", "notes"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-created_at"]  # Default ordering

    def get_queryset(self):
        """
        Get the list of bookmarks for the current user with optimized queries.
        """
        # Use select_related and prefetch_related for performance
        return (
            Bookmark.objects.filter(user=self.request.user)
            .select_related("user")
            .prefetch_related("bookmark_tags", "bookmark_tags__tag")
        )

    def perform_create(self, serializer):
        """
        Create a new bookmark and associate it with the current user.
        """
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def favorites(self, request):
        """
        Get all favorite bookmarks.

        Returns a paginated list of bookmarks where is_favorite is True.
        Any additional filtering parameters can be applied.
        """
        queryset = self.filter_queryset(self.get_queryset().filter(is_favorite=True))
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def pinned(self, request):
        """
        Get all pinned bookmarks.

        Returns a paginated list of bookmarks where is_pinned is True.
        Any additional filtering parameters can be applied.
        """
        queryset = self.filter_queryset(self.get_queryset().filter(is_pinned=True))
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def search_suggestions(self, request):
        """
        Get search suggestions based on bookmark titles.

        This endpoint is optimized for typeahead/autocomplete functionality.
        It returns a list of titles that match the query parameter 'q'.
        """
        query = request.query_params.get("q", "")
        if not query or len(query) < 2:
            return Response([])

        # Find matching bookmark titles, limit to 10 results
        suggestions = (
            Bookmark.objects.filter(user=request.user, title__icontains=query)
            .values_list("title", flat=True)
            .distinct()[:10]
        )

        return Response(list(suggestions))

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Get statistics about the user's bookmarks.

        Returns:
        - Total bookmark count
        - Favorite bookmark count
        - Pinned bookmark count
        - Tag count
        - Recently used tags
        """
        bookmarks = self.get_queryset()

        # Get tag stats
        user_tags = Tag.objects.filter(user=request.user)
        recent_tags = (
            Tag.objects.filter(bookmark_tags__bookmark__user=request.user)
            .annotate(usage_count=Count("bookmark_tags"))
            .order_by("-usage_count")[:5]
        )

        stats = {
            "total_bookmarks": bookmarks.count(),
            "favorite_bookmarks": bookmarks.filter(is_favorite=True).count(),
            "pinned_bookmarks": bookmarks.filter(is_pinned=True).count(),
            "total_tags": user_tags.count(),
            "recent_tags": [
                {"id": tag.id, "name": tag.name, "count": tag.usage_count}
                for tag in recent_tags
            ],
        }

        return Response(stats)

    @action(detail=False, methods=["post"])
    def fetch_metadata(self, request):
        """
        Fetch metadata from a URL including title and description.
        """
        url = request.data.get("url")
        if not url:
            return Response(
                {"error": "URL is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        metadata = fetch_url_metadata(url)
        return Response(metadata)


class UserViewSet(viewsets.ModelViewSet):
    """API endpoint for user management."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own profile
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    def get_permissions(self):
        """Set custom permissions for different actions."""
        if self.action == "create":
            return [permissions.AllowAny()]
        return super().get_permissions()
