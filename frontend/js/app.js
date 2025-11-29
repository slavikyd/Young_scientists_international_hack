// Main app initialization
class CertificateGeneratorApp {
    constructor() {
        this.appState = {
            participantsUploaded: false,
            participantsCount: 0,
            templatesCount: 0,
        };
        this.init();
    }

    init() {
        // Listen for participants upload event
        document.addEventListener('participantsUploaded', (e) => {
            this.appState.participantsUploaded = true;
            this.appState.participantsCount = e.detail.count;
            this.updateGenerateTab();
        });

        // Update templates count
        const checkTemplates = setInterval(() => {
            if (window.templateManager) {
                this.appState.templatesCount = window.templateManager.templates.length;
                this.updateGenerateTab();
                clearInterval(checkTemplates);
            }
        }, 100);
    }

    updateGenerateTab() {
        const generateContent = document.getElementById('generateContent');
        const canGenerate = this.appState.participantsUploaded && this.appState.templatesCount > 0;

        if (canGenerate) {
            generateContent.classList.remove('generate-disabled');
            generateContent.innerHTML = `
                <div class="generate-content" style="opacity: 1; cursor: auto; pointer-events: auto;">
                    <p><strong>${this.appState.participantsCount}</strong> participants loaded</p>
                    <p><strong>${this.appState.templatesCount}</strong> template(s) available</p>
                    <button class="btn btn-primary" onclick="window.app.generateCertificates()">
                        Generate Certificates
                    </button>
                </div>
            `;
        } else {
            generateContent.classList.add('generate-disabled');
            generateContent.innerHTML = `
                <div class="generate-content">
                    <p>Upload participants and create templates to generate certificates</p>
                </div>
            `;
        }
    }

     async generateCertificates() {
        try {
            // ✅ Get list of saved templates for user to pick
            const templates = window.templateManager?.templates || [];
            
            if (templates.length === 0) {
                alert('Please create a template first');
                return;
            }
            
            // If multiple templates, let user choose
            let selectedTemplate;
            if (templates.length === 1) {
                selectedTemplate = templates[0];
            } else {
                // Create simple selector
                const templateNames = templates.map(t => t.name).join('\n');
                const choice = prompt(`Choose a template:\n${templateNames}`, templates[0].name);
                if (!choice) return;
                
                selectedTemplate = templates.find(t => t.name === choice);
                if (!selectedTemplate) {
                    alert('Template not found');
                    return;
                }
            }
            
            const templateId = selectedTemplate.id;
            
            // Get event details
            const eventName = prompt('Enter event name:', 'Certificate Event') || 'Certificate Event';
            const eventLocation = prompt('Enter event location:', 'Online') || 'Online';
            const issueDate = new Date().toISOString().split('T')[0];

            console.log(`Generating certificates with template: ${selectedTemplate.name}`);
            const response = await api.generateCertificates(
                templateId,
                eventName,
                eventLocation,
                issueDate
            );

            alert(`Generated ${response.count} certificates! Starting download...`);
            
            // Auto-download the ZIP file
            setTimeout(() => {
                api.downloadCertificates().catch(err => {
                    alert(`Download error: ${err.message}`);
                });
            }, 500);
            
        } catch (error) {
            alert(`Error generating certificates: ${error.message}`);
            console.error(error);
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CertificateGeneratorApp();
});
