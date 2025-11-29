class GenerateManager {
    constructor() {
        this.isGenerating = false;
        this.maxRecipients = 0;
        try {
            this.init();
        } catch (error) {
            console.error('❌ Error in GenerateManager.init():', error);
            console.error('Stack:', error.stack);
        }
    }

    init() {
        document.getElementById('generateBtn').addEventListener('click', () => this.generate());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        
        document.getElementById('sendEmailToggle').addEventListener('change', (e) => {
            AppState.setEmailsEnabled(e.target.checked);
            ui.updateGeneratePreview();
        });

        // Event details handlers
        document.getElementById('eventNameInput').addEventListener('change', (e) => {
            AppState.setEventName(e.target.value);
        });

        document.getElementById('eventLocationInput').addEventListener('change', (e) => {
            AppState.setEventLocation(e.target.value);
        });

        document.getElementById('issueDateInput').addEventListener('change', (e) => {
            AppState.setIssueDate(e.target.value);
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
            // previewRecipients should show total certificates, not the selected number
            const total = AppState.participants ? AppState.participants.length : 0;
            document.getElementById('previewRecipients').textContent = total || Math.min(90, this.maxRecipients);
        });
    }

    setMaxRecipients(max) {
        this.maxRecipients = max;
        document.getElementById('recipientsCountInput').max = max;
        document.getElementById('recipientsCountInput').value = Math.min(90, max);
        AppState.setRecipientCount(Math.min(90, max));
        // previewRecipients represents total certificates available
        document.getElementById('previewRecipients').textContent = max;
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
            // Get the selected template
            const selectedTemplate = AppState.getSelectedTemplate();
            if (!selectedTemplate) {
                throw new Error('Template not found');
            }

            // First, upload/save the template to backend if needed
            let backendTemplateId = selectedTemplate.id;
            
            // Check if this is a new template (not yet on backend)
            if (selectedTemplate.id && selectedTemplate.id.toString().includes('.')) {
                // This looks like a client-generated ID, upload template to backend
                console.log('Uploading template to backend...');
                const uploadResponse = await api.uploadTemplate({
                    name: selectedTemplate.name,
                    content: selectedTemplate.content,
                    type: selectedTemplate.type || 'html'
                });
                backendTemplateId = uploadResponse.id;
                console.log('Template uploaded, ID:', backendTemplateId);
            }

            // Now generate certificates with backend template ID
            const response = await api.generateCertificates({
                template_id: backendTemplateId,
                event_name: AppState.eventName || 'Certificate Event',
                event_location: AppState.eventLocation || 'Online',
                issue_date: AppState.issueDate || new Date().toISOString().split('T')[0],
                send_email: AppState.emailsEnabled
            });

            if (response.batch_id) {
    console.log('📦 Downloading ZIP:', response.batch_id);
    const downloadUrl = `/api/v1/certificates/download/${response.batch_id}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `certificates_${response.batch_id}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    console.log('✅ ZIP download started');
}

ui.showStatus('generateStatus', 'Генерация завершена! ZIP скачивается...', 'success');
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