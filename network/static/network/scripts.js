document.addEventListener("DOMContentLoaded", function() {
    
    const postView = document.querySelector("#form-submit")
    

    // Avoid error rendering the post if the user is not log in
    if (postView) {
        // SP views load
        postView.addEventListener("click", createPost)   
        document.querySelector("#user-view").style.display = "none"
        document.querySelector("#following-view").style.display = "none"
        document.querySelector("#edit-post-view").style.display = "none"
    }

    // Load posts (avoid error when log out)
    const posts = document.querySelector("#app-posts")
    if (posts) {
        loadPosts()
    }
})

function createPost(e) {
    // Prevent page realoading
    e.preventDefault()
    // Get data from the form
    const content = document.querySelector("#post-text").value
    // Send data to the back end
    fetch("/network/create_post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": Cookies.get("csrftoken")
        },
        body: JSON.stringify({
            content: content,
        })
    })

    // Return message of success or failed and add post to the feed
   .then(response => response.json())
   .then(result => {
    // Clear the content post
    document.querySelector("#post-text").value = ""
    // Load all posts view and show alert message
    document.querySelector("#app-posts").style.display = "block"
    loadPosts()
    if (result.error) {
        alertMessage(result.error, "warning")
    } else {
        alertMessage(result.message, "success")
    }
   })
}


function editPost(post_id, post_content) {
    // Show edit view and hide the others
    document.querySelector("#create-post-view").style.display = "none"
    document.querySelector("#app-posts").style.display = "none"
    document.querySelector("#user-view").style.display = "none"
    document.querySelector("#following-view").style.display = "none"
    document.querySelector("#pagination-container").style.display = "none"
    document.querySelector("#edit-post-view").style.display = "block"

    // Render post data in the form
    document.querySelector("#edit-text").value = post_content
    
    // Handle button submit 
    const editSubmit = document.querySelector("#edit-form-submit")

    editSubmit.onclick  = (e) => handleEditSubmit(e, post_id)
}


function handleEditSubmit(e, post_id) {
    // Avoid page reload
    e.preventDefault()    

    // Get updated content
    const content = document.querySelector("#edit-text").value

    // Send content to back end
    fetch(`/network/edit_post/${post_id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": Cookies.get("csrftoken")
        },
        body: JSON.stringify({
            content: content,
        })
    })

    // Get response and display message
    .then(response => response.json())
    .then(result => {
        // Load all posts view and show alet message
        document.querySelector("#edit-post-view").style.display = "none"
        document.querySelector("#create-post-view").style.display = "block"
        document.querySelector("#app-posts").style.display = "block"
        document.querySelector("#pagination-container").style.display = "block"
        loadPosts()

        if (result.error) {
            alertMessage(result.error, "warning")
        } else {
            alertMessage(result.message, "success")
        }
    })
}


function loadPosts() {
    // Clear view to avoid duplicates
    document.querySelector("#app-posts").innerHTML = ""

    // Get page from url updated by pagination function, default 1
    const page = new URLSearchParams(window.location.search).get("page") || 1;

    // Fetch database for all posts and current page pass from pagination function
    fetch(`/network/posts?page=${page}`)
    .then(response => {
        // Check for error in response
        if (!response.ok) {
            throw new Error(`error! Status: ${response.status}`)
        }
        return response.json()
    })
    .then(data => {
        // Pass login user
        const loginUser = data.login_user;

        // Hide page container if there's not previous and next pages
        if (!data.pagination.has_previous && !data.pagination.has_next) {
            document.querySelector("#pagination-container").style.display = "none"
        } else {
            // Pass pagination data and the function to execute
            pagination(data.pagination, loadPosts)
        }

        data.posts.forEach(item => {

            // Create div for post
            const postDiv = document.createElement("div");
            postDiv.className = "posts-list"
            // Create elements to the div
            const user = document.createElement("h2");
            user.textContent = item.user
            const content = document.createElement("p");
            content.textContent = item.content
            const timestamp = document.createElement("small");
            timestamp.textContent = item.timestamp
            const heading = document.createElement("h1");
            heading.textContent = "Post:"
            const likesNum = document.createElement("p");
            // Set id with item id allows to see the update without reloading the page on every view
            likesNum.id = `likes-num-allposts-${item.id}`
            likesNum.textContent = `Likes ${item.likes}`
            const likeButton = document.createElement("button");
            likeButton.id = `like-btn-allposts-${item.id}   `
            postDiv.append(user, heading, content, timestamp, likesNum)

            // Avoid user who owns the post to have the like button and have the edit button
            if (loginUser === item.user_id) {
                const editButton = document.createElement("button");
                editButton.id = `edit-btn-allPosts-${item.id}` 
                editButton.textContent = "Edit Post" 
                document.querySelector("#app-posts").append(postDiv, editButton)

                // Handle edit button
                editButton.onclick = () => editPost(item.id, item.content)       
            } else {
                likeButton.textContent = item.is_liked ? "Unlike" : "Like"
                document.querySelector("#app-posts").append(postDiv, likeButton)
            }
            
            // Send to user profile
            user.onclick = () => userProfile(item.user_id)

            // Send user to login or update the like
            if (loginUser === null) {
                likeButton.onclick = () => window.location.href = "/login"
            } else {
                likeButton.onclick = () => likeHandle(item.id, item.is_liked, likesNum, likeButton)    
            }

            // Show ediit button if the use owns the post   
        }) 
    })
    .catch(error => alert(`Error: ${error}`))
}


function userProfile(user_id) {
    // Show user view
    const postView = document.querySelector("#create-post-view");
    if (postView) {
        postView.style.display = "none"
        document.querySelector("#following-view").style.display = "none"
        document.querySelector("#edit-post-view").style.display = "none"
    }
    document.querySelector("#app-posts").style.display = "none"
    document.querySelector("#user-view").style.display = "block"

    // Clear view to avoid duplicates
    document.querySelector("#user-view").innerHTML = ""

    // Get page from url updated by pagination function, default 1
    const page = new URLSearchParams(window.location.search).get("page") || 1;    

    // Fetch user poosts
    fetch(`/network/${user_id}?page=${page}`)

    // Check for error in response
    .then(response => {
        if (!response.ok) {
            throw new Error(`error! Status: ${response.status}`)
        }
        return response.json()
    })
    .then(data => {
        // Pass user id and login user id
        const loginUser = data.login_user;
        const userProfileId = data.posts.length > 0 ? data.posts[0].user_id : user_id;

        // Render username, user followers and the users is following
        const userInfoDiv = document.createElement("div")
        
        
        // Create elements to the div
        userInfoDiv.className = "user-information"
        const user = document.createElement("h2");
        const userExists = data.posts.length > 0 ? data.posts[0].user : "User hasn't post to display"  
        user.textContent = `Posts by: ${userExists}`
        const followers = document.createElement("p");
        followers.id = "user-followers"
        followers.textContent = `Followers: ${data.followers}`
        const following = document.createElement("p");
        following.id = "user-follows"
        following.textContent = `Users ${userExists} follow: ${data.following}`
        userInfoDiv.append(user, followers, following)

        // Check for display follow button

        if (loginUser === userProfileId) {
            document.querySelector("#user-view").append(userInfoDiv)
        } else {
            const followButton = document.createElement("button");
            followButton.id = "follow-btn"
            followButton.textContent = data.is_following ? "Unfollow" : "Follow"
            document.querySelector("#user-view").append(userInfoDiv, followButton)

            // Send user to login or update the follow status
            if (data.login_user === null) {
                followButton.onclick = () => window.location.href = "/login"
            }
            else {
                followButton.onclick = () => followHandle(userProfileId, data.is_following)
            }
        }

        // Hide page container if there's not previous and next pages
        if (!data.pagination.has_previous && !data.pagination.has_next) {
            document.querySelector("#pagination-container").style.display = "none"
        } else {
            // Pass pagination data and the function to execute
            pagination(data.pagination, () => userProfile(userProfileId))
        }

        // Render user posts
        data.posts.forEach(item => {
            const userPostDiv = document.createElement("div");
            userPostDiv.className = "posts-list"

            // Create elements to the div
            const content = document.createElement("p");
            content.textContent = item.content
            const timestamp = document.createElement("small");
            timestamp.textContent = item.timestamp
            const heading = document.createElement("h1");
            heading.textContent = "Post:"
            const likesNum = document.createElement("p");
            likesNum.id = `likes-num-user${item.id}`
            likesNum.textContent = `Likes ${item.likes}`
            const likeButton = document.createElement("button");
            likeButton.id = `like-btn-user ${item.id}`
            userPostDiv.append(heading, content, timestamp, likesNum)

            // Avoid user who owns the post to have the like button and have the edit button    
            if (loginUser === userProfileId) {
                const editButton = document.createElement("button");
                editButton.id = `edit-btn-userProfile-${item.id}`
                editButton.textContent = "Edit Post"
                document.querySelector("#user-view").append(userPostDiv, editButton)
                
                // Handle edit button
                editButton.onclick = () => editPost(item.id, item.content)
            } else {
                likeButton.textContent = item.is_liked ? "Unlike" : "Like"
                document.querySelector("#user-view").append(userPostDiv, likeButton)      
            }
            
            // Send user to login or update the like
            if (loginUser === null) {
                likeButton.onclick = () => window.location.href = "/login"
            } else {
                likeButton.onclick = () => likeHandle(item.id, item.is_liked, likesNum, likeButton)    
            }
        })
    })
    .catch(error => alert(`error: ${error}`))
}

function followHandle(user_id, follow_status) {
    // Send data to back end
    fetch(`/network/follow/${user_id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": Cookies.get("csrftoken"),
        },
        body: JSON.stringify({
            is_follow: follow_status,
        })
    })
    .then(response => response.json())
    .then(data => {
        // Update followers numbers
        document.querySelector("#user-followers").textContent = `Followers: ${data.followers}`
        document.querySelector("#user-follows").textContent = `Users ${data.user} follow: ${data.following}`
        
        // Update follow button
        const button = document.querySelector("#follow-btn");
        button.textContent = data.is_following ? "Unfollow" : "Follow"

        // Update button handling
        button.onclick = () => followHandle(user_id, data.is_following)
    }) 
}


function likeHandle(post_id, like_status, likesNum, button) {
    // Send data to back end
    fetch(`/network/likes/${post_id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": Cookies.get("csrftoken"),
        },
        body: JSON.stringify({
            is_liked: like_status,
        })
    })
    .then(response => response.json())
    .then(data => {
        // Update like status
        likesNum.textContent = `Likes ${data.likes}`
        
        // Update like button
        button.textContent = data.is_liked ? "Unlike" : "Like"

        // Update button handling     
        button.onclick = () => likeHandle(post_id, data.is_liked, likesNum, button)    
    })
}


function followingView(user_id) {
    // show following view
    document.querySelector("#create-post-view").style.display = "none"
    document.querySelector("#app-posts").style.display = "none"
    document.querySelector("#user-view").style.display = "none"
    document.querySelector("#edit-post-view").style.display = "none"
    document.querySelector("#following-view").style.display = "block"
    
    
    // Clear view to avoid duplicates
    document.querySelector("#following-view").innerHTML = ""

    // Get page from url updated by pagination function, default 1
    const page = new URLSearchParams(window.location.search).get("page") || 1;

    // Fetch user id
    fetch(`/network/following/${user_id}?page=${page}`)

    // Check for error in response
    .then(response => {
        if (!response.ok) {
            throw new Error(`error! Status: ${response.status}`)
        }
        return response.json()
    })
    .then(data => {
        // User friendly message if isn't following anyone
        if (data.message) {
            document.querySelector("#pagination-container").style.display = "none"
            const container = document.querySelector("#following-view")
            const messageContainer = document.createElement("h1")
            messageContainer.textContent = data.message
            container.append(messageContainer)
            // Code stops here because there are not posts to render
            return;
        } 

        // Hide page container if there's not previous and next pages
        if (!data.pagination.has_previous && !data.pagination.has_next) {
            document.querySelector("#pagination-container").style.display = "none"
        } else {
            // Pass pagination data and the function to execute
            pagination(data.pagination, () => followingView(user_id))
        }

        data.posts.forEach(item => {
        
        // Create div for posts
        const postDiv = document.createElement("div");
        postDiv.className = "posts-list"

        // Create elements to the div
        const user = document.createElement("h2");
        user.textContent = item.user
        const content = document.createElement("p");
        content.textContent = item.content
        const timestamp = document.createElement("small");
        timestamp.textContent = item.timestamp
        const likeButton = document.createElement("button");
        likeButton.id = `like-btn-following-${item.id}`
        likeButton.textContent = item.is_liked ? "Unlike" : "Like"
        const heading = document.createElement("h1");
        heading.textContent = "Post:"
        const likesNum = document.createElement("p");
        likesNum.id = `likes-num-following-${item.id}`
        likesNum.textContent = `Likes ${item.likes}`
        postDiv.append(user, heading, content, timestamp, likesNum, likeButton)
        document.querySelector("#following-view").append(postDiv)
        
        // Send to user profile
        user.onclick = () => userProfile(item.user_id)

        // Handle like button
        likeButton.onclick = () => likeHandle(item.id, item.is_liked, likesNum, likeButton)
        })
    })
    .catch(error => alert(`Error: ${error}`))
}


// Auxiliary alert messages function when creating and editing posts
function alertMessage(message, messageType) {
    const alertMessage = document.querySelector("#alert-message");
    alertMessage.className = `alert alert-${messageType}`
    alertMessage.textContent = message
    alertMessage.style.display = "block"

    // Hide message after 5 seconds
    setTimeout(() => {
        alertMessage.style.display = "none"
    }, 5000)  
}


// Auxiliary function to handle pagination
function pagination(paginationData, viewCall) {
    const previousPage = document.querySelector("#page-item-previous");
    const previousLink = document.querySelector("#page-link-previous"); 
    const nextPage = document.querySelector("#page-item-next"); 
    const nextLink = document.querySelector("#page-link-next");  

    // Disable previous button if there is no previous page
    if (!paginationData.has_previous) {
        previousPage.classList.add("disabled")
        previousLink.setAttribute("aria-disabled", "true")
    } else {
        previousPage.classList.remove("disabled")
        previousLink.onclick = () => {
            // call push method to send the correct page on the fetch
            history.pushState({}, "", `?page=${paginationData.previous_page}`)  
            // Calls the function passed
            viewCall()
        }
    }

    // Disable next button if there is not next page
    if (!paginationData.has_next) {
        nextPage.classList.add("disabled")
        nextLink.setAttribute("aria-disabled", "true")
    } else {
        nextPage.classList.remove("disabled")
        nextLink.onclick = () => {
            // call push method to send the correct page on the fetch
            history.pushState({}, "", `?page=${paginationData.next_page}`)
            // Calls the function passed
            viewCall()
        }
    }

}