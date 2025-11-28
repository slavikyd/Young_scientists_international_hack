class UploadManager {
    constructor() {
        this.init();
    }

    init() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const clearBtn = document.getElementById('clearUploadBtn');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        clearBtn.addEventListener('click', () => this.clearUpload());
    }

    async handleFileUpload(files) {
        if (files.length === 0) return;

        const file = files[0];
        const isValid = file.name.endsWith('.csv') || file.name.endsWith('.xlsx');

        if (!isValid) {
            ui.showStatus('uploadStatus', 'Пожалуйста, загрузите CSV или XLSX файл', 'error');
            return;
        }

        try {
            const response = await api.uploadParticipants(file);
            
            ui.showStatus('uploadStatus', `✓ Успешно загружено ${response.participants.length} участников!`, 'success');
            ui.updateFilePreview(
                response.participants,
                file.name,
                AppState.rolesUsed,
                AppState.placesUsed
            );
            
            document.getElementById('clearUploadBtn').classList.remove('hidden');
        } catch (error) {
            ui.showStatus('uploadStatus', `Ошибка: ${error.message}`, 'error');
        }
    }

    clearUpload() {
        if (!confirm('Вы уверены? Это удалит все загруженные данные.')) return;

        AppState.setUploadedFile(null);
        AppState.setParticipants([]);
        AppState.setRolesUsed([]);
        AppState.setPlacesUsed([]);

        ui.hideElement('filePreviewSection');
        ui.hideElement('uploadStatus');
        document.getElementById('clearUploadBtn').classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.uploadManager = new UploadManager();
});