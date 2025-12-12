// background.js - Handle fetch requests from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_PLAYLIST_DURATION") {
    const playlistId = message.playlistId;
    
    fetch(`https://www.ytpla.in/api/extension?id=${playlistId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error("Error fetching playlist duration:", error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send response asynchronously
    return true;
  }
});
