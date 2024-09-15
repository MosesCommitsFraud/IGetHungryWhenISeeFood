// Load the Coco SSD model
let modelPromise = cocoSsd.load().catch(error => {
  console.error('Error loading Coco SSD model:', error);
});

function setReferrerPolicy() {
  const thumbnails = document.querySelectorAll('ytd-thumbnail img');
  thumbnails.forEach(img => {
    img.setAttribute('referrerpolicy', 'no-referrer');
  });
}

async function isFoodInImage(imgElement) {
  try {
    const model = await modelPromise;
    if (!model) {
      console.error('Coco SSD model is not loaded.');
      return false;
    }
    const predictions = await model.detect(imgElement);
    const foodLabels = [
      'apple', 'banana', 'cake', 'sandwich', 'orange', 'broccoli', 'carrot',
      'hot dog', 'pizza', 'donut', 'bowl', 'dining table',
      'cup', 'fork', 'knife', 'spoon', 'bottle', 'wine glass'
    ];

    for (const prediction of predictions) {
      if (
        foodLabels.includes(prediction.class) &&
        prediction.score > 0.5
      ) {
        console.log('Food detected:', prediction.class, 'with score', prediction.score);
        return true;
      }
    }
  } catch (error) {
    console.error('Error during image classification:', error);
  }
  return false;
}

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

      try {
        await new Promise((resolve, reject) => {
          imgClone.onload = resolve;
          imgClone.onerror = reject;
        });

        const foodDetected = await isFoodInImage(imgClone);

        if (foodDetected) {
          console.log('Blurring video:', titleElement.textContent.trim());
          thumbnail.style.filter = 'blur(8px)';
          titleElement.style.filter = 'blur(8px)';
        } else {
          console.log('No food detected in:', titleElement.textContent.trim());
        }

        videoElement.classList.add('processed');
      } catch (error) {
        console.error('Error loading image:', error);
      }
    } else {
      videoElement.classList.add('processed');
    }
  }
}

function observeDOMChanges() {
  const observer = new MutationObserver(() => {
    setReferrerPolicy();
    blurFoodVideos();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Initial execution
setReferrerPolicy();
blurFoodVideos();
observeDOMChanges();
