const attachmentInput = document.getElementById('announcementAttachment');
const imagePreview = document.getElementById('imagePreview');
const announcementCategory = document.getElementById('announcementCategory');
const eventFields = document.getElementById('eventFields');
const eventDate = document.getElementById('eventDate');

if (announcementCategory && eventFields && eventDate) {
    const updateEventFields = () => {
        const isEvent = announcementCategory.value === 'Events';
        eventFields.hidden = !isEvent;
        eventDate.required = isEvent;
    };

    announcementCategory.addEventListener('change', updateEventFields);
    updateEventFields();
}

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
