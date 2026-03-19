# CS50W Project 4: Network

This is my implementation of CS50W’s Project 4: *Network*.  
The application is a social network Single Page Application (SPA) built with **JavaScript, HTML, and CSS** on the front end, and **Python and Django** on the back end. It supports creating posts, editing posts, viewing all posts, viewing user profiles, following other users, viewing posts from followed users, and liking posts.

---

## Features

### 1. New Post
Logged‑in users can create a new post from the form at the top of the page. Only authenticated users can submit posts.

### 2. All Posts
Displays all posts in the application, ordered from newest to oldest.  
Each post shows the username, timestamp, content, like count, a Like button (for other users), or an Edit button (if the post belongs to the logged‑in user).  
Clicking a username takes you to that user’s profile.  
This view is available to all users.

### 3. Profile Page
Shows all posts created by a specific user, along with:

- follower count  
- following count  
- Follow / Unfollow button (if viewing another user’s profile)

The follower count updates immediately when following or unfollowing.  
Posts appear in the same format as in the All Posts view.  
This view is available to all users.

### 4. Following
Displays posts only from users that the logged‑in user follows.  
Posts are shown in the same format as the All Posts view.

### 5. Pagination
If a page contains more than 10 posts, Previous and Next buttons appear.  
If there are fewer than 10 posts, the buttons remain hidden.  
Pagination is implemented in All Posts, Profile, and Following views.

### 6. Edit Post
When clicking the Edit button, the post owner is taken to an edit view where the original content is pre‑filled. After saving, the post is updated and the user is returned to the All Posts view.

### 7. Like and Unlike
Clicking the Like button increases the like count and changes the button to “Liked.”  
Clicking “Liked” decreases the count and returns the button to “Like.”

---

Feel free to explore the code or test the application.
