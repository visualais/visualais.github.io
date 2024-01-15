function sendHeightToParent(height) {
    height += 20 + 20;
    //height = document.body.scrollHeight;
    //console.log('Sending height to parent:', height); // Log the height
    window.parent.postMessage({
        'iframeHeight': height
    }, '*'); // Replace '*' with the parent's origin for security
}

function adjustViewerHeight() {
    const viewer = document.querySelector('.viewer');
    const img = document.querySelector('.viewer-img');
    if (img != null) {
        viewer.style.height = `${img.height}px`;    
        sendHeightToParent(img.height);
    } else {
        const aspectRatio = 3 / 4; // Adjust the aspect ratio as needed
        const width = viewer.offsetWidth;
        const height = width * aspectRatio;
        viewer.style.height = `${height}px`;
        sendHeightToParent(width * aspectRatio);
    }
    //viewer.style.width = `${width}px`;
}

// Call the function initially and on window resize
adjustViewerHeight();
window.addEventListener('resize', adjustViewerHeight);
let inf_rot = false;
let available_images = {};
let unavailable_images = {};

async function checkResource(path) {
    try {
        const response = await fetch(path);
        if (response.ok) {
            console.log("Resource is available:", path);
            return 0;
        } else {
            //console.log("Resource not available. Status:", response.status);
            return -1;
        }
    } catch (error) {
        //console.error("Error fetching resource:", error);
        return -100;
    }
}

async function preloadImages(imageCount) {
    for (let i = 1; i < imageCount; i++) {
        /*const img = new Image();
        img.src = getImagePath(i);*/
        path = getImagePath(i)
        response = checkResource(path);
        if (response == 0){
            available_images[i] = path;
        }else{
            unavailable_images[i] = path;
            //unavailable_images.push({i: path});
        }
    }
}

function getImagePath(index) {
    const indexWithLeadingZeros = String(index).padStart(5, '0');
    return `images/image_${indexWithLeadingZeros}.jpg`;
}

//window.onload = sendHeightToParent;

document.addEventListener('DOMContentLoaded', function() {
    const viewer = document.getElementById('viewer');
    const slider = document.getElementById('imageSlider');
    // const imageCount = 26;
    // console.log(slider.max);
    const imageCount = parseInt(slider.max) + 1;
    let currentIndex = 0;
    let isInteracting = false;
    let lastX = 0;

    const img = new Image();
    img.onload = function() {
        viewer.style.height = `${this.height}px`;
        this.onload = null; // Remove the onload handler
    };
    path = getImagePath(0);
    response = checkResource(path);
    if (response == 0){
        available_images[0] = path;
        img.src = path; // Load the first image
    }else{
        unavailable_images[0] = path;
    }
    img.classList.add('viewer-img', 'active');
    img.style.opacity = '1'; // Set the initial opacity to 1
    viewer.appendChild(img);

    preloadImages(imageCount);
    slider.max = imageCount - 1;

    function updateImage(index) {
        if (index >= 0 && index < imageCount) {
            img.src = getImagePath(index);
            slider.value = index;
        }
    }

    let direction = 1; // 1 for forward, -1 for backward
    let autoRotate = setInterval(() => {
        if (currentIndex === 0) direction = 1; // Change direction to forward
        //else if (currentIndex === imageCount - 1) direction = -1; // Change direction to backward
        else if (currentIndex === Math.floor(imageCount / 2) - 1) direction = -1; // Change direction to backward

        currentIndex = (currentIndex + direction + imageCount) % imageCount;
        updateImage(currentIndex);

        if (currentIndex === 0) {
            clearInterval(autoRotate);
            document.querySelector('.overlay-message').style.display = 'block';
        }
    }, 80); // Adjust the interval as needed

    let overlay = document.querySelector('.overlay-message');
    let hidden_overlay = false;

    /*function updateImage(index) {
        /*img.style.opacity = '0'; // Hide the current image
        setTimeout(() => {
            img.src = getImagePath(index);
            slider.value = index;
            img.onload = () => img.style.opacity = '1'; // Ensure the image is loaded before fading in
        }, 50); // Match the duration of the CSS transition
    }*/

    function calculateIndexChange(currentX) {
        const deltaX = currentX - lastX;
        const pixelsPerImage = viewer.offsetWidth / imageCount / 5;
        let indexChange = Math.round(deltaX / pixelsPerImage);

        // console.log(indexChange);
        if (indexChange !== 0) {
            if (! inf_rot){
                currentIndex = Math.max(0, Math.min(currentIndex + indexChange, imageCount - 1));
            }else{
                currentIndex = (currentIndex + indexChange + imageCount) % imageCount;
            }
            updateImage(currentIndex);
            lastX = currentX;
        }
    }

    function stop_rotation_hide_overlay() {
        if (! hidden_overlay) {
            clearInterval(autoRotate); // Stop auto-rotation when the user starts interacting
            overlay.classList.add('hide');
            hidden_overlay = true;
        }
    }

    function startInteraction(x) {
        stop_rotation_hide_overlay();
        isInteracting = true;
        lastX = x;
    }

    function endInteraction() {
        isInteracting = false;
    }

    function moveInteraction(x) {
        if (!isInteracting) return;
        calculateIndexChange(x);
    }

    function rotate_one_right() {
        stop_rotation_hide_overlay();
        if (inf_rot || currentIndex < imageCount - 1){
            currentIndex = (currentIndex + 1) % imageCount;
            updateImage(currentIndex);
        }
    }
    function rotate_one_left() {
        stop_rotation_hide_overlay();
        if (inf_rot || currentIndex > 0){
            currentIndex = (currentIndex - 1 + imageCount) % imageCount;
            updateImage(currentIndex);
        }
    }

    // Mouse event listeners
    viewer.addEventListener('mousedown', function(e) {
        startInteraction(e.pageX);
        e.preventDefault();
    });

    document.addEventListener('mouseup', endInteraction);
    document.addEventListener('mousemove', function(e) {
        moveInteraction(e.pageX);
    });

    // Touch event listeners
    viewer.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            startInteraction(e.touches[0].pageX);
        }
    }, { passive: false });

    viewer.addEventListener('touchend', endInteraction);
    viewer.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1) {
            moveInteraction(e.touches[0].pageX);
        }
        e.preventDefault(); // Prevent scrolling and other default actions
    }, { passive: false });

    // Slider event listener
    slider.addEventListener('input', function() {
        stop_rotation_hide_overlay();
        currentIndex = parseInt(this.value, 10);
        updateImage(currentIndex);
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            rotate_one_right();
        } else if (e.key === 'ArrowLeft') {
            rotate_one_left();
        }
    });
    
    window.addEventListener('message', function(event) {
        // Always check the origin of the message for security reasons
        /*if (event.origin !== "http://your-parent-domain.com") { // Replace with your domain
            return;
        }*/
        
        if (event.data.key) {
            // Handle the key press
            if (event.data.key === 'ArrowRight') {
                rotate_one_right();
            } else if (event.data.key === 'ArrowLeft') {
                rotate_one_left();
            }
        }else {
            if (event.data.fontStyle) {
                // console.log(event.data.fontStyle);
                document.body.style.font = event.data.fontStyle;
            }
            if (event.data.config) {
                inf_rot = event.data.config.inf_rot;
                // console.log(inf_rot);
            }
        }
    }, false);
});
