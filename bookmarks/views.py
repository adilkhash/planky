from rest_framework import viewsets, filters, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from .models import Bookmark, Tag, BookmarkTag
from .serializers import BookmarkSerializer, UserSerializer
from .permissions import IsOwner
from .filters import BookmarkFilter

User = get_user_model()


class BookmarkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bookmarks.

    list:
        Get a paginated list of all bookmarks belonging to the current user.

    create:
        Create a new bookmark.

    retrieve:
        Get details of a specific bookmark.

    update:
        Update all fields of a specific bookmark.

    partial_update:
        Update specific fields of a bookmark.

    destroy:
        Delete a bookmark.
    """

    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = BookmarkFilter
    search_fields = ["title", "description", "url"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-created_at"]  # Default ordering

    def get_queryset(self):
        """
        Get the list of bookmarks for the current user.
        """
        queryset = Bookmark.objects.filter(user=self.request.user)

        # Filter by tag_id if provided
        tag_id = self.request.query_params.get("tag_id", None)
        if tag_id:
            queryset = queryset.filter(bookmark_tags__tag_id=tag_id)

        # Filter by tag_name if provided
        tag_name = self.request.query_params.get("tag_name", None)
        if tag_name:
            queryset = queryset.filter(bookmark_tags__tag__name__iexact=tag_name)

        return queryset

    def perform_create(self, serializer):
        """
        Create a new bookmark and associate it with the current user.
        """
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        """
        Get a paginated list of bookmarks with optional filtering.
        """
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Create a new bookmark.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def retrieve(self, request, *args, **kwargs):
        """
        Get details of a specific bookmark.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """
        Update all fields of a specific bookmark.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a bookmark.
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"])
    def favorites(self, request):
        """
        Get all favorite bookmarks.
        """
        bookmarks = self.get_queryset().filter(is_favorite=True)
        page = self.paginate_queryset(bookmarks)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(bookmarks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def pinned(self, request):
        """
        Get all pinned bookmarks.
        """
        bookmarks = self.get_queryset().filter(is_pinned=True)
        page = self.paginate_queryset(bookmarks)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(bookmarks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_tag(self, request, pk=None):
        """
        Add a tag to a bookmark.

        Can add by tag_id or tag_name. If using tag_name and the tag
        doesn't exist, it will be created.
        """
        bookmark = self.get_object()

        # Check if tag_id is provided
        tag_id = request.data.get("tag_id")
        tag_name = request.data.get("tag_name")

        if not tag_id and not tag_name:
            return Response(
                {"detail": "Either tag_id or tag_name must be provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if tag_id:
            try:
                # Ensure the tag belongs to the user
                tag = Tag.objects.get(id=tag_id, user=request.user)
            except Tag.DoesNotExist:
                return Response(
                    {"detail": "Tag not found"}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Normalize tag name
            tag_name = tag_name.lower().strip()
            if not tag_name:
                return Response(
                    {"detail": "Tag name cannot be empty"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get or create tag
            tag, created = Tag.objects.get_or_create(
                user=request.user, name=tag_name, defaults={"is_ai_generated": False}
            )

        # Check if the bookmark already has this tag
        if BookmarkTag.objects.filter(bookmark=bookmark, tag=tag).exists():
            return Response(
                {"detail": "This bookmark already has this tag"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create bookmark tag
        BookmarkTag.objects.create(bookmark=bookmark, tag=tag)

        # Return updated bookmark
        serializer = self.get_serializer(bookmark)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def remove_tag(self, request, pk=None):
        """
        Remove a tag from a bookmark.
        """
        bookmark = self.get_object()

        # Check if tag_id is provided
        tag_id = request.data.get("tag_id")
        tag_name = request.data.get("tag_name")

        if not tag_id and not tag_name:
            return Response(
                {"detail": "Either tag_id or tag_name must be provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Try to find the bookmark tag
        if tag_id:
            bookmark_tag = BookmarkTag.objects.filter(
                bookmark=bookmark, tag_id=tag_id
            ).first()
        else:
            tag_name = tag_name.lower().strip()
            bookmark_tag = BookmarkTag.objects.filter(
                bookmark=bookmark, tag__name=tag_name, tag__user=request.user
            ).first()

        if not bookmark_tag:
            return Response(
                {"detail": "This bookmark does not have this tag"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Delete the bookmark tag
        bookmark_tag.delete()

        # Return updated bookmark
        serializer = self.get_serializer(bookmark)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def by_tag(self, request):
        tag_id = request.query_params.get("tag_id")
        if tag_id:
            bookmarks = Bookmark.objects.filter(
                user=request.user, bookmark_tags__tag_id=tag_id
            )
            serializer = self.get_serializer(bookmarks, many=True)
            return Response(serializer.data)
        return Response({"error": "Tag ID is required"}, status=400)


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
