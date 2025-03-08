from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import Bookmark, Tag, BookmarkTag
from .tag_serializers import TagMinimalSerializer


User = get_user_model()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "date_joined",
            "last_login",
            "is_active",
            "auth_provider",
        ]
        read_only_fields = ["id", "date_joined", "last_login"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class BookmarkSerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    url = serializers.URLField(max_length=2000)
    favicon_url = serializers.URLField(max_length=2000, required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Bookmark
        fields = [
            'id', 'url', 'title', 'description', 'notes', 'favicon_url',
            'created_at', 'updated_at', 'is_favorite', 'is_pinned',
            'tags', 'tag_ids', 'tag_names'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tags(self, obj):
        """Get tags for a bookmark."""
        bookmark_tags = BookmarkTag.objects.select_related('tag').filter(bookmark=obj)
        tags = [bookmark_tag.tag for bookmark_tag in bookmark_tags]
        return TagMinimalSerializer(tags, many=True).data

    def validate_url(self, value):
        """Validate URL format"""
        from django.core.validators import URLValidator
        from django.core.exceptions import ValidationError

        validator = URLValidator()
        try:
            validator(value)
        except ValidationError:
            raise serializers.ValidationError("Enter a valid URL.")
        return value

    def validate_favicon_url(self, value):
        """Validate favicon URL format if provided"""
        if value:
            from django.core.validators import URLValidator
            from django.core.exceptions import ValidationError

            validator = URLValidator()
            try:
                validator(value)
            except ValidationError:
                raise serializers.ValidationError("Enter a valid URL for the favicon.")
        return value

    def _process_tags(self, bookmark, tag_ids=None, tag_names=None):
        """Process tag_ids and tag_names to set bookmark tags."""
        user = self.context['request'].user

        # Clear existing bookmark tags
        BookmarkTag.objects.filter(bookmark=bookmark).delete()

        # Add tags from tag_ids
        if tag_ids:
            # Ensure the tags belong to the user
            valid_tag_ids = Tag.objects.filter(id__in=[tag.id for tag in tag_ids], user=user).values_list('id',
                                                                                                          flat=True)
            for tag_id in valid_tag_ids:
                BookmarkTag.objects.create(bookmark=bookmark, tag_id=tag_id)

        # Add tags from tag_names
        if tag_names:
            for tag_name in tag_names:
                tag_name = tag_name.lower().strip()
                if not tag_name:
                    continue

                # Get or create tag
                tag, created = Tag.objects.get_or_create(
                    user=user,
                    name=tag_name,
                    defaults={'is_ai_generated': False}
                )

                # Create bookmark tag if it doesn't exist
                BookmarkTag.objects.get_or_create(bookmark=bookmark, tag=tag)

    @transaction.atomic
    def create(self, validated_data):
        """Create a bookmark with tags."""
        tag_ids = validated_data.pop('tag_ids', [])
        tag_names = validated_data.pop('tag_names', [])

        bookmark = super().create(validated_data)
        self._process_tags(bookmark, tag_ids, tag_names)

        return bookmark

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update a bookmark with tags."""
        tag_ids = validated_data.pop('tag_ids', None)
        tag_names = validated_data.pop('tag_names', None)

        bookmark = super().update(instance, validated_data)

        # Only update tags if provided
        if tag_ids is not None or tag_names is not None:
            self._process_tags(bookmark, tag_ids, tag_names)

        return bookmark
