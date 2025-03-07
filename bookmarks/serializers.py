from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Bookmark, Tag, BookmarkTag

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
        queryset=Tag.objects.all(), many=True, write_only=True, required=False
    )
    url = serializers.URLField(max_length=2000)
    favicon_url = serializers.URLField(max_length=2000, required=False, allow_null=True)

    class Meta:
        model = Bookmark
        fields = [
            "id",
            "url",
            "title",
            "description",
            "favicon_url",
            "created_at",
            "updated_at",
            "is_favorite",
            "is_pinned",
            "tags",
            "tag_ids",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_tags(self, obj):
        bookmark_tags = BookmarkTag.objects.filter(bookmark=obj)
        tags = [bookmark_tag.tag for bookmark_tag in bookmark_tags]
        return TagSerializer(tags, many=True).data

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

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        bookmark = Bookmark.objects.create(**validated_data)

        for tag in tag_ids:
            BookmarkTag.objects.create(bookmark=bookmark, tag=tag)

        return bookmark

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop("tag_ids", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tag_ids is not None:
            # Clear existing tags
            BookmarkTag.objects.filter(bookmark=instance).delete()

            # Add new tags
            for tag in tag_ids:
                BookmarkTag.objects.create(bookmark=instance, tag=tag)

        return instance
