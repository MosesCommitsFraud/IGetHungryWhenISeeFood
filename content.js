// Function to fetch and cache food-related keywords from Datamuse API
async function fetchFoodKeywordsFromAPI() {
  try {
    const response = await fetch("https://api.datamuse.com/words?ml=food&topics=food&max=1000");
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const keywords = data.map(item => item.word.toLowerCase());
    // Cache the keywords with a timestamp
    chrome.storage.local.set({ foodKeywords: keywords, keywordsTimestamp: Date.now() });
    return keywords;
  } catch (error) {
    console.error("Failed to fetch food keywords from API:", error);
    return [];
  }
}

// Function to get food keywords (from cache or fetch)
async function getFoodKeywords() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['foodKeywords', 'keywordsTimestamp'], async (result) => {
      const { foodKeywords: cachedKeywords, keywordsTimestamp } = result;
      const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (cachedKeywords && (Date.now() - keywordsTimestamp) < cacheDuration) {
        // Use cached keywords if they are less than 24 hours old
        resolve(cachedKeywords);
      } else {
        // Fetch new keywords from the API
        const keywords = await fetchFoodKeywordsFromAPI();
        resolve(keywords);
      }
    });
  });
}

// Function to blur an image
function blurImage(img) {
  img.style.filter = "blur(10px)";
}

// Check the page title for food-related keywords
function checkTitleForFood(keywords) {
  const title = document.title.toLowerCase();
  return keywords.some(keyword => title.includes(keyword));
}

// Check if an image is food-related
function isImageFoodRelated(img, keywords) {
  const src = img.src.toLowerCase();
  return keywords.some(keyword => src.includes(keyword));
}

// Function to scan and blur images
function scanAndBlurImages(keywords) {
  const images = document.querySelectorAll("img");
  images.forEach(img => {
    if (isImageFoodRelated(img, keywords) || checkTitleForFood(keywords)) {
      blurImage(img);
    }
  });
}

// Main execution
(async () => {
  const foodKeywords = await getFoodKeywords();

  // Run the main function
  scanAndBlurImages(foodKeywords);

  // Observe DOM changes to handle dynamically loaded content
  const observer = new MutationObserver(() => {
    scanAndBlurImages(foodKeywords);
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
