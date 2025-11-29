class TemplatesManager {
    constructor() {
        this.editingId = null;
        this.loadedFile = null;
        this.isCreating = false;
        try {
            this.init();
        } catch (error) {
            console.error('❌ Error in TemplatesManager.init():', error);
            console.error('Stack:', error.stack);
        }
    }

    init() {
        console.log('📍 TemplatesManager.init() called');
        // Attach listeners defensively (elements might be missing or dynamically replaced)
        const safeOn = (id, evt, cb) => {
            const el = document.getElementById(id);
            console.log(`  - ${id}:`, !!el);
            if (el) el.addEventListener(evt, cb);
        };

        safeOn('addTemplateBtn', 'click', () => {
            console.log('🖱️ Add Template button clicked');
            this.openCreateModal();
        });
        safeOn('modalClose', 'click', () => this.closeModal());
        safeOn('modalCancel', 'click', () => this.closeModal());
        safeOn('modalSave', 'click', () => this.saveTemplate());
        safeOn('modalBackdrop', 'click', () => this.closeModal());

        safeOn('chooseFileBtn', 'click', () => this.chooseFile());
        safeOn('insertCodeBtn', 'click', () => this.insertCode());
        safeOn('deleteFileBtn', 'click', () => this.deleteFile());
        const fileInput = document.getElementById('templateFileInput');
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleTemplateFile(e));

        const uploadArea = document.getElementById('fileUploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                this.handleTemplateFile({ target: { files: e.dataTransfer.files } });
            });
            uploadArea.addEventListener('click', () => this.chooseFile());
        }

        safeOn('previewBackdrop', 'click', () => this.closePreviewModal());
        safeOn('previewClose', 'click', () => this.closePreviewModal());
        const expandBtn = document.getElementById('expandPreviewBtn');
        if (expandBtn) expandBtn.addEventListener('click', () => this.openFullPreview());
        const tmplContent = document.getElementById('templateContent');
        if (tmplContent) tmplContent.addEventListener('input', () => this.updateCodePreview());

        this.loadDefaultTemplates();
        this.renderTemplates();
    }

    loadDefaultTemplates() {
        const defaults = [
            {
                name: 'Стандартный шаблон HTML',
                type: 'html',
                description: 'Базовый HTML сертификат',
                content: '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html;charset=UTF-8"><style>@import url("https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap&subset=cyrillic");*{margin:0;padding:0;font-family:"Noto Sans","Arial Unicode MS","Segoe UI",Arial,sans-serif;}html,body{width:100%;height:100%;margin:0;padding:0;}body{background:white;}.certificate{width:297mm;height:210mm;position:relative;background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%);border:8px solid #1a5490;box-sizing:border-box;padding:30px 40px;display:flex;flex-direction:column;justify-content:space-between;text-align:center;page-break-after:always;overflow:hidden;}.certificate-header{flex:0 0 auto;margin-bottom:20px;}.certificate-title{font-size:48px;font-weight:700;color:#1a5490;margin-bottom:5px;letter-spacing:2px;line-height:1.2;}.certificate-subtitle{font-size:22px;color:#2c3e50;font-style:italic;line-height:1.1;}.certificate-body{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;margin:10px 0;min-height:0;}.body-text{font-size:16px;color:#34495e;margin:8px 0;line-height:1.3;}.participant-name{font-size:40px;font-weight:700;color:#1a5490;margin:15px 0;text-decoration:underline;letter-spacing:1px;word-wrap:break-word;line-height:1.2;}.achievement-text{font-size:18px;color:#2c3e50;margin:12px 0;line-height:1.2;}.details-box{background:rgba(255,255,255,0.75);border-left:4px solid #1a5490;padding:12px 18px;margin:15px 30px;text-align:left;font-size:14px;color:#34495e;flex:0 0 auto;}.detail-row{display:flex;justify-content:space-between;margin:6px 0;line-height:1.3;}.detail-label{font-weight:700;min-width:110px;flex-shrink:0;}.detail-value{flex-grow:1;text-align:right;word-wrap:break-word;}.certificate-footer{flex:0 0 auto;display:flex;justify-content:space-between;align-items:flex-end;margin-top:25px;padding-top:15px;border-top:2px solid #1a5490;}.signature-box{width:130px;text-align:center;font-size:11px;color:#2c3e50;flex:0 0 auto;}.signature-line{border-top:2px solid #1a5490;margin-bottom:4px;height:40px;}.signature-title{font-weight:700;font-size:10px;line-height:1.2;}.seal-placeholder{width:85px;height:85px;border:2px solid #1a5490;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#1a5490;text-align:center;padding:8px;flex:0 0 auto;font-weight:700;}</style></head><body><div class="certificate"><div class="certificate-header"><div class="certificate-title">🏆 СЕРТИФИКАТ 🏆</div><div class="certificate-subtitle">О прохождении обучения</div></div><div class="certificate-body"><div class="body-text">Настоящий сертификат удостоверяет, что</div><div class="participant-name">{{ participant_name }}</div><div class="achievement-text">успешно завершил программу обучения</div><div class="details-box"><div class="detail-row"><span class="detail-label">Должность:</span><span class="detail-value">{{ role }}</span></div><div class="detail-row"><span class="detail-label">Событие:</span><span class="detail-value">{{ event_name }}</span></div><div class="detail-row"><span class="detail-label">Место:</span><span class="detail-value">{{ event_location }}</span></div><div class="detail-row"><span class="detail-label">Дата выдачи:</span><span class="detail-value">{{ issue_date }}</span></div></div></div><div class="certificate-footer"><div class="signature-box"><div class="signature-line"></div><div class="signature-title">Подпись<br/>руководителя</div></div><div class="seal-placeholder">ПЕЧАТЬ</div><div class="signature-box"><div class="signature-line"></div><div class="signature-title">Подпись<br/>директора</div></div></div></div></body></html>',
                isDefault: true,
                isStandard: true
            },
            {
                name: 'Стандартный шаблон SVG',
                type: 'svg',
                description: 'Базовый SVG сертификат',
                content: '<svg width="210mm" height="297mm" viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css">@font-face{font-family:\'DejaVuSans\';src:local(\'DejaVu Sans\');}.font-main{font-family:\'DejaVuSans\',Arial,sans-serif;}.teal{fill:#005F6B;}.copper{fill:#C58940;}.white{fill:#FFFFFF;}.gray-text{fill:#34495e;}.title-text{font-size:13px;font-weight:bold;letter-spacing:0.8;}.subtitle-text{font-size:5px;font-style:italic;}.body-text{font-size:4.5px;}.name-text{font-size:10px;font-weight:bold;}.small-text{font-size:3.5px;}.signature-label{font-size:4px;font-weight:500;}.date-text{font-size:4px;}</style><pattern id="diagonalStripe" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="#005F6B"/><rect x="0" y="3" width="6" height="3" fill="#C58940"/></pattern></defs><rect width="210" height="297" fill="white"/><rect x="0" y="0" width="210" height="297" stroke="#005F6B" stroke-width="5" fill="none"/><g transform="translate(5 5)"><rect x="0" y="0" width="200" height="287" stroke="#C58940" stroke-width="0.5" fill="none"/><g transform="translate(0 0)"><rect x="0" y="0" width="200" height="6" fill="url(#diagonalStripe)"/><rect x="0" y="281" width="200" height="6" fill="url(#diagonalStripe)"/><rect x="0" y="6" width="200" height="95" fill="#005F6B"/><text x="100" y="93" class="font-main white title-text" text-anchor="middle">СЕРТИФИКАТ</text><g transform="translate(0 101)"><text x="100" y="5" class="font-main copper subtitle-text" text-anchor="middle">О признании заслуг и достижений</text><line x1="70" y1="8" x2="130" y2="8" stroke="#C58940" stroke-width="0.5"/><text x="100" y="25" class="font-main gray-text body-text" text-anchor="middle">Настоящим подтверждается, что</text><text x="100" y="45" class="font-main copper name-text" text-anchor="middle">{{ participant_name }}</text><line x1="40" y1="47" x2="160" y2="47" stroke="#005F6B" stroke-width="0.3"/><g class="font-main gray-text body-text" text-anchor="middle"><text x="100" y="65">Успешно принял(а) участие в мероприятии</text><text x="100" y="72" class="teal">"{{ event_name }}"</text><text x="100" y="79">в качестве роли "{{ role }}".</text></g><text x="100" y="95" class="font-main gray-text small-text" text-anchor="middle">Место проведения: {{ event_location }}</text><line x1="30" y1="120" x2="170" y2="120" stroke="#C58940" stroke-width="0.3" stroke-dasharray="2 1"/></g><g transform="translate(0 220)"><line x1="0" y1="0" x2="200" y2="0" stroke="#C58940" stroke-width="0.3"/><g transform="translate(40 10)" class="font-main date-text gray-text" text-anchor="start"><text x="-30" y="0">Дата выдачи:</text><text x="-30" y="4" font-weight="bold">{{ issue_date }}</text></g><g transform="translate(100 45)"><circle r="10" stroke="#005F6B" stroke-width="0.5" fill="none"/><text x="0" y="-1" class="font-main teal small-text" text-anchor="middle">МЕСТО ДЛЯ</text><text x="0" y="3" class="font-main teal small-text" text-anchor="middle">ПЕЧАТИ</text></g><g transform="translate(140 10)"><text x="0" y="0" class="font-main teal signature-label" text-anchor="start">Директор</text><line x1="25" y1="0" x2="90" y2="0" stroke="#005F6B" stroke-width="0.3"/><text x="0" y="8" class="font-main teal signature-label" text-anchor="start">Руководитель программы</text><line x1="45" y1="8" x2="90" y2="8" stroke="#005F6B" stroke-width="0.3"/></g></g></g></g></svg>',
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
        grid.innerHTML = AppState.templates.map((template, idx) => {
            const iconPath = `assets/icons/${template.type}-icon.svg`;
            const typeIcon = `<img src="${iconPath}" alt="${template.type}" style="width: 24px; height: 24px;">`;
            return `
            <div class="template-card" data-template-id="${template.id}">
                <div class="template-card-header">
                    <div style="font-size: 24px; margin-right: 12px;">${typeIcon}</div>
                    <div style="flex: 1;">
                        <div class="template-card-name">${template.name}</div>
                        <div class="template-card-type">${template.type.toUpperCase()}</div>
                    </div>
                </div>
                ${AppState.selectedTemplate === template.id ? '<div style="color: var(--color-primary); font-weight: bold; font-size: 18px;">✓</div>' : ''}
                ${!template.isStandard ? `<button class="menu-btn" data-template-id="${template.id}" style="position: absolute; top: 10px; right: 10px;">⋮</button>` : ''}
            </div>
            `;
        }).join('');

        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateId = btn.getAttribute('data-template-id');
                this.showTemplateMenu(templateId, btn);
            });
            // Disable context menu on menu button
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
        });

        document.querySelectorAll('.template-card').forEach((card) => {
            const templateId = card.getAttribute('data-template-id');
            // clicking the card selects template
            card.addEventListener('click', () => {
                const template = AppState.templates.find(t => t.id === templateId);
                AppState.selectTemplate(template.id);
                if (typeof AppState.setPreviewIndex === 'function') AppState.setPreviewIndex(1);
                else AppState.previewIndex = 1;
                this.renderTemplates();
                ui.updateGeneratePreview();
                ui.enableNextSteps('generate');
            });
            // Disable context menu on template cards
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
        });
    }

    showTemplateMenu(templateId, btnElement) {
        const template = AppState.templates.find(t => t.id === templateId);
        if (!template) return;

        const menu = document.createElement('div');
        menu.className = 'template-menu';
        
        let menuHTML = `
            <button class="template-menu-item" onclick="window.templatesManager.openEditModal('${templateId}')">Изменить шаблон</button>
            <button class="template-menu-item delete" onclick="window.templatesManager.deleteTemplate('${templateId}')">Удалить</button>
        `;
        
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
        try {
            console.log('📝 openCreateModal() starting...');
            this.isCreating = true;
            this.editingId = null;
            this.loadedFile = null;
            console.log('  - setting title...');
            document.getElementById('modalTitle').textContent = 'Создание шаблона';
            console.log('  - clearing inputs...');
            document.getElementById('templateName').value = '';
            document.getElementById('templateDesc').value = '';
            document.getElementById('templateContent').value = '';
            console.log('  - toggling visibility...');
            document.getElementById('codeEditorSection').classList.add('hidden');
            document.getElementById('fileUploadArea').classList.remove('hidden');
            document.getElementById('loadedFileInfo').classList.add('hidden');
            document.getElementById('templateTypeDisplay').textContent = 'HTML';
            document.getElementById('templateFileInput').value = '';
            document.getElementById('templateInputButtons').style.display = 'flex';
            console.log('  - updating preview...');
            this.updateCodePreview();
            console.log('  - calling openModal()...');
            this.openModal();
            console.log('✅ openCreateModal() complete');
        } catch (error) {
            console.error('❌ Error in openCreateModal():', error);
            console.error('Stack:', error.stack);
        }
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
        
        if (template.type === 'svg') {
            document.getElementById('codeEditorSection').classList.add('hidden');
            document.getElementById('fileUploadArea').classList.remove('hidden');
            document.getElementById('loadedFileInfo').classList.add('hidden');
            document.getElementById('templateInputButtons').style.display = 'none';
            // If template already has a blob URL stored, set as loadedFile for editing
            if (template.content && (template.content.startsWith('blob:') || template.content.startsWith('http'))) {
                this.loadedFile = { file: null, type: 'svg', blobUrl: template.content, name: template.contentName || '' };
                if (this.loadedFile.name) document.getElementById('loadedFileName').textContent = `Файл ${this.loadedFile.name} загружен`;
                document.getElementById('loadedFileInfo').classList.remove('hidden');
                document.getElementById('fileUploadArea').classList.add('hidden');
            }
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

    async openViewModal(templateId) {
        const template = AppState.templates.find(t => t.id === templateId);
        if (!template) return;
        const container = document.getElementById('fullPreviewContainer');

        if (template.type === 'svg') {
            // For PDF templates, use PDF.js viewer for blob URLs
            try {
                console.log('🌄 Opening SVG template for preview:', templateId);
                document.getElementById('previewModal').classList.remove('hidden');

                // If template.content is inline SVG markup, insert it directly.
                if (template.content && template.content.trim().startsWith('<svg')) {
                    container.innerHTML = template.content;
                    return;
                }

                // If it's a blob URL or HTTP URL, embed it using <object> or <img>
                if (template.content && (template.content.startsWith('blob:') || template.content.startsWith('http'))) {
                    container.innerHTML = `<div style="text-align:center;padding:20px;"><object data="${template.content}" type="image/svg+xml" style="max-width:100%;height:auto;">Ваш браузер не поддерживает просмотр SVG.</object></div>`;
                    return;
                }

                container.innerHTML = '<div class="preview-placeholder">Невозможно отобразить SVG шаблон</div>';
            } catch (error) {
                console.error('❌ Error displaying PDF:', error);
                container.innerHTML = '<div class="preview-placeholder">Ошибка при загрузке PDF: ' + error.message + '</div>';
                document.getElementById('previewModal').classList.remove('hidden');
            }
        } else if (template.type === 'html') {
            // HTML template: render in iframe in modal
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.srcdoc = template.content || '';
            container.innerHTML = '';
            container.appendChild(iframe);
            document.getElementById('previewModal').classList.remove('hidden');
        } else {
            // Unknown type
            container.innerHTML = '<div class="preview-placeholder">Неизвестный тип шаблона</div>';
            document.getElementById('previewModal').classList.remove('hidden');
        }
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
            preview.innerHTML = `<div class="preview-placeholder">ТУТ БУДЕТ ВАШ ШАБЛОН СЕРТИФИКАТА</div>`;
        }
    }

    openModal() {
        try {
            console.log('🔓 openModal() - opening modal');
            const modal = document.getElementById('templateModal');
            if (!modal) {
                console.error('❌ templateModal element not found!');
                return;
            }
            console.log('  - modal found, current classes:', modal.className);
            modal.classList.remove('hidden');
            modal.classList.add('active');
            console.log('  - classes updated:', modal.className);
        } catch (error) {
            console.error('❌ Error in openModal():', error);
        }
    }

    closeModal() {
        try {
            const modal = document.getElementById('templateModal');
            if (modal) {
                modal.classList.remove('active');
                modal.classList.add('hidden');
            }
            this.editingId = null;
            this.loadedFile = null;
            this.isCreating = false;
        } catch (error) {
            console.error('❌ Error in closeModal():', error);
        }
    }

    closePreviewModal() {
        try {
            const modal = document.getElementById('previewModal');
            if (modal) modal.classList.add('hidden');
        } catch (error) {
            console.error('❌ Error in closePreviewModal():', error);
        }
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

        const type = file.name.toLowerCase().endsWith('.svg') ? 'svg' : 'html';
        document.getElementById('templateTypeDisplay').textContent = type.toUpperCase();
        const blobUrl = URL.createObjectURL(file);
        this.loadedFile = { file, type, blobUrl };

        if (type === 'svg') {
            // For SVG we will read it as text into the code editor for preview/editing
            const reader = new FileReader();
            reader.onload = (evt) => {
                document.getElementById('templateContent').value = evt.target.result;
                document.getElementById('codeEditorSection').classList.remove('hidden');
                this.updateCodePreview();
            };
            reader.readAsText(file);
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

        if (type === 'svg' && !this.loadedFile && !content) {
            alert('Пожалуйста, загрузите SVG файл или вставьте SVG код');
            return;
        }

        const template = {
            name,
            description: desc,
            content: null,
            contentName: null,
            type,
            isDefault: false,
            isStandard: false
        };

        if (type === 'html') {
            template.content = content;
        } else if (type === 'svg' && this.loadedFile) {
            // store inline SVG content if possible (read file as text already done on load)
            if (document.getElementById('templateContent').value.trim()) {
                template.content = document.getElementById('templateContent').value;
            } else {
                // fallback to blob URL
                template.content = this.loadedFile.blobUrl || (this.loadedFile.file ? URL.createObjectURL(this.loadedFile.file) : null);
            }
            template.contentName = this.loadedFile.file ? this.loadedFile.file.name : null;
        }

        if (this.editingId) {
            // Revoke previous blob URL if exists before replacing
            const prev = AppState.templates.find(t => t.id === this.editingId);
            if (prev && prev.content && prev.content.startsWith && prev.content.startsWith('blob:') && prev.content !== template.content) {
                try { URL.revokeObjectURL(prev.content); } catch (e) {}
            }
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
        // Revoke blob URL if present
        const tpl = AppState.templates.find(t => t.id === templateId);
        if (tpl && tpl.content && tpl.content.startsWith && tpl.content.startsWith('blob:')) {
            try { URL.revokeObjectURL(tpl.content); } catch (e) {}
        }

        AppState.deleteTemplate(templateId);
        this.renderTemplates();
    }
}