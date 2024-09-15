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

// Function to dynamically load scripts
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      // Script already loaded
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
}

// Load the MobileNet model
let model;
async function loadModel() {
  model = await tf.loadGraphModel(
    'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/5',
    { fromTFHub: true }
  );
}

// Load labels for ImageNet classes
let labels = [];
async function loadLabels() {
  const response = await fetch('https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt');
  const text = await response.text();
  labels = text.split('\n');
}

// Function to classify an image and check if it contains food
async function isFoodImage(imgElement) {
  if (!model) {
    await loadModel();
  }
  if (labels.length === 0) {
    await loadLabels();
  }

  // Create a tensor from the image
  const img = tf.browser.fromPixels(imgElement).toFloat();
  const resized = tf.image.resizeBilinear(img, [224, 224]);
  const offset = tf.scalar(127.5);
  const normalized = resized.sub(offset).div(offset);
  const batched = normalized.expandDims(0);

  // Make predictions
  const predictions = await model.predict(batched).data();
  batched.dispose();
  img.dispose();
  resized.dispose();
  normalized.dispose();

  // Get the top predictions
  const top5 = Array.from(predictions)
    .map((p, i) => ({ probability: p, className: labels[i] }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);

  // Define food-related keywords
  const foodKeywords = [
    'dish', 'food', 'plate', 'pizza', 'sandwich', 'salad', 'cake',
    'cookie', 'burger', 'sushi', 'pasta', 'fruit', 'vegetable',
    'drink', 'beverage', 'coffee', 'tea', 'ice cream', 'dessert',
    'bread', 'cheese', 'meat', 'fish', 'steak', 'soup', 'curry',
    'noodles', 'pastry', 'wine', 'beer', 'juice', 'milk', 'cereal'
  ];

  // Check if any of the top predictions are food-related
  return top5.some(prediction => {
    return foodKeywords.some(keyword => prediction.className.toLowerCase().includes(keyword));
  });
}

// Function to blur videos with food-related content
async function blurFoodVideos() {
  const foodKeywords = await fetchFoodKeywords();
  const videoTitles = document.querySelectorAll('#video-title');

  videoTitles.forEach(async titleElement => {
    const titleText = titleElement.textContent || titleElement.innerText;

    // Find the closest video renderer element
    const videoElement = titleElement.closest(
      'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer'
    );
    if (videoElement && !videoElement.classList.contains('blurred')) {
      let blurVideo = false;

      // Check if title contains food keywords
      if (containsFoodKeyword(titleText, foodKeywords)) {
        blurVideo = true;
      }

      // Check if thumbnail contains food
      const thumbnail = videoElement.querySelector('ytd-thumbnail img');
      if (thumbnail) {
        const imageLoaded = await new Promise(resolve => {
          if (thumbnail.complete) {
            resolve(true);
          } else {
            thumbnail.onload = () => resolve(true);
            thumbnail.onerror = () => resolve(false);
          }
        });

        if (imageLoaded) {
          try {
            if (await isFoodImage(thumbnail)) {
              blurVideo = true;
            }
          } catch (error) {
            console.error('Error during image classification:', error);
          }
        }
      }

      if (blurVideo) {
        // Blur the thumbnail
        const thumbnailContainer = videoElement.querySelector('ytd-thumbnail');
        if (thumbnailContainer) {
          thumbnailContainer.style.filter = 'blur(8px)';
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
  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      blurFoodVideos();
    }, 500); // Adjust the debounce time as needed
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Initial execution
(async function() {
  try {
    // Dynamically load TensorFlow.js
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0/dist/tf.min.js');

    // Now you can use tf in your code
    await loadModel();
    await loadLabels();
    await blurFoodVideos();
    observeDOMChanges();
  } catch (error) {
    console.error('Error initializing the script:', error);
  }
})();
