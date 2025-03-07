from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import Bookmark, Tag, BookmarkTag, User


class BookmarkTagInline(admin.TabularInline):
    model = BookmarkTag
    extra = 1
    readonly_fields = ("created_at",)


class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("title", "url", "user", "is_favorite", "is_pinned", "created_at")
    list_filter = ("created_at", "user", "is_favorite", "is_pinned")
    search_fields = ("title", "url", "description")
    inlines = [BookmarkTagInline]
    fieldsets = (
        (None, {"fields": ("url", "title", "description", "favicon_url", "user")}),
        ("Status", {"fields": ("is_favorite", "is_pinned")}),
    )


class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "created_at", "is_ai_generated")
    list_filter = ("is_ai_generated", "user")
    search_fields = ("name",)
    readonly_fields = ("created_at",)


admin.site.register(Bookmark, BookmarkAdmin)
admin.site.register(Tag, TagAdmin)
admin.site.register(BookmarkTag)


class UserAdmin(BaseUserAdmin):
    """Define admin model for custom User model with email as the USERNAME_FIELD."""

    list_display = (
        "email",
        "username",
        "first_name",
        "last_name",
        "auth_provider",
        "is_staff",
        "is_active",
    )
    list_filter = ("is_staff", "is_superuser", "is_active", "auth_provider")
    search_fields = ("email", "username", "first_name", "last_name")
    ordering = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("username", "first_name", "last_name")}),
        (_("Authentication"), {"fields": ("auth_provider",)}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Important dates"), {"fields": ("last_login",)}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "auth_provider"),
            },
        ),
    )

    filter_horizontal = (
        "groups",
        "user_permissions",
    )


admin.site.register(User, UserAdmin)
