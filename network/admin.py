from django.contrib.auth.admin import UserAdmin
from django.contrib import admin



from .models import Post, Follow, Like, User

# Register your models here.
  

class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "content", "timestamp")
    search_fields = ("user__username", "content")
    
class FollowsAdmin(admin.ModelAdmin):
    list_display = ("id", "follower", "following")
    search_fields = ("follower__username", "following__username")
    list_filter = ("follower", "following")

class LikesAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user")
    search_fields = ("user__username", "post__content")
    list_filter = ("user",)

admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)
admin.site.register(Follow, FollowsAdmin)
admin.site.register(Like, LikesAdmin)
