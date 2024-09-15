// Load the Coco SSD model
let modelPromise = cocoSsd.load();

// Function to analyze an image and detect food items
async function isFoodInImage(imgElement) {
  const model = await modelPromise;
  const predictions = await model.detect(imgElement);

  // List of labels considered as food items
  const foodLabels = [
    'apple', 'banana', 'cake', 'sandwich', 'orange', 'broccoli', 'carrot',
    'hot dog', 'pizza', 'donut', 'cake', 'food', 'bowl', 'dining table',
    'cup', 'fork', 'knife', 'spoon', 'bottle', 'wine glass'
  ];

  // Check if any predictions match food labels with sufficient confidence
  for (const prediction of predictions) {
    if (
      foodLabels.includes(prediction.class) &&
      prediction.score > 0.5 // Confidence threshold
    ) {
      return true;
    }
  }
  return false;
}

// Function to blur videos with food-related thumbnails
async function blurFoodVideos() {
  const videoElements = document.querySelectorAll(
    'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer'
  );

  for (const videoElement of videoElements) {
    if (videoElement.classList.contains('processed')) {
      continue;
    }

    const thumbnail = videoElement.querySelector('ytd-thumbnail img');
    const titleElement = videoElement.querySelector('#video-title');

    if (thumbnail && titleElement) {
      const imgClone = new Image();
      imgClone.crossOrigin = 'anonymous';
      imgClone.src = thumbnail.src;

      // Wait for the image to load
      await new Promise((resolve, reject) => {
        imgClone.onload = resolve;
        imgClone.onerror = reject;
      });

      const foodDetected = await isFoodInImage(imgClone);

      if (foodDetected) {
        // Blur the thumbnail
        thumbnail.style.filter = 'blur(8px)';
        // Blur the title text
        titleElement.style.filter = 'blur(8px)';
        // Mark as processed
        videoElement.classList.add('processed');
      } else {
        // Mark as processed to avoid reprocessing
        videoElement.classList.add('processed');
      }
    }
  }
}

// Observe changes to handle dynamically loaded content
function observeDOMChanges() {
  const observer = new MutationObserver(() => {
    blurFoodVideos();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Initial execution
setReferrerPolicy();
blurFoodVideos();
observeDOMChanges();
