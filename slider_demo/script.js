/*document.addEventListener('DOMContentLoaded', function() {
    const iframe = document.getElementById('viewer-iframe');
    if (iframe && iframe.dataset.config) {
        const config = JSON.parse(iframe.dataset.config);
        // console.log(config);
        iframe.contentWindow.postMessage({ config: config }, '*'); // Replace '*' with the iframe's origin
    } else {
        console.error('Data attribute is not set or iframe is not found');
    }
});*/

window.addEventListener('message', function(event) {
    //console.log('Message received:', event.data); // Log the received message

    // Check event.origin here for security
    if (event.data.iframeWidth) {
        var iframe = document.querySelector('.responsive-iframe');
        iframe.style.width = event.data.iframeWidth + 'px';
    }
});

const iframe = document.getElementById('viewer-iframe');

window.addEventListener('keydown', function(event) {
    iframe.contentWindow.postMessage({ key: event.key }, '*'); // Replace '*' with the iframe's origin for security
});


iframe.onload = function() {
    const config = JSON.parse(iframe.dataset.config);
    const parentFontStyle = window.getComputedStyle(document.body).font;
    iframe.contentWindow.postMessage({ fontStyle: parentFontStyle, config: config }, '*'); // Replace '*' with the iframe's origin
};

