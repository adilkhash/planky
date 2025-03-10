from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.db import transaction

from .models import Tag, BookmarkTag, Bookmark
from .tag_serializers import TagSerializer
from .permissions import IsOwner

User = get_user_model()


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tags.

    list:
        Get a list of all tags belonging to the current user.

    create:
        Create a new tag.

    retrieve:
        Get details of a specific tag.

    update:
        Update all fields of a specific tag.

    partial_update:
        Update specific fields of a tag.

    destroy:
        Delete a tag. This will also remove the tag from all bookmarks.
    """

    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]  # Default ordering

    def get_queryset(self):
        """Get the list of tags for the current user."""
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create a new tag and associate it with the current user."""
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        """Get a list of tags with optional filtering."""
        queryset = self.filter_queryset(self.get_queryset())

        # Optionally include bookmark count
        include_count = (
            request.query_params.get("include_count", "false").lower() == "true"
        )
        if include_count:
            queryset = queryset.annotate(bookmark_count=Count("bookmark_tags"))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a tag and remove it from all bookmarks.

        Returns:
            Response with a warning message if the tag was associated with bookmarks.
        """
        tag = self.get_object()

        # Count the number of bookmarks using this tag
        bookmark_count = BookmarkTag.objects.filter(tag=tag).count()

        with transaction.atomic():
            # Delete all BookmarkTag associations first
            bookmark_tag_ids = list(
                BookmarkTag.objects.filter(tag=tag).values_list(
                    "bookmark_id", flat=True
                )
            )
            BookmarkTag.objects.filter(tag=tag).delete()

            # Then delete the tag
            tag.delete()

        # If the tag was associated with bookmarks, include a warning
        if bookmark_count > 0:
            message = f"Tag was deleted and removed from {bookmark_count} bookmark(s)."
            return Response({"detail": message}, status=status.HTTP_200_OK)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def bookmarks(self, request, pk=None):
        """Get all bookmarks for a specific tag."""
        tag = self.get_object()
        bookmarks = Bookmark.objects.filter(user=request.user, bookmark_tags__tag=tag)

        from .serializers import (
            BookmarkSerializer,
        )  # Import here to avoid circular import

        page = self.paginate_queryset(bookmarks)
        if page is not None:
            serializer = BookmarkSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = BookmarkSerializer(
            bookmarks, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def popular(self, request):
        """Get the most popular tags for the current user."""
        limit = int(request.query_params.get("limit", 10))

        popular_tags = (
            Tag.objects.filter(user=request.user)
            .annotate(bookmark_count=Count("bookmark_tags"))
            .order_by("-bookmark_count")[:limit]
        )

        serializer = self.get_serializer(popular_tags, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def unused(self, request):
        """Get tags that aren't associated with any bookmarks."""
        unused_tags = (
            Tag.objects.filter(user=request.user)
            .annotate(bookmark_count=Count("bookmark_tags"))
            .filter(bookmark_count=0)
        )

        page = self.paginate_queryset(unused_tags)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(unused_tags, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def bulk_delete(self, request):
        """Delete multiple tags at once."""
        tag_ids = request.data.get("tag_ids", [])
        if not tag_ids:
            return Response(
                {"detail": "No tag IDs provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure all tags belong to the user
        tags = Tag.objects.filter(id__in=tag_ids, user=request.user)

        if len(tags) != len(tag_ids):
            return Response(
                {"detail": "Some tags were not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Count bookmarks associated with these tags
        bookmark_count = BookmarkTag.objects.filter(tag__in=tags).count()

        with transaction.atomic():
            # Delete all BookmarkTag associations first
            BookmarkTag.objects.filter(tag__in=tags).delete()

            # Delete the tags
            deleted_count = tags.delete()[0]

        message = f"Deleted {deleted_count} tag(s). Removed from {bookmark_count} bookmark association(s)."
        return Response({"detail": message}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def merge(self, request):
        """
        Merge multiple tags into one.

        Request body should include:
        - source_tag_ids: List of tag IDs to merge from
        - target_tag_id: ID of the tag to merge into

        All bookmarks associated with the source tags will be
        associated with the target tag, and the source tags will be deleted.
        """
        source_tag_ids = request.data.get("source_tag_ids", [])
        target_tag_id = request.data.get("target_tag_id")

        if not source_tag_ids or not target_tag_id:
            return Response(
                {"detail": "Both source_tag_ids and target_tag_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ensure all tags belong to the user
        all_tag_ids = source_tag_ids + [target_tag_id]
        tags = Tag.objects.filter(id__in=all_tag_ids, user=request.user)

        if len(tags) != len(all_tag_ids):
            return Response(
                {"detail": "Some tags were not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get the target tag
        try:
            target_tag = Tag.objects.get(id=target_tag_id, user=request.user)
        except Tag.DoesNotExist:
            return Response(
                {"detail": "Target tag not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get the source tags
        source_tags = Tag.objects.filter(id__in=source_tag_ids, user=request.user)

        with transaction.atomic():
            # For each bookmark associated with a source tag, create a new association
            # with the target tag (if it doesn't already exist)
            bookmark_tag_count = 0

            for source_tag in source_tags:
                # Get all bookmarks associated with this source tag
                bookmark_tags = BookmarkTag.objects.filter(tag=source_tag)
                bookmark_ids = [bt.bookmark_id for bt in bookmark_tags]

                # Create new associations with target tag
                for bookmark_id in bookmark_ids:
                    # Check if the association already exists
                    if not BookmarkTag.objects.filter(
                        bookmark_id=bookmark_id, tag=target_tag
                    ).exists():
                        BookmarkTag.objects.create(
                            bookmark_id=bookmark_id, tag=target_tag
                        )
                        bookmark_tag_count += 1

                # Delete the source tag and its associations
                bookmark_tags.delete()
                source_tag.delete()

        message = f"Merged {len(source_tags)} tag(s) into '{target_tag.name}'. Added {bookmark_tag_count} new bookmark associations."
        return Response({"detail": message}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def details(self, request, pk, *args, **kwargs):
        """
        Get detailed information about a specific tag.

        Returns:
        - Basic tag information (id, name, created_at)
        - Total number of bookmarks using this tag
        - Recent bookmarks (up to 5) using this tag
        - Usage statistics
        - Related tags (tags that appear together with this tag)
        """
        tag = self.get_object()

        # Get basic tag information using the standard serializer
        tag_data = self.get_serializer(tag).data

        # Get bookmark statistics
        bookmark_count = BookmarkTag.objects.filter(tag=tag).count()

        # Get recent bookmarks using this tag
        recent_bookmarks = Bookmark.objects.filter(
            user=request.user, bookmark_tags__tag=tag
        ).order_by("-created_at")[:10]

        from .serializers import BookmarkSerializer

        bookmark_serializer = BookmarkSerializer(recent_bookmarks, many=True)

        response_data = {
            **tag_data,
            "statistics": {
                "total_bookmarks": bookmark_count,
                "recent_bookmarks": bookmark_serializer.data,
            },
        }

        return Response(response_data)
