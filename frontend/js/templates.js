// Templates management
class TemplateManager {
    constructor() {
        this.templates = [];
        this.modal = document.getElementById('templateModal');
        this.templatesContainer = document.getElementById('templatesContainer');
        this.templatesList = document.getElementById('templatesList');
        this.templatesBadge = document.getElementById('templatesBadge');
        this.init();
    }

    init() {
        document.getElementById('addTemplateBtn').addEventListener('click', () => this.openModal());
        document.getElementById('htmlTemplateBtn').addEventListener('click', () => this.addDefaultTemplate('html'));
        document.getElementById('svgTemplateBtn').addEventListener('click', () => this.addDefaultTemplate('svg'));
        document.getElementById('saveTemplateBtn').addEventListener('click', () => this.saveTemplate());
        document.getElementById('cancelTemplateBtn').addEventListener('click', () => this.closeModal());
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());

        this.loadTemplates();
    }

    async loadTemplates() {
        try {
            const response = await api.getTemplates();
            this.templates = response || [];  // ← CHANGE FROM: response.templates || []
            this.render();
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    openModal(template = null) {
        const templateNameInput = document.getElementById('templateName');
        const templateTypeSelect = document.getElementById('templateType');
        const templateContentInput = document.getElementById('templateContent');

        if (template) {
            templateNameInput.value = template.name;
            templateTypeSelect.value = template.type;
            templateContentInput.value = template.content;
            this.editingTemplateId = template.id;
        } else {
            templateNameInput.value = '';
            templateTypeSelect.value = 'html';
            templateContentInput.value = '';
            this.editingTemplateId = null;
        }

        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.editingTemplateId = null;
    }

    async saveTemplate() {
        const name = document.getElementById('templateName').value;
        const type = document.getElementById('templateType').value;
        const content = document.getElementById('templateContent').value;

        if (!name || !content) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const templateData = { name, type, content };

            if (this.editingTemplateId) {
                await api.updateTemplate(this.editingTemplateId, templateData);
            } else {
                await api.createTemplate(templateData);
            }

            await this.loadTemplates();
            this.closeModal();
        } catch (error) {
            alert(`Error saving template: ${error.message}`);
            console.error('Error:', error);
        }
    }

    async addDefaultTemplate(type) {
        const templates = {
            html: {
                name: 'Default HTML Certificate',
                type: 'html',
                content: `<div style="border: 3px solid #208089; padding: 40px; text-align: center; font-family: Arial;">
  <h1>Certificate of Achievement</h1>
  <p>This is to certify that</p>
  <h2>{{participant_name}}</h2>
  <p>has successfully completed the program</p>
  <p><strong>Role:</strong> {{role}}</p>
  {{#if place}}<p><strong>Place:</strong> {{place}}</p>{{/if}}
  <p>Date: {{date}}</p>
</div>`
            },
            svg: {
                name: 'Default SVG Certificate',
                type: 'svg',
                content: `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="white" stroke="#208089" stroke-width="3"/>
  <text x="400" y="100" font-size="48" font-weight="bold" text-anchor="middle">Certificate</text>
  <text x="400" y="200" font-size="32" text-anchor="middle">{{participant_name}}</text>
  <text x="400" y="300" font-size="20" text-anchor="middle">Role: {{role}}</text>
  {{#if place}}<text x="400" y="350" font-size="20" text-anchor="middle">Place: {{place}}</text>{{/if}}
  <line x1="100" y1="500" x2="700" y2="500" stroke="#208089" stroke-width="2"/>
</svg>`
            }
        };

        try {
            const template = templates[type];
            await api.createTemplate(template);
            await this.loadTemplates();
        } catch (error) {
            alert(`Error adding template: ${error.message}`);
        }
    }

    async deleteTemplate(id) {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            await api.deleteTemplate(id);
            await this.loadTemplates();
        } catch (error) {
            alert(`Error deleting template: ${error.message}`);
        }
    }

    render() {
        this.templatesBadge.textContent = this.templates.length;

        if (this.templates.length === 0) {
            this.templatesContainer.classList.remove('hidden');
            this.templatesList.innerHTML = '';
        } else {
            this.templatesContainer.classList.add('hidden');
            this.templatesList.innerHTML = this.templates.map(template => `
                <div class="template-card">
                    <div class="template-card-header">
                        <span class="template-card-name">${template.name}</span>
                        <span class="template-card-type">${template.type.toUpperCase()}</span>
                    </div>
                    <div class="template-card-actions">
                        <button class="btn btn-secondary btn-sm" onclick="window.templateManager.openModal(${JSON.stringify(template).replace(/"/g, '&quot;')})">
                            Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="window.templateManager.deleteTemplate('${template.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.templateManager = new TemplateManager();
});
