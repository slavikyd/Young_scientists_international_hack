class GenerateManager {
    constructor() {
        this.isGenerating = false;
        this.maxRecipients = 0;
        this.init();
    }

    init() {
        document.getElementById('generateBtn').addEventListener('click', () => this.generate());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        
        document.getElementById('sendEmailToggle').addEventListener('change', (e) => {
            AppState.setEmailsEnabled(e.target.checked);
            ui.updateGeneratePreview();
        });

        document.getElementById('recipientsCountInput').addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 0;
            
            if (value > this.maxRecipients) {
                value = this.maxRecipients;
                e.target.value = value;
            }
            if (value < 0) {
                value = 0;
                e.target.value = value;
            }
            
            AppState.setRecipientCount(value);
            document.getElementById('previewRecipients').textContent = value;
        });
    }

    setMaxRecipients(max) {
        this.maxRecipients = max;
        document.getElementById('recipientsCountInput').max = max;
        document.getElementById('recipientsCountInput').value = Math.min(90, max);
        AppState.setRecipientCount(Math.min(90, max));
        document.getElementById('previewRecipients').textContent = Math.min(90, max);
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

        const recipientsCount = AppState.emailsEnabled ? AppState.recipientCount : null;
        
        if (AppState.emailsEnabled && (!recipientsCount || recipientsCount === 0)) {
            alert('Пожалуйста, введите количество получателей');
            return;
        }

        if (AppState.emailsEnabled && recipientsCount > AppState.participants.length) {
            alert(`Количество получателей не может быть больше ${AppState.participants.length}`);
            return;
        }

        this.isGenerating = true;
        document.getElementById('generateBtn').style.display = 'none';
        
        try {
            const response = await api.generateCertificates({
                templateId: AppState.selectedTemplate,
                sendEmails: AppState.emailsEnabled,
                recipientsCount: recipientsCount
            });

            ui.showStatus('generateStatus', 'Генерация завершена!', 'success');
            document.getElementById('generateStatus').classList.remove('hidden');
            document.getElementById('restartBtn').classList.remove('hidden');
        } catch (error) {
            ui.showStatus('generateStatus', `Ошибка: ${error.message}`, 'error');
            document.getElementById('generateBtn').style.display = 'block';
        }

        this.isGenerating = false;
    }

    restart() {
        if (!confirm('Начать заново? Все данные кроме шаблонов будут очищены.')) return;

        AppState.setUploadedFile(null);
        AppState.setParticipants([]);
        AppState.setRolesUsed([]);
        AppState.setPlacesUsed([]);
        AppState.selectTemplate(null);
        AppState.setEmailsEnabled(true);
        AppState.setRecipientCount(90);
        
        ui.hideElement('generateStatus');
        ui.hideElement('filePreviewSection');
        ui.hideElement('uploadStatus');
        ui.hideElement('recipientsCountItem');
        ui.showElement('fileFormatInfo');
        
        document.getElementById('generateBtn').style.display = 'block';
        document.getElementById('restartBtn').classList.add('hidden');
        document.getElementById('clearUploadBtn').classList.add('hidden');
        document.getElementById('fileInput').value = '';
        document.getElementById('templateFileInput').value = '';
        document.getElementById('sendEmailToggle').checked = true;
        
        this.maxRecipients = 0;
        document.getElementById('recipientsCountInput').value = 90;

        ui.disableNextSteps('templates');
        
        if (window.uploadManager) {
            window.uploadManager.uploadedFile = null;
            window.uploadManager.updateUploadAreaState();
        }

        if (window.templatesManager) {
            window.templatesManager.renderTemplates();
        }

        ui.goToPage('upload');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.generateManager = new GenerateManager();
});