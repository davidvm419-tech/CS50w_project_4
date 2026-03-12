from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

import json

from .models import User, Post, Follow, Like


def index(request):
    return render(request, "network/index.html")

def posts(request):
    posts =Post.objects.all().order_by("-timestamp")
    return JsonResponse([post.serialize() for post in posts], safe=False)


def user_posts(request, user_id):
    # Get user and user posts
    user_posts = Post.objects.filter(user=user_id).order_by("-timestamp")

    # Get user followers and following 
    user_followers = Follow.objects.filter(following=user_id).count() 
    user_following = Follow.objects.filter(follower=user_id).count()

    # Check if login user follow this user
    login_user = request.user.id 
    if request.user.is_authenticated:
        is_following = Follow.objects.filter(follower=login_user, following=user_id).exists()
    else:
        is_following = False

    # return user posts, followers and login user (for following button) 
    return JsonResponse({
        "posts":[post.serialize() for post in user_posts],
        "followers": user_followers,
        "following": user_following,
        "login_user": login_user,
        "is_following": is_following, 
        },
        status=200)

@login_required 
def follow_handle(request, user_id):
    if request.method != "POST":
        return JsonResponse({"error": "Wrong method, please use POST"}, status=400)
    
    # Get data
    try:
        data =json.loads(request.body)
    except:
        return JsonResponse({"error": "Error sending data, JSON data invalid"}, status=400)
    is_follow = data.get("is_follow", "")

    # Check status of following to update database
    if is_follow:
        Follow.objects.filter(follower_id=request.user.id, following_id=user_id).delete()
        is_follow = False
    else:
        # Get or create avoids duplicades most safe
        Follow.objects.get_or_create(follower_id=request.user.id, following_id=user_id) 
        is_follow = True

    # Get updated values
    user_followers = Follow.objects.filter(following=user_id).count() 
    user_following = Follow.objects.filter(follower=user_id).count()

    # Return response
    return JsonResponse({
        "followers": user_followers,
        "following": user_following,
        "is_following": is_follow,   
        }, 
        status=200)


@login_required
def create_post(request):
    if request.method != "POST":
        return JsonResponse({"error": "Wrong method, please use POST"}, status=400)
    # Get data from JS
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Error sending data, JSON data invalid"}, status=400)
    content = data.get("content", "").strip()

    # check valid data
    if content == "":
        return JsonResponse({"error": "Please create a valid post"}, status=400)
    
    # save data in database
    post = Post(
        user=request.user,
        content= content,
    )

    post.save()

    # return response of success and the post to update the posts
    return JsonResponse({
        "message": "Post published", 
        "post": post.serialize()}, 
        status=200)



def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
