document.addEventListener("DOMContentLoaded", function() {
    
    // SP views load
    const postView = document.querySelector("#form-submit")

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
    .then(response => response.json())
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
            const heading = document.createElement("h1")
            heading.textContent = "Post:"
            const likesNum = document.createElement("p")
            likesNum.textContent = "This is a placeholder for likes of 0"
            postDiv.append(user, heading, content, timestamp, likesNum, like)
            document.querySelector("#app-posts").append(postDiv)                
        }) 
    })
}