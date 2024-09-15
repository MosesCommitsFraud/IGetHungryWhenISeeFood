// background.js

importScripts('libs/tf.min.js', 'libs/mobilenet.min.js', 'libs/opencv.js');

// Wait for libraries to load
async function waitForLibraries() {
  return new Promise((resolve) => {
    const checkLibraries = setInterval(() => {
      if (typeof cv !== 'undefined' && typeof tf !== 'undefined' && typeof mobilenet !== 'undefined') {
        clearInterval(checkLibraries);
        resolve();
      }
    }, 100);
  });
}

// Load the model
async function setup() {
  await waitForLibraries();
  const model = await mobilenet.load();
  return model;
}

// Preprocess image using OpenCV.js
function preprocessImageOpenCV(imgData) {
  const src = cv.matFromImageData(imgData);
  const dst = new cv.Mat();
  const dsize = new cv.Size(224, 224); // MobileNet requires 224x224 images

  cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);
  src.delete();

  return dst;
}

// Check if the image contains food using MobileNet
async function checkImageForFood(model, imgData) {
  const preprocessedImage = preprocessImageOpenCV(imgData);

  const imageData = tf.tidy(() => {
    const imgTensor = tf.browser.fromPixels(preprocessedImage);
    return imgTensor.expandDims(0).div(255); // Normalize to [0, 1]
  });

  const predictions = await model.classify(imageData);
  preprocessedImage.delete();
  imageData.dispose();

  return predictions.some(prediction => prediction.className.toLowerCase().includes('food'));
}

let model;

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'loadModel') {
    setup().then((loadedModel) => {
      model = loadedModel;
      sendResponse({ status: 'Model loaded' });
    });
    return true; // Indicate that we will respond asynchronously
  } else if (message.action === 'checkImage' && model) {
    checkImageForFood(model, message.imageData).then((isFood) => {
      sendResponse({ isFood });
    });
    return true; // Indicate that we will respond asynchronously
  }
});
