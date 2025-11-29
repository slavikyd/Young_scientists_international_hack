class UIManager {
    constructor() {
        this.currentPage = 'upload';
        try {
            this.init();
        } catch (error) {
            console.error('❌ Error in UIManager.init():', error);
            console.error('Stack:', error.stack);
        }
    }

    init() {
        this.setupPageNavigation();
        this.setupLanguageSelector();
        this.disableAllNextSteps();
        this.setupGenerateNavigation();
    }

    setupGenerateNavigation() {
        const prevBtn = document.getElementById('prevRecipientBtn');
        const nextBtn = document.getElementById('nextRecipientBtn');

        if (prevBtn) prevBtn.addEventListener('click', () => {
            const total = AppState.participants.length;
            if (total === 0) return;
            const current = AppState.previewIndex || 1;
            const prev = Math.max(1, current - 1);
            if (typeof AppState.setPreviewIndex === 'function') AppState.setPreviewIndex(prev); else AppState.previewIndex = prev;
            this.updateGeneratePreview();
        });

        if (nextBtn) nextBtn.addEventListener('click', () => {
            const total = AppState.participants.length;
            if (total === 0) return;
            const current = AppState.previewIndex || 1;
            const next = Math.min(total, current + 1);
            if (typeof AppState.setPreviewIndex === 'function') AppState.setPreviewIndex(next); else AppState.previewIndex = next;
            this.updateGeneratePreview();
        });
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

        // Setup "Next" buttons
        const nextFromUploadBtn = document.getElementById('nextFromUpload');
        if (nextFromUploadBtn) {
            nextFromUploadBtn.addEventListener('click', () => {
                if (AppState.uploadedFile && AppState.participants.length > 0) {
                    this.goToPage('templates');
                } else {
                    alert('Пожалуйста, загрузите файл с участниками');
                }
            });
        }

        const nextFromTemplatesBtn = document.getElementById('nextFromTemplates');
        if (nextFromTemplatesBtn) {
            nextFromTemplatesBtn.addEventListener('click', () => {
                if (AppState.selectedTemplate) {
                    this.goToPage('generate');
                } else {
                    alert('Пожалуйста, выберите шаблон');
                }
            });
        }
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
            const nextBtn = document.getElementById('nextFromUpload');
            if (nextBtn) nextBtn.removeAttribute('disabled');
        } else if (stepName === 'generate') {
            document.querySelector('[data-step="generate"]').classList.remove('disabled');
            const nextBtn2 = document.getElementById('nextFromTemplates');
            if (nextBtn2) nextBtn2.removeAttribute('disabled');
        }
    }

    disableNextSteps(stepName) {
        if (stepName === 'templates') {
            document.querySelector('[data-step="templates"]').classList.add('disabled');
            document.querySelector('[data-step="generate"]').classList.add('disabled');
            const nextBtn = document.getElementById('nextFromUpload');
            if (nextBtn) nextBtn.setAttribute('disabled', '');
            const nextBtn2 = document.getElementById('nextFromTemplates');
            if (nextBtn2) nextBtn2.setAttribute('disabled', '');
        } else if (stepName === 'templates-select') {
            document.querySelector('[data-step="generate"]').classList.add('disabled');
            const nextBtn2 = document.getElementById('nextFromTemplates');
            if (nextBtn2) nextBtn2.setAttribute('disabled', '');
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
        const current = (AppState.previewIndex && AppState.previewIndex > 0) ? AppState.previewIndex : 1;
        this.updateTextContent('previewCertCount', `${current} / ${certCount}`);
        if (selectedTemplate) {
            const templateName = `${selectedTemplate.isDefault ? 'Стандартный' : ''} шаблон ${selectedTemplate.type.toUpperCase()} ${selectedTemplate.type === 'html' ? '</>' : (selectedTemplate.type === 'svg' ? '🖼️' : '📄')}`;
            this.updateTextContent('previewTemplateName', templateName);
        }

        // Render participant preview (HTML template or PDF placeholder)
        this.renderParticipantPreview();

        const emailToggle = document.getElementById('sendEmailToggle');
        const recipientsItem = document.getElementById('recipientsCountItem');
        
        if (emailToggle && emailToggle.checked) {
            this.showElement('recipientsCountItem');
        } else {
            this.hideElement('recipientsCountItem');
        }
    }

    renderParticipantPreview() {
        const template = AppState.getSelectedTemplate();
        const total = AppState.participants.length;
        const currentIndex = (AppState.previewIndex && AppState.previewIndex > 0) ? AppState.previewIndex : 1;
        const participant = AppState.participants[currentIndex - 1];

        const pdfContainer = document.getElementById('pdfViewerContainer');
        const pdfViewerDiv = document.getElementById('pdfViewer');
        const htmlPreview = document.getElementById('certificateHtmlPreview');
        const pdfCanvas = document.getElementById('pdfCanvas');

        // Hide both preview areas first
        if (htmlPreview) htmlPreview.classList.add('hidden');
        if (pdfViewerDiv) pdfViewerDiv.classList.add('hidden');
        if (pdfContainer) pdfContainer.classList.remove('hidden'); // keep container visible for controls

        if (!template) {
            // No template selected: show placeholder
            if (htmlPreview) {
                htmlPreview.innerHTML = '<div class="preview-placeholder">Пожалуйста, выберите шаблон</div>';
                htmlPreview.classList.remove('hidden');
            }
            return;
        }

        if (template.type === 'html') {
            // Render HTML template with placeholders replaced by participant values
            const content = template.content || '';
            let rendered = content;
            if (participant) {
                // Replace common placeholder keys
                const map = {};
                // map russian headers
                Object.keys(participant).forEach(k => map[k.toLowerCase()] = participant[k]);
                // common english aliases
                map['participant_name'] = participant['фио'] || participant['name'] || participant['fio'] || '';
                map['email'] = participant['почта'] || participant['email'] || '';
                map['role'] = participant['роль'] || participant['role'] || '';
                map['place'] = participant['место'] || participant['place'] || '';

                // Replace {{key}} occurrences
                rendered = rendered.replace(/{{\s*([^}]+)\s*}}/g, (m, key) => {
                    const lk = key.toLowerCase();
                    return (map[lk] !== undefined) ? map[lk] : '';
                });
            }

            // Inject into iframe inside htmlPreview
            if (htmlPreview) {
                const iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '500px';
                iframe.style.border = 'none';
                iframe.srcdoc = rendered;
                htmlPreview.innerHTML = '';
                htmlPreview.appendChild(iframe);
                htmlPreview.classList.remove('hidden');
                if (pdfViewerDiv) pdfViewerDiv.classList.add('hidden');
            }
        } else if (template.type === 'svg') {
            // For PDF templates we try to open the PDF if available (not always possible in current mock setup)
            // If template.content contains a filename and templatesManager has the file stored, try to show it via pdfViewer
            if (window.pdfViewer && template.content) {
                // Try to resolve a Blob URL via templatesManager.loadedFile if available
                // Best-effort: search templates list for a matching uploaded file name
                const t = AppState.templates.find(tpl => tpl.id === AppState.selectedTemplate);
                    if (t && t.content && (t.content.endsWith('.pdf') || t.content.trim().startsWith('<svg') || t.content.endsWith('.svg'))) {
                    // If content looks like a URL, try to load it in PDF viewer
                        // If URL or blob: show in object tag for SVG or via PDF viewer for PDF
                        if (t.content.startsWith('http') || t.content.startsWith('blob:')) {
                            if (t.content.endsWith('.pdf')) {
                                window.pdfViewer.showPDF(t.content);
                                if (pdfViewerDiv) pdfViewerDiv.classList.remove('hidden');
                                if (htmlPreview) htmlPreview.classList.add('hidden');
                            } else {
                                // SVG URL/blob
                                htmlPreview.innerHTML = `<div style="text-align:center;padding:20px;"><object data="${t.content}" type="image/svg+xml" style="max-width:100%;height:auto;">Ваш браузер не поддерживает просмотр SVG.</object></div>`;
                                htmlPreview.classList.remove('hidden');
                                if (pdfViewerDiv) pdfViewerDiv.classList.add('hidden');
                            }
                        } else if (t.content.trim().startsWith('<svg')) {
                            htmlPreview.innerHTML = t.content;
                            htmlPreview.classList.remove('hidden');
                            if (pdfViewerDiv) pdfViewerDiv.classList.add('hidden');
                        } else {
                            if (htmlPreview) {
                                htmlPreview.innerHTML = '<div class="preview-placeholder">Предпросмотр SVG недоступен.</div>';
                                htmlPreview.classList.remove('hidden');
                                if (pdfViewerDiv) pdfViewerDiv.classList.add('hidden');
                            }
                        }
                } else {
                    if (htmlPreview) {
                        htmlPreview.innerHTML = '<div class="preview-placeholder">PDF/SGV предпросмотр недоступен.</div>';
                        htmlPreview.classList.remove('hidden');
                        if (pdfViewerDiv) pdfViewerDiv.classList.add('hidden');
                    }
                }
            }
        }
    }
}