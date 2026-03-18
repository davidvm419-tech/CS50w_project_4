from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    pass


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self, user=None):
        # Change timestamp to local time zone
        local_time = timezone.localtime(self.timestamp)
        return {
            "id": self.id,
            "user_id": self.user.id,
            "user": self.user.username,
            "content": self.content,
            "timestamp": local_time.strftime("posted: %d-%m-%Y at %H:%M"),
            "likes": self.likes.count(),
            "is_liked": self.likes.filter(user=user).exists() if user else False   
        }


class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")



class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liked_posts")
