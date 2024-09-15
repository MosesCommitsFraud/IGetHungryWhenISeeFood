// content.js

// Send message to load the TensorFlow model
chrome.runtime.sendMessage({ action: 'loadModel' }, (response) => {
  if (response && response.status === 'Model loaded') {
    processThumbnails();
  }
});

function processThumbnails() {
  const thumbnails = document.querySelectorAll('ytd-thumbnail img');

  thumbnails.forEach((img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, img.width, img.height);
    const imgData = context.getImageData(0, 0, img.width, img.height);

    chrome.runtime.sendMessage({ action: 'checkImage', imageData: imgData }, (response) => {
      if (response && response.isFood) {
        img.style.filter = 'blur(10px)';
      }
    });
  });
}
