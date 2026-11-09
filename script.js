
// ConnectX - Micro Blogging Application

let users = JSON.parse(localStorage.getItem("cx_users")) || [];
let posts = JSON.parse(localStorage.getItem("cx_posts")) || [];
let currentUser = localStorage.getItem("cx_currentUser") || null;

const $ = id => document.getElementById(id);

function saveData() {
    localStorage.setItem("cx_users", JSON.stringify(users));
    localStorage.setItem("cx_posts", JSON.stringify(posts));
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getUser(username) {
    return users.find(user => user.username === username);
}

// AUTH TABS

$("loginTab").onclick = () => {
    $("loginForm").classList.remove("hidden");
    $("registerForm").classList.add("hidden");
    $("loginTab").classList.add("active");
    $("registerTab").classList.remove("active");
    $("authMessage").textContent = "";
};

$("registerTab").onclick = () => {
    $("registerForm").classList.remove("hidden");
    $("loginForm").classList.add("hidden");
    $("registerTab").classList.add("active");
    $("loginTab").classList.remove("active");
    $("authMessage").textContent = "";
};

// REGISTER

$("registerForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = $("regName").value.trim();
    const username = $("regUsername").value.trim().toLowerCase();
    const password = $("regPassword").value;

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        $("authMessage").textContent =
            "Username must be 3-20 characters (letters, numbers, underscore).";
        return;
    }

    if (password.length < 4) {
        $("authMessage").textContent =
            "Password must contain at least 4 characters.";
        return;
    }

    if (getUser(username)) {
        $("authMessage").textContent = "Username already exists!";
        return;
    }

    users.push({
        name,
        username,
        password,
        following: []
    });

    saveData();

    $("authMessage").textContent =
        "Account created successfully! Please login.";

    $("regName").value = "";
    $("regUsername").value = "";
    $("regPassword").value = "";

    $("loginTab").click();
    $("loginUsername").value = username;
});

// LOGIN

$("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = $("loginUsername").value.trim().toLowerCase();
    const password = $("loginPassword").value;

    const user = users.find(u =>
        u.username === username && u.password === password
    );

    if (!user) {
        $("authMessage").textContent =
            "Invalid username or password!";
        return;
    }

    currentUser = username;
    localStorage.setItem("cx_currentUser", currentUser);

    showApp();
});

// LOGOUT

$("logoutBtn").onclick = () => {
    currentUser = null;
    localStorage.removeItem("cx_currentUser");

    $("appPage").classList.add("hidden");
    $("authPage").classList.remove("hidden");

    $("loginForm").reset();
    $("authMessage").textContent = "";
};

// SHOW APPLICATION

function showApp() {
    if (!getUser(currentUser)) {
        currentUser = null;
        localStorage.removeItem("cx_currentUser");
        return;
    }

    $("authPage").classList.add("hidden");
    $("appPage").classList.remove("hidden");

    const user = getUser(currentUser);

    $("currentUser").textContent = "@" + user.username;

    renderFeed();
    renderDiscover();
    renderSuggestions();
    renderProfile();
}

function getInitial(name) {
    return escapeHTML(name.charAt(0).toUpperCase());
}

// CREATE POST

$("postBtn").onclick = () => {
    const content = $("postContent").value.trim();

    if (!content) {
        alert("Please write something before posting!");
        return;
    }

    posts.unshift({
        id: Date.now() + Math.random(),
        author: currentUser,
        text: content,
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
        resharedBy: []
    });

    $("postContent").value = "";

    saveData();
    refreshUI();
};

// FOLLOW / UNFOLLOW

function toggleFollow(username) {
    if (username === currentUser) return;

    const user = getUser(currentUser);

    if (!user) return;

    if (user.following.includes(username)) {
        user.following = user.following.filter(
            name => name !== username
        );
    } else {
        user.following.push(username);
    }

    saveData();
    refreshUI();
}

// LIKE / UNLIKE

function toggleLike(postId) {
    const post = posts.find(p => String(p.id) === String(postId));

    if (!post) return;

    if (post.likes.includes(currentUser)) {
        post.likes = post.likes.filter(
            name => name !== currentUser
        );
    } else {
        post.likes.push(currentUser);
    }

    saveData();
    refreshUI();
}

// RESHARE

function toggleReshare(postId) {
    const post = posts.find(p => String(p.id) === String(postId));

    if (!post || post.author === currentUser) return;

    if (post.resharedBy.includes(currentUser)) {
        post.resharedBy = post.resharedBy.filter(
            name => name !== currentUser
        );
    } else {
        post.resharedBy.push(currentUser);
    }

    saveData();
    refreshUI();
}

// ADD COMMENT

function addComment(postId, input) {
    const post = posts.find(p => String(p.id) === String(postId));
    const text = input.value.trim();

    if (!post || !text) return;

    post.comments.push({
        username: currentUser,
        text,
        createdAt: new Date().toISOString()
    });

    saveData();
    refreshUI();
}

// DATE FORMAT

function formatDate(date) {
    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// POST HTML

function createPostHTML(post) {
    const author = getUser(post.author);

    if (!author) return "";

    const liked = post.likes.includes(currentUser);
    const reshared = post.resharedBy.includes(currentUser);

    const commentsHTML = post.comments.map(comment => {
        const commentUser = getUser(comment.username);

        return `
            <div class="comment-item">
                <strong>${escapeHTML(commentUser?.name || comment.username)}</strong>
                ${escapeHTML(comment.text)}
            </div>
        `;
    }).join("");

    const reshareHTML = post.resharedBy.length
        ? `<p class="reshared-label">
            <i class="fas fa-retweet"></i>
            Reshared by ${post.resharedBy.length} user(s)
           </p>`
        : "";

    return `
        <article class="post-card">

            ${reshareHTML}

            <div class="post-user">
                <div class="avatar">${getInitial(author.name)}</div>

                <div>
                    <h4>${escapeHTML(author.name)}</h4>
                    <small>@${escapeHTML(author.username)}
                    · ${formatDate(post.createdAt)}</small>
                </div>
            </div>

            <p class="post-text">${escapeHTML(post.text)}</p>

            <div class="post-actions">

                <button class="${liked ? "liked" : ""}"
                    data-action="like" data-id="${post.id}">
                    <i class="${liked ? "fas" : "far"} fa-heart"></i>
                    ${post.likes.length} Like
                </button>

                <button data-action="comment" data-id="${post.id}">
                    <i class="far fa-comment"></i>
                    ${post.comments.length} Comment
                </button>

                <button data-action="reshare" data-id="${post.id}"
                    class="${reshared ? "liked" : ""}"
                    ${post.author === currentUser ? "disabled" : ""}>
                    <i class="fas fa-retweet"></i>
                    ${post.resharedBy.length} Reshare
                </button>

            </div>

            <div class="comments">
                ${commentsHTML}

                <form class="comment-form" data-id="${post.id}">
                    <input type="text" placeholder="Write a comment..."
                        maxlength="300" required>
                    <button type="submit">Send</button>
                </form>
            </div>

        </article>
    `;
}

// HOME FEED

function renderFeed() {
    const user = getUser(currentUser);
    if (!user) return;

    const visiblePosts = posts.filter(post =>
        post.author === currentUser ||
        user.following.includes(post.author) ||
        post.resharedBy.includes(currentUser)
    );

    $("feed").innerHTML = visiblePosts.length
        ? visiblePosts.map(createPostHTML).join("")
        : `<div class="empty">
            <h3>Your feed is empty!</h3>
            <p>Follow people to see their posts here.</p>
           </div>`;
}

// DISCOVER USERS

function renderDiscover(search = "") {
    const filteredUsers = users.filter(user =>
        user.username !== currentUser &&
        (user.name.toLowerCase().includes(search.toLowerCase()) ||
         user.username.toLowerCase().includes(search.toLowerCase()))
    );

    $("usersList").innerHTML = filteredUsers.length
        ? filteredUsers.map(user => {
            const following = getUser(currentUser).following.includes(
                user.username
            );

            const followers = users.filter(u =>
                u.following.includes(user.username)
            ).length;

            return `
                <div class="user-card">
                    <div class="avatar">${getInitial(user.name)}</div>

                    <div class="user-info">
                        <strong>${escapeHTML(user.name)}</strong>
                        <p>@${escapeHTML(user.username)}
                        · ${followers} followers</p>
                    </div>

                    <button class="follow-btn ${following ? "following" : ""}"
                        data-action="follow"
                        data-user="${escapeHTML(user.username)}">
                        ${following ? "Following" : "Follow"}
                    </button>
                </div>
            `;
        }).join("")
        : `<div class="empty">No users found.</div>`;
}

// SEARCH USERS

$("searchUser").addEventListener("input", function() {
    renderDiscover(this.value);
});

// SUGGESTIONS

function renderSuggestions() {
    const suggestions = users.filter(user =>
        user.username !== currentUser &&
        !getUser(currentUser).following.includes(user.username)
    ).slice(0, 5);

    $("suggestionsList").innerHTML = suggestions.map(user => `
        <div class="suggest-user">
            <div class="avatar">${getInitial(user.name)}</div>
            <div class="user-info">
                <strong>${escapeHTML(user.name)}</strong>
                <p>@${escapeHTML(user.username)}</p>
            </div>
            <button data-action="follow"
                data-user="${escapeHTML(user.username)}">Follow</button>
        </div>
    `).join("") || "<p>No suggestions available.</p>";
}

// PROFILE

function renderProfile() {
    const user = getUser(currentUser);
    if (!user) return;

    const followerCount = users.filter(u =>
        u.following.includes(currentUser)
    ).length;

    const myPosts = posts.filter(p =>
        p.author === currentUser || p.resharedBy.includes(currentUser)
    );

    $("profileAvatar").textContent = getInitial(user.name);
    $("profileName").textContent = user.name;
    $("profileUsername").textContent = "@" + user.username;

    $("postCount").textContent = myPosts.length;
    $("followingCount").textContent = user.following.length;
    $("followerCount").textContent = followerCount;

    $("profilePosts").innerHTML = myPosts.length
        ? myPosts.map(createPostHTML).join("")
        : `<div class="empty">You haven't posted anything yet.</div>`;
}

// NAVIGATION

function openPage(page) {
    ["home", "discover", "profile"].forEach(name => {
        $(name + "Page").classList.toggle("hidden", name !== page);
    });

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    const titles = {
        home: "Home Feed",
        discover: "Discover People",
        profile: "My Profile"
    };

    $("pageTitle").textContent = titles[page];

    if (page === "discover") renderDiscover();
    if (page === "profile") renderProfile();
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.page);
    });
});

// EVENT DELEGATION FOR LIKE, FOLLOW, RESHARE

document.addEventListener("click", function(e) {
    const button = e.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const username = button.dataset.user;

    if (action === "like") toggleLike(id);
    if (action === "reshare") toggleReshare(id);
    if (action === "follow") toggleFollow(username);
});

// COMMENT FORM SUBMISSION

document.addEventListener("submit", function(e) {
    if (!e.target.classList.contains("comment-form")) return;

    e.preventDefault();

    const input = e.target.querySelector("input");
    addComment(e.target.dataset.id, input);
});

// REFRESH ALL SECTIONS

function refreshUI() {
    renderFeed();
    renderDiscover($("searchUser").value);
    renderSuggestions();
    renderProfile();
}

// RESTORE LOGIN SESSION

if (currentUser && getUser(currentUser)) {
    showApp();
} else {
    currentUser = null;
    localStorage.removeItem("cx_currentUser");
}
