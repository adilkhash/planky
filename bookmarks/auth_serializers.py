from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        max_length=128, min_length=8, write_only=True, style={"input_type": "password"}
    )
    password_confirm = serializers.CharField(
        max_length=128, min_length=8, write_only=True, style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
        ]
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
            "username": {"required": False},
        }

    def validate(self, data):
        if data["password"] != data.pop("password_confirm"):
            raise serializers.ValidationError(_("Passwords don't match."))
        return data

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        max_length=128,
        write_only=True,
        style={"input_type": "password"},
    )
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)

    def validate(self, data):
        email = data.get("email", None)
        password = data.get("password", None)

        if email is None:
            raise serializers.ValidationError(
                _("An email address is required to log in.")
            )

        if password is None:
            raise serializers.ValidationError(_("A password is required to log in."))

        user = authenticate(username=email, password=password)

        if user is None:
            raise serializers.ValidationError(
                _("A user with this email and password was not found.")
            )

        if not user.is_active:
            raise serializers.ValidationError(
                _("This user account has been deactivated.")
            )

        # Generate the JWT tokens
        refresh = RefreshToken.for_user(user)

        return {
            "email": user.email,
            "user": {
                "username":  getattr(user, "username", user.email),
                "email": user.email,
            },
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs["refresh"]
        return attrs

    def save(self, **kwargs):
        try:
            RefreshToken(self.token).blacklist()
        except Exception as e:
            raise serializers.ValidationError(str(e))
