// content.js
const config = require('./config');

// Use the API key from the config file
const USDA_API_KEY = config.USDA_API_KEY;

// Cache for storing checked words
let foodWordCache = {};

// Regular expression to match valid words (alphabetic characters only)
const validWordRegex = /^[a-zA-Z]+$/;

// Function to check if a word is food-related using the USDA FoodData Central API
async function isFoodKeyword(word) {
  word = word.toLowerCase();

  // Check if the word is already in the cache
  if (foodWordCache.hasOwnProperty(word)) {
    return foodWordCache[word];
  }

  // Validate the word before making the API call
  if (!validWordRegex.test(word) || word.length < 2 || word.length > 30) {
    foodWordCache[word] = false;
    return false;
  }

  try {
    // Construct the API URL
    const apiUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(word)}&pageSize=1`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Network response was not ok (status ${response.status})`);
    }
    const data = await response.json();

    // If totalHits is greater than 0, the word is food-related
    const isFood = data.totalHits && data.totalHits > 0;

    // Cache the result
    foodWordCache[word] = isFood;

    // Store the cache in local storage to persist between sessions
    chrome.storage.local.set({ foodWordCache });

    return isFood;
  } catch (error) {
    console.error(`Failed to check if word "${word}" is food-related:`, error);
    // Treat errors as non-food to prevent unnecessary blurring
    foodWordCache[word] = false;
    return false;
  }
}

// Load the cache from local storage
function loadFoodWordCache() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['foodWordCache'], (result) => {
      foodWordCache = result.foodWordCache || {};
      resolve();
    });
  });
}

// Function to blur an image
function blurImage(img) {
  img.style.filter = "blur(10px)";
  // Optionally, add a class to indicate it's blurred
  img.classList.add('blurred-food-image');
}

// Function to check if a thumbnail is food-related
async function isThumbnailFoodRelated(thumbnailElement) {
  // Get the title of the video
  const titleElement = thumbnailElement.querySelector('#video-title');
  const title = titleElement ? titleElement.textContent.trim().toLowerCase() : '';

  // Get the alt text of the thumbnail image
  const imgElement = thumbnailElement.querySelector('img');
  const altText = imgElement && imgElement.alt ? imgElement.alt.toLowerCase() : '';

  // Combine words from title and alt text
  const wordsToCheck = [...title.split(/\s+/), ...altText.split(/\s+/)];

  for (const word of wordsToCheck) {
    if (await isFoodKeyword(word)) {
      return true;
    }
  }

  return false;
}

// Function to scan and blur thumbnails
async function scanAndBlurThumbnails() {
  const thumbnailElements = document.querySelectorAll('ytd-thumbnail');

  for (const thumbnail of thumbnailElements) {
    // Check if the thumbnail is already processed
    if (thumbnail.dataset.foodProcessed === 'true') continue;

    thumbnail.dataset.foodProcessed = 'true';

    if (await isThumbnailFoodRelated(thumbnail)) {
      // Blur the thumbnail image
      const imgElement = thumbnail.querySelector('img');
      if (imgElement) {
        blurImage(imgElement);
      }
    }
  }
}

// Main execution
(async () => {
  await loadFoodWordCache();

  // Run the main function
  await scanAndBlurThumbnails();

  // Observe DOM changes to handle dynamically loaded content
  const observer = new MutationObserver(async () => {
    await scanAndBlurThumbnails();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
