document.addEventListener("DOMContentLoaded", function() {
    
    // SP views load
    const postView = document.querySelector("#form-submit")
    document.querySelector("#user-view").style.display = "none"

    // Avoid error rendering the post if the user is not log in
    if (postView) {
        postView.addEventListener("click", createPost)   
    }

    // Load posts
    loadPosts()
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
    if (result.error) {
        alert(result.error)
    } else {
        alert(result.message)
    }
   })
}


function loadPosts() {
    // Fetch database for all posts
    fetch("/network/posts")
    .then(response => {
        // Check for error in response
        if (!response.ok) {
            throw new Error(`error! Status: ${response.status}`)
        }
        return response.json()
    })
    .then(data => {
        data.forEach(item => {

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
            const like = document.createElement("button");
            like.textContent = "Like"
            const heading = document.createElement("h1");
            heading.textContent = "Post:"
            const likesNum = document.createElement("p");
            likesNum.textContent = "This is a placeholder for likes of 0"
            postDiv.append(user, heading, content, timestamp, likesNum, like)
            document.querySelector("#app-posts").append(postDiv)
            
            user.onclick = () => userProfile(item.user_id)
        }) 
    })
    .catch(error => alert(`Error: ${error}`))
}


function userProfile(user_id) {
    // Show user view
    document.querySelector("#create-post-view").style.display = "none"
    document.querySelector("#app-posts").style.display = "none"
    document.querySelector("#user-view").style.display = "block"

    // Clear view to avoid duplicates
    document.querySelector("#user-view").innerHTML = ""

    // Fetch user poosts
    fetch(`/network/${user_id}`)

    // Check for error in response
    .then(response => {
        if (!response.ok) {
            throw new Error(`error! Status: ${response.status}`)
        }
        return response.json()
    })
    .then(data => {
        // Render usernmae, user followers and the users is following
        const userInfoDiv = document.createElement("div")
        
        // Create elements to the div
        userInfoDiv.className = "user-information"
        const user = document.createElement("h2");
        const userExists = data.posts.length > 0 ? data.posts[0].user : "User hasn't post to display"  
        user.textContent = `Posts by: ${userExists}`
        const followers = document.createElement("p");
        followers.textContent = `Followers: ${data.followers}`
        const following = document.createElement("p");
        following.textContent = `User follows: #${data.following}`
        userInfoDiv.append(user, followers, following)
        document.querySelector("#user-view").append(userInfoDiv)

        // Check for display follow button
        // Check if user already follows this user


        // Render user posts
        data.posts.forEach(item => {
            const userPostDiv = document.createElement("div");
            userPostDiv.className = "posts-list"

            // Create elements to the div
            const content = document.createElement("p");
            content.textContent = item.content
            const timestamp = document.createElement("small");
            timestamp.textContent = item.timestamp
            const like = document.createElement("button");
            like.textContent = "Like"
            const heading = document.createElement("h1");
            heading.textContent = "Post:"
            const likesNum = document.createElement("p");
            likesNum.textContent = "This is a placeholder for likes of 0"
            userPostDiv.append(heading, content, timestamp, likesNum, like)
            document.querySelector("#user-view").append(userPostDiv)
        })
    })
    .catch(error => alert(`error: ${error}`))
}