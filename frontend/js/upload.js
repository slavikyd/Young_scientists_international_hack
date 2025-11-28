class UploadManager {
    constructor() {
        this.uploadedFile = null;
        this.init();
    }

    init() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const clearBtn = document.getElementById('clearUploadBtn');

        uploadArea.addEventListener('dragover', (e) => {
            if (this.uploadedFile) return;
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            if (this.uploadedFile) return;
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        uploadArea.addEventListener('click', () => {
            if (!this.uploadedFile) fileInput.click();
        });

        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        clearBtn.addEventListener('click', () => this.clearUpload());

        // Download example files
        document.getElementById('downloadXlsx').addEventListener('click', () => this.downloadExample('xlsx'));
        document.getElementById('downloadCsv').addEventListener('click', () => this.downloadExample('csv'));

        this.updateUploadAreaState();
    }

    downloadExample(format) {
        const data = `ФИО,Почта,Роль,Место
Пупкин Василий Жёнович,vasiliy@pupka.net,Победитель,1
Любопыткина Варвара Безносая,varvara@nosa.net,Участник,
Иванов Петр Сергеевич,peter@ivan.ru,Победитель,2
Сидорова Мария Ивановна,maria@sidorova.ru,Участник,
Смирнов Иван Николаевич,ivan@smirnov.org,Участник,3
Козлова Елена Петровна,elena@kozlova.net,Участник,`;

        const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `example_participants.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    updateUploadAreaState() {
        const uploadArea = document.getElementById('uploadArea');
        if (this.uploadedFile) {
            uploadArea.style.opacity = '0.5';
            uploadArea.style.cursor = 'not-allowed';
            uploadArea.style.pointerEvents = 'none';
        } else {
            uploadArea.style.opacity = '1';
            uploadArea.style.cursor = 'pointer';
            uploadArea.style.pointerEvents = 'auto';
        }
    }

    async handleFileUpload(files) {
        if (files.length === 0 || this.uploadedFile) return;

        const file = files[0];
        const isValid = file.name.endsWith('.csv') || file.name.endsWith('.xlsx');

        if (!isValid) {
            ui.showStatus('uploadStatus', 'Пожалуйста, загрузите CSV или XLSX файл', 'error');
            return;
        }

        try {
            const response = await api.uploadParticipants(file);
            
            this.uploadedFile = file;
            ui.showStatus('uploadStatus', `✓ Успешно загружено ${response.participants.length} участников!`, 'success');
            
            ui.hideElement('fileFormatInfo');
            
            ui.updateFilePreview(
                response.participants,
                file.name,
                AppState.rolesUsed,
                AppState.placesUsed
            );
            
            document.getElementById('clearUploadBtn').classList.remove('hidden');
            this.updateUploadAreaState();
            
            ui.enableNextSteps('templates');
            
        } catch (error) {
            ui.showStatus('uploadStatus', `Ошибка: ${error.message}`, 'error');
        }
    }

    clearUpload() {
        if (!confirm('Вы уверены? Это удалит все загруженные данные.')) return;

        this.uploadedFile = null;
        AppState.setUploadedFile(null);
        AppState.setParticipants([]);
        AppState.setRolesUsed([]);
        AppState.setPlacesUsed([]);

        ui.hideElement('filePreviewSection');
        ui.hideElement('uploadStatus');
        ui.showElement('fileFormatInfo');
        document.getElementById('clearUploadBtn').classList.add('hidden');
        document.getElementById('fileInput').value = '';
        
        this.updateUploadAreaState();
        ui.disableNextSteps('templates');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.uploadManager = new UploadManager();
});