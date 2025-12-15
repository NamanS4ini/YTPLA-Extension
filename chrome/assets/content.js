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
    const response = await fetch(`https://www.ytpla.in/api/extension?id=${playlistId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
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

// MutationObserver to handle SPA navigation / dynamic re-renders
let currentPlaylistId = null;

const observer = new MutationObserver(() => {
  // Check if playlist ID has changed
  const playlistId = new URL(location.href).searchParams.get("list");
  
  if (playlistId && playlistId !== currentPlaylistId) {
    // Playlist changed, remove old badges
    currentPlaylistId = playlistId;
    const oldBadges = document.querySelectorAll(".ytpla-duration-badge");
    oldBadges.forEach(badge => badge.remove());
    insertBadgeNearTitle("loading...");
  } else if (playlistId) {
    // Same playlist, only add badges if they don't exist
    const badges = document.querySelectorAll(".ytpla-duration-badge");
    if (badges.length === 0) {
      insertBadgeNearTitle("loading...");
    }
  }
});

// start observing once on document body
observer.observe(document.body, { childList: true, subtree: true });

// Try immediate insertion (in case page already ready)
currentPlaylistId = new URL(location.href).searchParams.get("list");
insertBadgeNearTitle("loading...");
