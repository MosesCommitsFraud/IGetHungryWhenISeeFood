// List of food-related keywords
const foodKeywords = [
  "food", "pizza", "burger", "sushi", "pasta", "steak", "salad", "chocolate",
  "ice cream", "sandwich", "bread", "cake", "cookie", "cheese", "fruit",
  "vegetable", "meat", "fish", "chicken", "beef", "pork", "egg", "noodle",
  "rice", "soup", "drink", "coffee", "tea", "wine", "beer", "soda", "juice"
];

// Function to blur an image
function blurImage(img) {
  img.style.filter = "blur(10px)";
}

// Check the page title for food-related keywords
function checkTitleForFood() {
  const title = document.title.toLowerCase();
  return foodKeywords.some(keyword => title.includes(keyword));
}

// Placeholder function to check if an image is food-related
// In a real implementation, this would involve image recognition
function isImageFoodRelated(img) {
  // Since we can't perform image recognition here, we'll simulate it
  // For demonstration, let's assume images with certain filenames are food
  const src = img.src.toLowerCase();
  return foodKeywords.some(keyword => src.includes(keyword));
}

// Main function to scan and blur images
function scanAndBlurImages() {
  const images = document.querySelectorAll("img");
  images.forEach(img => {
    if (isImageFoodRelated(img) || checkTitleForFood()) {
      blurImage(img);
    }
  });
}

// Run the main function
scanAndBlurImages();
