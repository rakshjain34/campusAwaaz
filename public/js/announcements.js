const attachmentInput = document.getElementById('announcementAttachment');
const imagePreview = document.getElementById('imagePreview');

if (attachmentInput && imagePreview) {
    attachmentInput.addEventListener('change', function () {
        imagePreview.innerHTML = '';

        const file = this.files[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image.');
            this.value = '';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('Image must be smaller than 10 MB.');
            this.value = '';
            return;
        }

        const image = document.createElement('img');

        image.src = URL.createObjectURL(file);

        imagePreview.appendChild(image);
    });
}
