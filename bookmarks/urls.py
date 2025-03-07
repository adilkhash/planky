from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookmarkViewSet, UserViewSet
from .tag_views import TagViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r"bookmarks", BookmarkViewSet, basename="bookmark")
router.register(r"tags", TagViewSet, basename="tag")
router.register(r"users", UserViewSet, basename="user")

# The API URLs are now determined automatically by the router
urlpatterns = [
    path("", include(router.urls)),
    path("auth/", include("bookmarks.auth_urls")),
]
