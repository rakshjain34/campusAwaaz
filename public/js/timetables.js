const fileInput = document.getElementById('ttAttachment');
const filePreview = document.getElementById('ttFilePreview');

if (fileInput && filePreview) {
    fileInput.addEventListener('change', function () {
        filePreview.innerHTML = '';

        const file = this.files[0];

        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

        if (!allowedTypes.includes(file.type)) {
            alert('Only JPG, PNG, WEBP and PDF files are allowed.');
            this.value = '';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be below 10 MB.');
            this.value = '';
            return;
        }

        if (file.type.startsWith('image/')) {
            const image = document.createElement('img');
            image.src = URL.createObjectURL(file);

            filePreview.appendChild(image);
        } else {
            const box = document.createElement('div');
            box.className = 'tt-file-name';

            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-file-pdf';

            const name = document.createElement('span');
            name.textContent = file.name;

            box.appendChild(icon);
            box.appendChild(name);

            filePreview.appendChild(box);
        }
    });
}

// CLUB SELECTOR

const scopeSelect = document.getElementById('ttScope');
const clubGroup = document.getElementById('ttClubGroup');
const clubSelect = document.getElementById('ttClub');

if (scopeSelect && clubGroup) {
    const updateClubVisibility = () => {
        const isClub = scopeSelect.value === 'Club';

        clubGroup.style.display = isClub ? 'block' : 'none';

        if (clubSelect) {
            clubSelect.required = isClub;
        }
    };

    scopeSelect.addEventListener('change', updateClubVisibility);

    updateClubVisibility();
}
