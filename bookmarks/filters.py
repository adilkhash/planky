import django_filters
from .models import Bookmark

import django_filters
from django.db.models import Q
from .models import Bookmark, Tag


class BookmarkFilter(django_filters.FilterSet):
    """
    Filter class for Bookmark model.
    Provides advanced filtering capabilities for bookmarks.
    """
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    updated_after = django_filters.DateTimeFilter(field_name='updated_at', lookup_expr='gte')
    updated_before = django_filters.DateTimeFilter(field_name='updated_at', lookup_expr='lte')

    # Text search filters
    title_contains = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    url_contains = django_filters.CharFilter(field_name='url', lookup_expr='icontains')
    description_contains = django_filters.CharFilter(field_name='description', lookup_expr='icontains')
    notes_contains = django_filters.CharFilter(field_name='notes', lookup_expr='icontains')

    # Tag filters
    has_tags = django_filters.BooleanFilter(method='filter_has_tags')
    has_tag_id = django_filters.NumberFilter(field_name='bookmark_tags__tag__id')
    has_tag_name = django_filters.CharFilter(field_name='bookmark_tags__tag__name', lookup_expr='iexact')

    # Advanced search filter (searches in multiple fields)
    search = django_filters.CharFilter(method='filter_search')

    # Status filters
    is_favorite = django_filters.BooleanFilter(field_name='is_favorite')
    is_pinned = django_filters.BooleanFilter(field_name='is_pinned')

    class Meta:
        model = Bookmark
        fields = {
            'is_favorite': ['exact'],
            'is_pinned': ['exact'],
        }

    def filter_has_tags(self, queryset, name, value):
        """Filter bookmarks that have any tags (or none)."""
        if value:
            return queryset.filter(bookmark_tags__isnull=False).distinct()
        else:
            return queryset.filter(bookmark_tags__isnull=True)

    def filter_search(self, queryset, name, value):
        """
        Advanced search filter that looks in multiple fields.
        Searches in title, description, URL, notes, and tag names.
        """
        if not value:
            return queryset

        # Split the search term into words for multi-word search
        terms = value.split()
        query = Q()

        for term in terms:
            query |= (
                    Q(title__icontains=term) |
                    Q(description__icontains=term) |
                    Q(url__icontains=term) |
                    Q(notes__icontains=term) |
                    Q(bookmark_tags__tag__name__icontains=term)
            )

        return queryset.filter(query).distinct()
