from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Tag

User = get_user_model()


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""

    bookmark_count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ["id", "name", "created_at", "is_ai_generated", "bookmark_count"]
        read_only_fields = ["id", "created_at", "bookmark_count"]

    def get_bookmark_count(self, obj):
        """Get count of bookmarks using this tag."""
        return obj.bookmark_tags.count()

    def validate_name(self, value):
        """Validate tag name."""
        # Normalize to lowercase and strip whitespace
        name = value.lower().strip()

        if not name:
            raise serializers.ValidationError("Tag name cannot be empty")

        # Check for uniqueness per user
        user = self.context["request"].user
        if self.instance is None:  # Only check on creation
            if Tag.objects.filter(user=user, name=name).exists():
                raise serializers.ValidationError(
                    "You already have a tag with this name"
                )
        elif (
            Tag.objects.filter(user=user, name=name)
            .exclude(id=self.instance.id)
            .exists()
        ):
            raise serializers.ValidationError("You already have a tag with this name")

        return name

    def create(self, validated_data):
        """Create a new tag for the current user."""
        user = self.context["request"].user
        validated_data["user"] = user
        return super().create(validated_data)


class TagMinimalSerializer(serializers.ModelSerializer):
    """Minimal serializer for Tag model to use in nested contexts."""

    class Meta:
        model = Tag
        fields = ["id", "name"]
