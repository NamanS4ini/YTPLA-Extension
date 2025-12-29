// content.js (or content.ts)
function makeBadge(text, playlistId, index) {
  const badge = document.createElement("div");
  badge.className = "ytpla-duration-badge"; // Use class instead of id for multiple badges
  badge.dataset.badgeIndex = index; // Track which badge this is
  badge.dataset.loaded = "false"; // Track if data has been loaded
  badge.style.cssText = [
    "margin-top:6px",
    "font-size:14px",
    "font-weight:500",
    "color:var(--yt-spec-text-primary)",
    "display:inline-block",
    "vertical-align:middle",
  ].join(";");
  
  // Create text node for duration
  const textNode = document.createTextNode(text);
  badge.appendChild(textNode);
  
  // Create separator and link
  const separator = document.createTextNode(" · ");
  badge.appendChild(separator);
  
  const link = document.createElement("a");
  link.textContent = "Details";
  link.href = `https://ytpla.in/${playlistId}`;
  link.target = "_blank";
  link.style.cssText = [
    "margin-top:6px",
    "font-size:14px",
    "color:rgb(112 182 255)",
    "text-decoration:none",
    "cursor:pointer",
  ].join(";");
  
  // Add hover effect
  link.addEventListener("mouseenter", () => {
    link.style.textDecoration = "underline";
  });
  link.addEventListener("mouseleave", () => {
    link.style.textDecoration = "none";
  });
  
  badge.appendChild(link);
  
  return badge;
}

async function fetchPlaylistDuration(playlistId) {
  try {
    // Send message to background script to fetch data
    const response = await browser.runtime.sendMessage({
      type: "FETCH_PLAYLIST_DURATION",
      playlistId: playlistId
    });
    
    if (response.success) {
      return response.data;
    } else {
      console.error("Error fetching playlist duration:", response.error);
      return null;
    }
  } catch (error) {
    console.error("Error fetching playlist duration:", error);
    return null;
  }
}

function insertBadgeNearTitle(strText = "Total: —", forceUpdate = false) {

  // Try to find all title elements - works for both playlists and courses
  const titleElements1 = document.querySelectorAll(".metadata-wrapper > yt-dynamic-sizing-formatted-string:nth-child(1) > div:nth-child(1)");
  const titleElements2 = document.querySelectorAll("yt-dynamic-text-view-model.yt-page-header-view-model__page-header-title:nth-child(2) > h1:nth-child(1)");
  
  // Combine both NodeLists into a single array
  const allTitleElements = [...titleElements1, ...titleElements2];
  
  if (allTitleElements.length === 0) {
    console.log("Title elements not found");
    return false;
  }

  // Get playlist ID
  const playlistId = new URL(location.href).searchParams.get("list");
  if (!playlistId) return false;

  let addedBadges = false;

  // Process each title element
  allTitleElements.forEach((titleElement, index) => {
    // Get the parent container of the title
    const titleContainer = titleElement.parentElement;
    if (!titleContainer) return;

    // Check if badge already exists for this container
    const nextSibling = titleContainer.nextElementSibling;
    if (nextSibling && nextSibling.classList.contains("ytpla-duration-badge")) {
      // If badge already has loaded data, don't overwrite it unless forced
      if (nextSibling.dataset.loaded === "true" && !forceUpdate) {
        addedBadges = true;
        return;
      }
      // Only update if still loading
      if (nextSibling.dataset.loaded === "false") {
        const textNode = nextSibling.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE && strText !== "loading...") {
          textNode.textContent = strText;
        }
      }
      addedBadges = true;
      return;
    }

    // Create and insert the badge right after the title container
    const badge = makeBadge(strText, playlistId, index);
    titleContainer.insertAdjacentElement("afterend", badge);
    addedBadges = true;

    // Fetch and update with actual duration
    fetchPlaylistDuration(playlistId).then((data) => {
      if (data) {
        // Update badge with the response data
        const durationText = data.totalDuration || JSON.stringify(data);
        const textNode = badge.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = `${durationText} • ${data.videoCount || "N/A"} videos`;
        }
        badge.dataset.loaded = "true"; // Mark as loaded
      } else {
        const textNode = badge.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = "Length: unavailable";
        }
        badge.dataset.loaded = "true"; // Mark as loaded even on error
      }
    });
  });

  return addedBadges;
}

// Handle URL changes for YouTube SPA navigation
let currentPlaylistId = null;
let retryInterval = null;
let lastUrl = location.href;

function tryInsertBadge(maxRetries = 20, retryDelay = 250) {
  let attempts = 0;
  
  // Clear any existing retry interval
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
  }
  
  const attempt = () => {
    attempts++;
    const success = insertBadgeNearTitle("loading...");
    
    if (success || attempts >= maxRetries) {
      if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
      }
      if (!success && attempts >= maxRetries) {
        console.log("YTPLA: Could not find title elements after max retries");
      }
    }
  };
  
  // Try immediately first
  const success = insertBadgeNearTitle("loading...");
  if (!success) {
    // Keep retrying until elements are found
    retryInterval = setInterval(attempt, retryDelay);
  }
}

function handleUrlChange() {
  const playlistId = new URL(location.href).searchParams.get("list");
  
  if (playlistId && playlistId !== currentPlaylistId) {
    // Playlist changed, remove old badges
    currentPlaylistId = playlistId;
    const oldBadges = document.querySelectorAll(".ytpla-duration-badge");
    oldBadges.forEach(badge => badge.remove());
    
    // Try to insert badge with retries
    tryInsertBadge();
  } else if (playlistId) {
    // Same playlist, only add badges if they don't exist
    const badges = document.querySelectorAll(".ytpla-duration-badge");
    if (badges.length === 0) {
      tryInsertBadge();
    }
  } else {
    // No playlist ID, remove any badges and clear retry
    currentPlaylistId = null;
    if (retryInterval) {
      clearInterval(retryInterval);
      retryInterval = null;
    }
    const oldBadges = document.querySelectorAll(".ytpla-duration-badge");
    oldBadges.forEach(badge => badge.remove());
  }
}

// Listen for URL changes via MutationObserver (catches YouTube SPA navigation)
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    handleUrlChange();
  }
}).observe(document, { subtree: true, childList: true });

// Also listen for popstate (back/forward navigation)
window.addEventListener('popstate', () => {
  lastUrl = location.href;
  handleUrlChange();
});

// Listen for YouTube's custom navigation events
document.addEventListener('yt-navigate-finish', () => {
  lastUrl = location.href;
  handleUrlChange();
});

// Also listen for yt-page-data-updated which fires when YouTube updates page content
document.addEventListener('yt-page-data-updated', () => {
  lastUrl = location.href;
  handleUrlChange();
});

// Try immediate insertion (in case page already ready)
currentPlaylistId = new URL(location.href).searchParams.get("list");
if (currentPlaylistId) {
  tryInsertBadge();
}
