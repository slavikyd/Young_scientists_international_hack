class TemplatesManager {
    constructor() {
        this.editingId = null;
        this.templates = [];
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
        
        document.getElementById('previewBackdrop').addEventListener('click', () => this.closePreviewModal());
        document.getElementById('previewClose').addEventListener('click', () => this.closePreviewModal());
        document.getElementById('expandPreviewBtn').addEventListener('click', () => this.openFullPreview());

        // Load default templates
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
        grid.innerHTML = AppState.templates.map(template => `
            <div class="template-card">
                <div class="template-card-header">
                    <div class="template-icon">${template.type === 'html' ? '</>' : '📄'}</div>
                    <div class="template-info">
                        <div class="template-name">${template.name}</div>
                        <div class="template-type">${template.type.toUpperCase()}</div>
                    </div>
                    <button class="menu-btn" data-template-id="${template.id}">⋮</button>
                </div>
                ${AppState.selectedTemplate === template.id ? '<div class="template-is-selected">✓</div>' : ''}
            </div>
        `).join('');

        // Attach menu listeners
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateId = btn.getAttribute('data-template-id');
                this.showTemplateMenu(templateId, btn);
            });
        });

        // Attach card click listeners for selection
        document.querySelectorAll('.template-card').forEach((card, idx) => {
            card.addEventListener('click', () => {
                const template = AppState.templates[idx];
                AppState.selectTemplate(template.id);
                this.renderTemplates();
                ui.updateGeneratePreview();
            });
        });
    }

    showTemplateMenu(templateId, btnElement) {
        const template = AppState.templates.find(t => t.id === templateId);
        if (!template) return;

        const menu = document.createElement('div');
        menu.className = 'template-menu';
        menu.innerHTML = `
            <button class="template-menu-item" onclick="window.templatesManager.openViewModal('${templateId}')">Открыть просмотр</button>
            <button class="template-menu-item ${template.isStandard ? 'disabled' : ''}" onclick="window.templatesManager.openEditModal('${templateId}')" ${template.isStandard ? 'disabled' : ''}>Изменить шаблон</button>
            <button class="template-menu-item delete ${template.isStandard ? 'disabled' : ''}" onclick="window.templatesManager.deleteTemplate('${templateId}')" ${template.isStandard ? 'disabled' : ''}>Удалить</button>
        `;

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
        this.editingId = null;
        document.getElementById('modalTitle').textContent = 'Создание шаблона';
        document.getElementById('templateName').value = '';
        document.getElementById('templateDesc').value = '';
        document.getElementById('templateContent').value = '';
        document.getElementById('codeEditorSection').classList.add('hidden');
        document.getElementById('fileUploadArea').classList.remove('hidden');
        document.getElementById('loadedFileInfo').classList.add('hidden');
        document.getElementById('templateTypeDisplay').textContent = 'HTML';
        this.openModal();
    }

    openEditModal(templateId) {
        const template = AppState.templates.find(t => t.id === templateId);
        if (!template) return;

        this.editingId = templateId;
        document.getElementById('modalTitle').textContent = 'Изменение шаблона';
        document.getElementById('templateName').value = template.name;
        document.getElementById('templateDesc').value = template.description || '';
        document.getElementById('templateTypeDisplay').textContent = template.type.toUpperCase();
        
        if (template.type === 'pdf') {
            document.getElementById('codeEditorSection').classList.add('hidden');
            document.getElementById('fileUploadArea').classList.add('hidden');
        } else {
            document.getElementById('templateContent').value = template.content || '';
            document.getElementById('codeEditorSection').classList.remove('hidden');
            document.getElementById('fileUploadArea').classList.add('hidden');
        }

        this.openModal();
    }

    openViewModal(templateId) {
        const template = AppState.templates.find(t => t.id === templateId);
        if (!template) return;

        const container = document.getElementById('fullPreviewContainer');
        container.innerHTML = template.content || '<div style="text-align:center;padding:40px;">Содержимое шаблона</div>';
        document.getElementById('previewModal').classList.remove('hidden');
    }

    openModal() {
        document.getElementById('templateModal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('templateModal').classList.add('hidden');
        this.editingId = null;
    }

    closePreviewModal() {
        document.getElementById('previewModal').classList.add('hidden');
    }

    openFullPreview() {
        this.openViewModal(this.editingId);
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

        if (type === 'pdf') {
            document.getElementById('codeEditorSection').classList.add('hidden');
        } else {
            const reader = new FileReader();
            reader.onload = (evt) => {
                document.getElementById('templateContent').value = evt.target.result;
                document.getElementById('codeEditorSection').classList.remove('hidden');
            };
            reader.readAsText(file);
        }

        document.getElementById('loadedFileName').textContent = `Файл ${file.name} загружен`;
        document.getElementById('loadedFileInfo').classList.remove('hidden');
        document.getElementById('fileUploadArea').classList.add('hidden');
    }

    deleteFile() {
        document.getElementById('loadedFileInfo').classList.add('hidden');
        document.getElementById('fileUploadArea').classList.remove('hidden');
        document.getElementById('codeEditorSection').classList.add('hidden');
        document.getElementById('templateContent').value = '';
        document.getElementById('templateFileInput').value = '';
    }

    saveTemplate() {
        const name = document.getElementById('templateName').value.trim();
        const desc = document.getElementById('templateDesc').value.trim();
        const content = document.getElementById('templateContent').value;
        const type = document.getElementById('templateTypeDisplay').textContent.toLowerCase();

        if (!name) {
            alert('Пожалуйста, введите название шаблона');
            return;
        }

        const template = {
            name,
            description: desc,
            content,
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
        AppState.deleteTemplate(templateId);
        this.renderTemplates();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.templatesManager = new TemplatesManager();
});