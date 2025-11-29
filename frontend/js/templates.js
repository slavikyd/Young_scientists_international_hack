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
                <button class="menu-btn" data-template-id="${template.id}" style="position: absolute; top: 10px; right: 10px;">⋮</button>
            </div>
            `;
        }).join('');

        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateId = btn.getAttribute('data-template-id');
                this.showTemplateMenu(templateId, btn);
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
        
        if (template.type === 'pdf') {
            document.getElementById('codeEditorSection').classList.add('hidden');
            document.getElementById('fileUploadArea').classList.remove('hidden');
            document.getElementById('loadedFileInfo').classList.add('hidden');
            document.getElementById('templateInputButtons').style.display = 'none';
            // If template already has a blob URL stored, set as loadedFile for editing
            if (template.content && (template.content.startsWith('blob:') || template.content.startsWith('http'))) {
                this.loadedFile = { file: null, type: 'pdf', blobUrl: template.content, name: template.contentName || '' };
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

        if (template.type === 'pdf') {
            // For PDF templates, use PDF.js viewer for blob URLs
            try {
                console.log('📄 Opening PDF template for preview:', templateId);
                
                // Ensure PDF.js worker is configured
                if (typeof pdfjsLib !== 'undefined') {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
                    console.log('✓ PDF.js worker configured');
                } else {
                    throw new Error('PDF.js не загружен');
                }
                
                container.innerHTML = '<div class="pdf-modal-viewer"><div style="text-align: center; padding: 20px;">Загрузка PDF...</div><canvas id="pdfModalCanvas" style="display: block; margin: 0 auto; max-width: 100%; max-height: 500px;"></canvas><div id="pdfModalControls" style="padding: 10px; text-align: center; background-color: var(--color-border); display: flex; justify-content: space-between; align-items: center;"><button class="btn btn-outline" id="pdfModalPrevBtn" style="padding: 6px 12px; font-size: 12px;">← Предыдущая</button><span id="pdfModalPageInfo">1 / 1</span><button class="btn btn-outline" id="pdfModalNextBtn" style="padding: 6px 12px; font-size: 12px;">Следующая →</button></div></div>';
                
                document.getElementById('previewModal').classList.remove('hidden');
                
                console.log('📄 Template content type:', typeof template.content, 'length:', template.content?.length);
                
                // Load PDF with PDF.js
                const pdf = await pdfjsLib.getDocument(template.content).promise;
                console.log('✓ PDF loaded, total pages:', pdf.numPages);
                
                let currentPage = 1;
                const totalPages = pdf.numPages;
                
                const renderPage = async (pageNum) => {
                    try {
                        console.log('Rendering page:', pageNum);
                        const page = await pdf.getPage(pageNum);
                        const canvas = document.getElementById('pdfModalCanvas');
                        if (!canvas) {
                            console.error('❌ Canvas not found');
                            return;
                        }
                        
                        const ctx = canvas.getContext('2d');
                        const viewport = page.getViewport({ scale: 1.5 });
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        
                        await page.render({
                            canvasContext: ctx,
                            viewport: viewport
                        }).promise;
                        
                        currentPage = pageNum;
                        const pageInfo = document.getElementById('pdfModalPageInfo');
                        if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`;
                        console.log('✓ Page rendered:', pageNum);
                    } catch (error) {
                        console.error('❌ Error rendering page:', error);
                    }
                };
                
                await renderPage(1);
                
                // Setup navigation buttons
                const prevBtn = document.getElementById('pdfModalPrevBtn');
                const nextBtn = document.getElementById('pdfModalNextBtn');
                
                if (prevBtn) {
                    prevBtn.onclick = async () => {
                        if (currentPage > 1) await renderPage(currentPage - 1);
                    };
                }
                if (nextBtn) {
                    nextBtn.onclick = async () => {
                        if (currentPage < totalPages) await renderPage(currentPage + 1);
                    };
                }
                
                return;
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
            preview.innerHTML = `<div class="preview-placeholder">ТУТ БУДЕТ КАКАЯ-НИБУДЬ КРАСИВАЯ КАРТИНКА ШАБЛОНА</div><button class="preview-expand-btn" id="expandPreviewBtn" title="Развернуть">🔲</button>`;
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

        const type = file.name.endsWith('.pdf') ? 'pdf' : 'html';
        document.getElementById('templateTypeDisplay').textContent = type.toUpperCase();
        const blobUrl = URL.createObjectURL(file);
        this.loadedFile = { file, type, blobUrl };

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
            content: null,
            contentName: null,
            type,
            isDefault: false,
            isStandard: false
        };

        if (type === 'html') {
            template.content = content;
        } else if (type === 'pdf' && this.loadedFile) {
            // store blob URL for preview
            template.content = this.loadedFile.blobUrl || (this.loadedFile.file ? URL.createObjectURL(this.loadedFile.file) : null);
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