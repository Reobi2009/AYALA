let slideIndex = 1;
// A global variable to manage the GIF timeout, preventing conflicts when switching slides quickly
window.gifSwapTimeout = null; 

// Start the slideshow on page load
document.addEventListener('DOMContentLoaded', () => {
    showSlides(slideIndex);
});

// --- Navigation Functions ---

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

// --- Main Slideshow Logic ---

function showSlides(n) {
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  
  // Basic bounds checking
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  
  // 1. Hide all slides and reset dots
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
    
    // Important: Reset GIF images on slides that are being hidden to their static state
    const hiddenGif = slides[i].querySelector('[data-gif-src]');
    if (hiddenGif) {
        // Ensure the hidden slide always shows the static image to conserve resources
        hiddenGif.src = hiddenGif.dataset.staticSrc;
    }
  }
  for (let i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active-dot", "");
  }
  
  // 2. Show the current slide
  let currentSlideElement = slides[slideIndex-1];
  currentSlideElement.style.display = "block";
  dots[slideIndex-1].className += " active-dot";

  // 3. FLEXIBLE GIF/STOP LOGIC
  // Find the image element on the current slide that has the data-gif-src attribute
  const gifElement = currentSlideElement.querySelector('[data-gif-src]');
  
  // Clear any existing timeout immediately to prevent ghost swaps
  if (window.gifSwapTimeout) {
      clearTimeout(window.gifSwapTimeout); 
  }

  if (gifElement) {
    const originalSrc = gifElement.dataset.gifSrc;       // Reads the GIF filename (e.g., Precolonial.gif)
    const staticSrc = gifElement.dataset.staticSrc;     // Reads the static filename (e.g., Precoloniallast.png)
    // IMPORTANT: Parse the duration from the data attribute (e.g., "4000")
    const gifDuration = parseInt(gifElement.dataset.gifDuration); 
    
    // A. Force the GIF to restart playing by resetting the source. 
    // We add a timestamp (cache buster) to ensure the browser reloads the image.
    gifElement.src = staticSrc + '?t=' + new Date().getTime(); // Reset to static first
    gifElement.src = originalSrc + '?t=' + new Date().getTime(); // Set back to GIF to force restart

    console.log(`GIF '${originalSrc}' started on slide ${slideIndex}. Swapping in ${gifDuration}ms.`);

    // B. Set a new timeout to swap the source after the animation finishes
    window.gifSwapTimeout = setTimeout(() => {
        // C. Final Check: Only swap if the user is still viewing this specific slide
        if (slides[slideIndex-1] === currentSlideElement) {
             gifElement.src = staticSrc;
             console.log("GIF successfully swapped to static image.");
        }
    }, gifDuration);
  } else {
      console.log(`Slide ${slideIndex} is a regular static image.`);
  }
}