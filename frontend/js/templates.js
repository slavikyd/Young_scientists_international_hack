class TemplatesManager {
    constructor() {
        this.editingId = null;
        this.loadedFile = null;
        this.isCreating = false;
        this.init();
    }

    init() {
        document.getElementById('addTemplateBtn').addEventListener('click', () => this.openCreateModal());
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());
        document.getElementById('modalSave').addEventListener('click', () => this.saveTemplate());
        document.getElementById('modalBackdrop').addEventListener('click', () => this.closeModal());
        
        document.getElementById('chooseFileBtn').addEventListener('click', () => this.chooseFile());
        document.getElementById('insertCodeBtn').addEventListener('click', () => this.insertCode());
        document.getElementById('deleteFileBtn').addEventListener('click', () => this.deleteFile());
        document.getElementById('templateFileInput').addEventListener('change', (e) => this.handleTemplateFile(e));
        document.getElementById('fileUploadArea').addEventListener('dragover', (e) => {
            e.preventDefault();
            document.getElementById('fileUploadArea').classList.add('dragover');
        });
        document.getElementById('fileUploadArea').addEventListener('dragleave', () => {
            document.getElementById('fileUploadArea').classList.remove('dragover');
        });
        document.getElementById('fileUploadArea').addEventListener('drop', (e) => {
            e.preventDefault();
            document.getElementById('fileUploadArea').classList.remove('dragover');
            this.handleTemplateFile({ target: { files: e.dataTransfer.files } });
        });
        document.getElementById('fileUploadArea').addEventListener('click', () => this.chooseFile());
        
        document.getElementById('previewBackdrop').addEventListener('click', () => this.closePreviewModal());
        document.getElementById('previewClose').addEventListener('click', () => this.closePreviewModal());
        document.getElementById('expandPreviewBtn').addEventListener('click', () => this.openFullPreview());
        document.getElementById('templateContent').addEventListener('input', () => this.updateCodePreview());

        this.loadDefaultTemplates();
        this.renderTemplates();
    }

    loadDefaultTemplates() {
        const defaults = [
            {
                name: 'Стандартный шаблон HTML',
                type: 'html',
                description: 'Базовый HTML сертификат',
                content: '<div style="text-align:center;"><h1>Сертификат</h1><p>{{participant_name}}</p></div>',
                isDefault: true,
                isStandard: true
            },
            {
                name: 'Стандартный шаблон PDF',
                type: 'pdf',
                description: 'PDF сертификат',
                content: null,
                isDefault: true,
                isStandard: true
            }
        ];

        defaults.forEach(t => {
            t.id = Date.now().toString() + Math.random();
            AppState.templates.push(t);
        });
    }

    renderTemplates() {
        const grid = document.getElementById('templatesGrid');
        grid.innerHTML = AppState.templates.map((template, idx) => `
            <div class="template-card" data-template-id="${template.id}">
                <div class="template-card-header">
                    <div class="template-icon">${template.type === 'html' ? '</>' : '📄'}</div>
                    <div class="template-info">
                        <div class="template-name">${template.name}</div>
                        <div class="template-type">${template.type.toUpperCase()}</div>
                    </div>
                </div>
                ${AppState.selectedTemplate === template.id ? '<div class="template-is-selected">✓</div>' : ''}
                <button class="menu-btn" data-template-id="${template.id}">⋮</button>
            </div>
        `).join('');

        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateId = btn.getAttribute('data-template-id');
                this.showTemplateMenu(templateId, btn);
            });
        });

        document.querySelectorAll('.template-card').forEach((card) => {
            card.addEventListener('click', () => {
                const templateId = card.getAttribute('data-template-id');
                const template = AppState.templates.find(t => t.id === templateId);
                AppState.selectTemplate(template.id);
                this.renderTemplates();
                ui.updateGeneratePreview();
                ui.enableNextSteps('generate');
            });
        });
    }

    showTemplateMenu(templateId, btnElement) {
        const template = AppState.templates.find(t => t.id === templateId);
        if (!template) return;

        const menu = document.createElement('div');
        menu.className = 'template-menu';
        
        let menuHTML = `<button class="template-menu-item" onclick="window.templatesManager.openViewModal('${templateId}')">Открыть просмотр</button>`;
        
        if (!template.isStandard) {
            menuHTML += `
                <button class="template-menu-item" onclick="window.templatesManager.openEditModal('${templateId}')">Изменить шаблон</button>
                <button class="template-menu-item delete" onclick="window.templatesManager.deleteTemplate('${templateId}')">Удалить</button>
            `;
        }
        
        menu.innerHTML = menuHTML;

        document.body.appendChild(menu);
        const rect = btnElement.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = (rect.left - 150) + 'px';
        menu.style.zIndex = '1001';

        const close = () => {
            menu.remove();
            document.removeEventListener('click', close);
        };

        setTimeout(() => document.addEventListener('click', close), 0);
    }

    openCreateModal() {
        this.isCreating = true;
        this.editingId = null;
        this.loadedFile = null;
        document.getElementById('modalTitle').textContent = 'Создание шаблона';
        document.getElementById('templateName').value = '';
        document.getElementById('templateDesc').value = '';
        document.getElementById('templateContent').value = '';
        document.getElementById('codeEditorSection').classList.add('hidden');
        document.getElementById('fileUploadArea').classList.remove('hidden');
        document.getElementById('loadedFileInfo').classList.add('hidden');
        document.getElementById('templateTypeDisplay').textContent = 'HTML';
        document.getElementById('templateFileInput').value = '';
        document.getElementById('templateInputButtons').style.display = 'flex';
        this.updateCodePreview();
        this.openModal();
    }

    openEditModal(templateId) {
        const template = AppState.templates.find(t => t.id === templateId);
        if (!template) return;

        this.isCreating = false;
        this.editingId = templateId;
        this.loadedFile = null;
        document.getElementById('modalTitle').textContent = 'Изменение шаблона';
        document.getElementById('templateName').value = template.name;
        document.getElementById('templateDesc').value = template.description || '';
        document.getElementById('templateTypeDisplay').textContent = template.type.toUpperCase();
        
        if (template.type === 'pdf') {
            document.getElementById('codeEditorSection').classList.add('hidden');
            document.getElementById('fileUploadArea').classList.remove('hidden');
            document.getElementById('loadedFileInfo').classList.add('hidden');
            document.getElementById('templateInputButtons').style.display = 'none';
        } else {
            document.getElementById('templateContent').value = template.content || '';
            document.getElementById('codeEditorSection').classList.remove('hidden');
            document.getElementById('fileUploadArea').classList.add('hidden');
            document.getElementById('loadedFileInfo').classList.add('hidden');
            document.getElementById('templateInputButtons').style.display = 'none';
        }

        this.updateCodePreview();
        this.openModal();
    }

    openViewModal(templateId) {
        const template = AppState.templates.find(t => t.id === templateId);
        if (!template) return;

        if (template.type === 'pdf') {
            alert('Просмотр PDF документов открывается в отдельной программе');
            return;
        }

        const container = document.getElementById('fullPreviewContainer');
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.srcdoc = template.content || '';
        container.innerHTML = '';
        container.appendChild(iframe);
        document.getElementById('previewModal').classList.remove('hidden');
    }

    updateCodePreview() {
        const content = document.getElementById('templateContent').value;
        const preview = document.getElementById('templatePreview');
        
        if (content.trim()) {
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.srcdoc = content;
            preview.innerHTML = '';
            preview.appendChild(iframe);
        } else {
            preview.innerHTML = `<div class="preview-placeholder">ТУТ БУДЕТ КАКАЯ-НИБУДЬ КРАСИВАЯ КАРТИНКА ШАБЛОНА</div><button class="preview-expand-btn" id="expandPreviewBtn" title="Развернуть">🔲</button>`;
        }
    }

    openModal() {
        document.getElementById('templateModal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('templateModal').classList.add('hidden');
        this.editingId = null;
        this.loadedFile = null;
        this.isCreating = false;
    }

    closePreviewModal() {
        document.getElementById('previewModal').classList.add('hidden');
    }

    openFullPreview() {
        if (this.editingId) {
            this.openViewModal(this.editingId);
        }
    }

    chooseFile() {
        document.getElementById('templateFileInput').click();
    }

    insertCode() {
        document.getElementById('codeEditorSection').classList.remove('hidden');
        document.getElementById('fileUploadArea').classList.add('hidden');
    }

    handleTemplateFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const type = file.name.endsWith('.pdf') ? 'pdf' : 'html';
        document.getElementById('templateTypeDisplay').textContent = type.toUpperCase();
        this.loadedFile = { file, type };

        if (type === 'pdf') {
            document.getElementById('codeEditorSection').classList.add('hidden');
        } else {
            const reader = new FileReader();
            reader.onload = (evt) => {
                document.getElementById('templateContent').value = evt.target.result;
                document.getElementById('codeEditorSection').classList.remove('hidden');
                this.updateCodePreview();
            };
            reader.readAsText(file);
        }

        document.getElementById('loadedFileName').textContent = `Файл ${file.name} загружен`;
        document.getElementById('loadedFileInfo').classList.remove('hidden');
        document.getElementById('fileUploadArea').classList.add('hidden');
    }

    deleteFile() {
        this.loadedFile = null;
        document.getElementById('loadedFileInfo').classList.add('hidden');
        document.getElementById('fileUploadArea').classList.remove('hidden');
        document.getElementById('codeEditorSection').classList.add('hidden');
        document.getElementById('templateContent').value = '';
        document.getElementById('templateFileInput').value = '';
        document.getElementById('templateTypeDisplay').textContent = 'HTML';
    }

    saveTemplate() {
        const name = document.getElementById('templateName').value.trim();
        const desc = document.getElementById('templateDesc').value.trim();
        const content = document.getElementById('templateContent').value.trim();
        const type = document.getElementById('templateTypeDisplay').textContent.toLowerCase();

        if (!name) {
            alert('Пожалуйста, введите название шаблона');
            return;
        }

        if (type === 'html' && !content) {
            alert('HTML шаблон не может быть пустым');
            return;
        }

        if (type === 'pdf' && !this.loadedFile) {
            alert('Пожалуйста, загрузите PDF файл');
            return;
        }

        const template = {
            name,
            description: desc,
            content: type === 'html' ? content : this.loadedFile?.file?.name || null,
            type,
            isDefault: false,
            isStandard: false
        };

        if (this.editingId) {
            AppState.updateTemplate(this.editingId, template);
        } else {
            AppState.addTemplate(template);
        }

        this.closeModal();
        this.renderTemplates();
    }

    deleteTemplate(templateId) {
        if (!confirm('Вы уверены? Это удалит шаблон.')) return;
        
        if (AppState.selectedTemplate === templateId) {
            AppState.selectTemplate(null);
            ui.disableNextSteps('templates-select');
        }
        
        AppState.deleteTemplate(templateId);
        this.renderTemplates();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.templatesManager = new TemplatesManager();
});