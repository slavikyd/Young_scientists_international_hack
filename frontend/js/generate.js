class GenerateManager {
    constructor() {
        this.isGenerating = false;
        this.init();
    }

    init() {
        document.getElementById('generateBtn').addEventListener('click', () => this.generate());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        
        document.getElementById('sendEmailToggle').addEventListener('change', (e) => {
            AppState.setEmailsEnabled(e.target.checked);
            ui.updateGeneratePreview();
        });
    }

    async generate() {
        if (AppState.participants.length === 0) {
            alert('Пожалуйста, загрузите файл с участниками');
            return;
        }

        if (!AppState.selectedTemplate) {
            alert('Пожалуйста, выберите шаблон');
            return;
        }

        this.isGenerating = true;
        document.getElementById('generateBtn').style.display = 'none';
        
        try {
            const response = await api.generateCertificates({
                templateId: AppState.selectedTemplate,
                sendEmails: AppState.emailsEnabled
            });

            ui.showStatus('generateStatus', 'Генерация завершена!', 'success');
            document.getElementById('generateStatus').classList.remove('hidden');
            document.getElementById('restartBtn').classList.remove('hidden');
        } catch (error) {
            ui.showStatus('generateStatus', `Ошибка: ${error.message}`, 'error');
        }

        this.isGenerating = false;
    }

    restart() {
        if (!confirm('Начать заново? Все текущие данные будут очищены.')) return;

        AppState.reset();
        
        ui.hideElement('generateStatus');
        ui.hideElement('filePreviewSection');
        ui.hideElement('uploadStatus');
        ui.hideElement('recipientsCountItem');
        
        document.getElementById('generateBtn').style.display = 'block';
        document.getElementById('restartBtn').classList.add('hidden');
        document.getElementById('clearUploadBtn').classList.add('hidden');
        document.getElementById('fileInput').value = '';
        document.getElementById('templateFileInput').value = '';

        ui.goToPage('upload');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.generateManager = new GenerateManager();
});