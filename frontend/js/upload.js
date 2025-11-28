// Upload functionality
class UploadManager {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.browseLink = document.getElementById('browseLink');
        this.uploadStatus = document.getElementById('uploadStatus');
        this.participants = [];
        this.init();
    }

    init() {
        this.browseLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.fileInput.click();
        });

        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
    }

    async handleFileUpload(files) {
        if (files.length === 0) return;

        const file = files[0];
        const validFormats = ['.csv', '.xlsx'];
        const isValidFormat = validFormats.some(format => file.name.endsWith(format));

        if (!isValidFormat) {
            this.showStatus('Please upload a CSV or XLSX file', 'error');
            return;
        }

        try {
            this.showStatus('Uploading...', 'info');
            const response = await api.uploadParticipants(file);
            
            this.participants = response.participants || [];
            this.showStatus(
                `✓ Successfully uploaded ${this.participants.length} participants!`,
                'success'
            );

            // Update state for other components
            window.appState = window.appState || {};
            window.appState.participantsUploaded = true;
            window.appState.participantsCount = this.participants.length;

            // Trigger event for other components
            document.dispatchEvent(new CustomEvent('participantsUploaded', {
                detail: { count: this.participants.length }
            }));

        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            console.error('Upload error:', error);
        }
    }

    showStatus(message, type) {
        this.uploadStatus.textContent = message;
        this.uploadStatus.classList.remove('hidden', 'success', 'error', 'info');
        this.uploadStatus.classList.add(type);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new UploadManager();
});
