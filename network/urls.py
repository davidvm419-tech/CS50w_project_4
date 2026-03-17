
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # JSON routes
    path("network/posts", views.posts, name="posts"),
    path("network/<int:user_id>", views.user_posts, name="user_posts"),
    path("network/create_post", views.create_post, name="create_post"),
    path("network/edit_post/<int:post_id>", views.edit_post, name="edit_post"),
    path("network/follow/<int:user_id>", views.follow_handle, name="follow_handle"),
    path("network/likes/<int:post_id>", views.like_handle, name="like_handle"),
    path("network/following/<int:user_id>", views.following_posts, name="following_posts"),
]
