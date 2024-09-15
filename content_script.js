let foodKeywords = [];

// Fetch the list of food-related words
async function fetchFoodKeywords() {
  try {
    const response = await fetch('https://example.com/food-words.json');
    if (response.ok) {
      foodKeywords = await response.json();
      // Start processing videos after fetching the keywords
      blurFoodVideos();
    } else {
      console.error('Failed to fetch food keywords:', response.status);
    }
  } catch (error) {
    console.error('Error fetching food keywords:', error);
  }
}

// Check if a title contains any food-related keywords
function containsFoodKeyword(title) {
  return foodKeywords.some(keyword =>
    title.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Blur videos with food-related content
function blurFoodVideos() {
  const videoTitles = document.querySelectorAll('#video-title');

  videoTitles.forEach(titleElement => {
    const titleText = titleElement.textContent || titleElement.innerText;

    if (containsFoodKeyword(titleText)) {
      const videoElement = titleElement.closest(
        'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer'
      );
      if (videoElement && !videoElement.classList.contains('blurred')) {
        // Blur the thumbnail
        const thumbnail = videoElement.querySelector('ytd-thumbnail');
        if (thumbnail) {
          thumbnail.style.filter = 'blur(8px)';
        }
        // Blur the title text
        titleElement.style.filter = 'blur(8px)';
        // Mark as blurred to avoid reprocessing
        videoElement.classList.add('blurred');
      }
    }
  });
}

// Observe changes to handle dynamically loaded content
function observeDOMChanges() {
  const observer = new MutationObserver(() => {
    blurFoodVideos();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Initial execution
fetchFoodKeywords();
observeDOMChanges();
