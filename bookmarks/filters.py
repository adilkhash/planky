import django_filters
from .models import Bookmark


class BookmarkFilter(django_filters.FilterSet):
    created_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )
    title_contains = django_filters.CharFilter(
        field_name="title", lookup_expr="icontains"
    )
    url_contains = django_filters.CharFilter(field_name="url", lookup_expr="icontains")

    class Meta:
        model = Bookmark
        fields = {
            "is_favorite": ["exact"],
            "is_pinned": ["exact"],
        }
