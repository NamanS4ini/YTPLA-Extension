// content.js (or content.ts)
function makeBadge(text, playlistId) {
  const badge = document.createElement("div");
  badge.id = "ytpla-duration-badge"; // single stable id
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

function insertBadgeNearTitle(strText = "Total: —") {

  // Try to find the title element - works for both playlists and courses
  const titleElement = document.querySelector(".metadata-wrapper > yt-dynamic-sizing-formatted-string:nth-child(1) > div:nth-child(1)") || document.querySelector("yt-dynamic-text-view-model.yt-page-header-view-model__page-header-title:nth-child(2) > h1:nth-child(1)");
  if (!titleElement) {
    console.log("Title element not found");
    return false;
  }

  // Get the parent container of the title
  const titleContainer = titleElement.parentElement;
  if (!titleContainer) return false;

  // Get playlist ID
  const playlistId = new URL(location.href).searchParams.get("list");
  if (!playlistId) return false;

  // If badge already exists, update text and return
  const existing = document.getElementById("ytpla-duration-badge");
  if (existing) {
    const textNode = existing.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = strText;
    }
    // Make sure it is still attached in the correct position
    if (!existing.isConnected) {
      titleContainer.insertAdjacentElement("afterend", existing);
    }
    return true;
  }

  // Create and insert the badge right after the title container
  const badge = makeBadge(strText, playlistId);
  titleContainer.insertAdjacentElement("afterend", badge);

  // Fetch and update with actual duration
  fetchPlaylistDuration(playlistId).then((data) => {
    if (data) {
      // Update badge with the response data
      const durationText = data.totalDuration || JSON.stringify(data);
      const textNode = badge.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent = `${durationText} • ${data.videoCount || "N/A"} videos`;
      }
    } else {
      const textNode = badge.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent = "Length: unavailable";
      }
    }
  });

  return true;
}

// MutationObserver to handle SPA navigation / dynamic re-renders
const observer = new MutationObserver(() => {
  // If badge missing or title newly added, try to add it
  const title = document.querySelector("#title yt-formatted-string");
  const badge = document.getElementById("ytpla-duration-badge");

  if (title && (!badge || !badge.isConnected)) {
    insertBadgeNearTitle("loading...");
  }
});

// start observing once on document body
observer.observe(document.body, { childList: true, subtree: true });

// Try immediate insertion (in case page already ready)
insertBadgeNearTitle("loading...");
