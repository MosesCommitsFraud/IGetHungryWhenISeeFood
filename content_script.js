// Function to fetch food-related words using the Wikimedia API
async function fetchFoodKeywords() {
  try {
    const response = await fetch(
      'https://en.wikipedia.org/w/api.php?action=parse&page=List_of_cuisines&prop=text&format=json&origin=*'
    );
    if (response.ok) {
      const data = await response.json();
      const htmlText = data.parse.text['*'];
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const foodKeywords = [];

      // Extract food items from the list
      const items = doc.querySelectorAll('.div-col li a');
      items.forEach(item => {
        const word = item.textContent.trim().toLowerCase();
        if (word && !foodKeywords.includes(word)) {
          foodKeywords.push(word);
        }
      });

      return foodKeywords;
    } else {
      console.error('Failed to fetch food keywords:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching food keywords:', error);
    return [];
  }
}


// Function to check if a title contains any food-related keywords
function containsFoodKeyword(title, foodKeywords) {
  return foodKeywords.some(keyword => title.toLowerCase().includes(keyword));
}

// Function to blur videos with food-related content
async function blurFoodVideos() {
  const foodKeywords = await fetchFoodKeywords();
  const videoTitles = document.querySelectorAll('#video-title');

  videoTitles.forEach(titleElement => {
    const titleText = titleElement.textContent || titleElement.innerText;

    if (containsFoodKeyword(titleText, foodKeywords)) {
      // Find the closest video renderer element
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

// Observe changes to the DOM to handle dynamically loaded content
function observeDOMChanges() {
  const observer = new MutationObserver(() => {
    blurFoodVideos();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Initial execution
blurFoodVideos();
observeDOMChanges();