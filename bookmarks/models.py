from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError


class UserManager(BaseUserManager):
    """Define a model manager for User model with email as the USERNAME_FIELD."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model with email as the unique identifier."""

    # Authentication provider choices
    EMAIL = "email"
    GITHUB = "github"
    TELEGRAM = "telegram"

    PROVIDER_CHOICES = [
        (EMAIL, "Email"),
        (GITHUB, "GitHub"),
        (TELEGRAM, "Telegram"),
    ]

    # Override username to make it optional
    username = models.CharField(_("username"), max_length=150, blank=True, null=True)
    # Make email required and unique
    email = models.EmailField(_("email address"), unique=True)
    # Override these fields for more explicit control
    date_joined = models.DateTimeField(_("date joined"), auto_now_add=True)
    last_login = models.DateTimeField(_("last login"), null=True, blank=True)
    is_active = models.BooleanField(_("active"), default=True)
    # New field for authentication provider
    auth_provider = models.CharField(
        _("authentication provider"),
        max_length=10,
        choices=PROVIDER_CHOICES,
        default=EMAIL,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # Email is already required as USERNAME_FIELD

    objects = UserManager()

    def __str__(self):
        return self.email


class Bookmark(models.Model):
    url = models.URLField(max_length=2000)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    favicon_url = models.URLField(max_length=2000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookmarks",
        db_index=True,
    )
    is_favorite = models.BooleanField(default=False, db_index=True)
    is_pinned = models.BooleanField(default=False, db_index=True)
    tags = models.ManyToManyField(
        "Tag", through="BookmarkTag", related_name="bookmarks"
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "is_favorite"]),
            models.Index(fields=["user", "is_pinned"]),
        ]

    def __str__(self):
        return self.title

    def clean(self):
        # Validate URL format
        validator = URLValidator()
        try:
            validator(self.url)
        except ValidationError:
            raise ValidationError({"url": "Enter a valid URL."})

        # If favicon_url is provided, validate it too
        if self.favicon_url:
            try:
                validator(self.favicon_url)
            except ValidationError:
                raise ValidationError(
                    {"favicon_url": "Enter a valid URL for the favicon."}
                )

        return super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Tag(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tags"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_ai_generated = models.BooleanField(default=False)

    class Meta:
        unique_together = ("name", "user")
        indexes = [
            models.Index(fields=["user", "name"]),
            models.Index(fields=["user", "is_ai_generated"]),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        """Ensure tag name is valid"""
        # Lower case tag name for consistency
        self.name = self.name.lower().strip()

        # Check for empty tag
        if not self.name:
            raise ValidationError({"name": "Tag name cannot be empty"})

        # Check for uniqueness per user
        if self.pk is None:  # Only check on creation
            if Tag.objects.filter(user=self.user, name=self.name).exists():
                raise ValidationError({"name": "This tag already exists for this user"})
        return super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class BookmarkTag(models.Model):
    bookmark = models.ForeignKey(
        Bookmark, on_delete=models.CASCADE, related_name="bookmark_tags"
    )
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name="bookmark_tags")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("bookmark", "tag")
        indexes = [
            models.Index(fields=["bookmark"]),
            models.Index(fields=["tag"]),
        ]

    def __str__(self):
        return f"{self.bookmark.title} - {self.tag.name}"
