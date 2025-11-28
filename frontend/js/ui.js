class UIManager {
    constructor() {
        this.currentPage = 'upload';
        this.init();
    }

    init() {
        this.setupPageNavigation();
        this.setupLanguageSelector();
        this.disableAllNextSteps();
    }

    setupPageNavigation() {
        const stepBtns = document.querySelectorAll('.step-btn');
        stepBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                const step = btn.getAttribute('data-step');
                this.goToPage(step);
            });
        });
    }

    setupLanguageSelector() {
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                langBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    disableAllNextSteps() {
        document.querySelector('[data-step="templates"]').classList.add('disabled');
        document.querySelector('[data-step="generate"]').classList.add('disabled');
    }

    enableNextSteps(stepName) {
        if (stepName === 'templates') {
            document.querySelector('[data-step="templates"]').classList.remove('disabled');
        } else if (stepName === 'generate') {
            document.querySelector('[data-step="generate"]').classList.remove('disabled');
        }
    }

    disableNextSteps(stepName) {
        if (stepName === 'templates') {
            document.querySelector('[data-step="templates"]').classList.add('disabled');
            document.querySelector('[data-step="generate"]').classList.add('disabled');
        } else if (stepName === 'templates-select') {
            document.querySelector('[data-step="generate"]').classList.add('disabled');
        }
    }

    goToPage(pageName) {
        const pages = document.querySelectorAll('.page');
        const stepBtns = document.querySelectorAll('.step-btn');

        pages.forEach(page => page.classList.remove('active'));
        stepBtns.forEach(btn => btn.classList.remove('active'));

        document.getElementById(`${pageName}-page`).classList.add('active');
        document.querySelector(`[data-step="${pageName}"]`).classList.add('active');

        this.currentPage = pageName;

        // Set max recipients when going to generate page
        if (pageName === 'generate' && window.generateManager) {
            window.generateManager.setMaxRecipients(AppState.participants.length);
        }
    }

    showStatus(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.textContent = message;
        element.classList.remove('hidden', 'success', 'error', 'info');
        element.classList.add(type);
    }

    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.classList.add('hidden');
    }

    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) element.classList.remove('hidden');
    }

    updateTextContent(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) element.textContent = content;
    }

    updateFilePreview(participants, fileName, roles, places) {
        this.showElement('filePreviewSection');
        this.updateTextContent('fileName', `Файл ${fileName} загружен`);

        const tbody = document.querySelector('#participantsPreview tbody');
        tbody.innerHTML = participants.map(p => `
            <tr>
                <td>${p['фио'] || '-'}</td>
                <td>${p['почта'] || '-'}</td>
                <td>${p['роль'] || '-'}</td>
                <td>${p['место'] || '-'}</td>
            </tr>
        `).join('');

        const rolesText = roles.length > 0 ? roles.join(', ') : 'недоступно';
        const placesText = places.length > 0 ? places.join(', ') : 'недоступно';
        
        document.getElementById('rolesInfo').textContent = rolesText;
        document.getElementById('placesInfo').textContent = placesText;
    }

    updateGeneratePreview() {
        const selectedTemplate = AppState.getSelectedTemplate();
        const fileName = AppState.uploadedFile?.name || '-';
        const certCount = AppState.participants.length;

        this.updateTextContent('previewFileName', fileName);
        this.updateTextContent('previewCertCount', certCount);
        
        if (selectedTemplate) {
            const templateName = `${selectedTemplate.isDefault ? 'Стандартный' : ''} шаблон ${selectedTemplate.type.toUpperCase()} ${selectedTemplate.type === 'html' ? '</>' : '📄'}`;
            this.updateTextContent('previewTemplateName', templateName);
        }

        const emailToggle = document.getElementById('sendEmailToggle');
        const recipientsItem = document.getElementById('recipientsCountItem');
        
        if (emailToggle.checked) {
            this.showElement('recipientsCountItem');
        } else {
            this.hideElement('recipientsCountItem');
        }
    }
}

const ui = new UIManager();
window.ui = ui;