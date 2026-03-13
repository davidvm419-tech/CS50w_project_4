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
    if request.user.is_authenticated:
        login_user = request.user.id
        user = request.user
    else:
        login_user = None
        user= None
    return JsonResponse({
        "posts": [post.serialize(user=user) for post in posts],
        "login_user": login_user,
        },
        status=200)


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
        user = request.user
    else:
        is_following = False
        user = None

    # return user posts, followers and login user (for following button) 
    return JsonResponse({
        "posts": [post.serialize(user=user) for post in user_posts],
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
    user_followers = Follow.objects.filter(following_id=user_id).count() 
    user_following = Follow.objects.filter(follower_id=user_id).count()
    user = User.objects.get(pk=user_id)
    username = user.username
    # Return response
    return JsonResponse({
        "followers": user_followers,
        "following": user_following,
        "is_following": is_follow,  
        "user": username 
        }, 
        status=200)


@login_required
def like_handle(request, post_id):
    if request.method != "POST":
        return JsonResponse({"error": "Wrong method, please use POST"}, status=400)
    
    # Get data
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Error sending data, JSON data invalid"}, status=400)
    is_liked = data.get("is_liked", "")

    # Update database
    if is_liked:
        Like.objects.filter(post_id=post_id, user_id=request.user.id).delete()
        is_liked = False
    else:
        Like.objects.get_or_create(post_id=post_id, user_id=request.user.id)
        is_liked = True

    # Get new likes value
    post_likes = Like.objects.filter(post=post_id).count()   

    # Return response
    return JsonResponse({
        "likes": post_likes,
        "is_liked": is_liked,    
    },
    status=200)


@login_required
def following_posts(request, user_id):
    # Get users that the login user is following (flat true returns a flat list of the users ids)
    following_users = Follow.objects.filter(follower=user_id).values_list("following_id", flat=True)
    
    # Get posts of the users that the login user is following (django iterates the list of users id's to get each user posts)
    posts = Post.objects.filter(user_id__in=following_users).order_by("-timestamp")

    # Return response
    return JsonResponse([post.serialize(user=request.user) for post in posts], safe=False, status=200)


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
        "post": post.serialize(user=request.user)}, 
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
