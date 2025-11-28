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
            const templateId = window.templateManager.templates[0]?.id;
            if (!templateId) {
                alert('Please create a template first');
                return;
            }

            const response = await api.generateCertificates({
                templateId: templateId,
            });

            alert(`Generated ${response.certificateCount} certificates!`);
            await api.downloadCertificates(response.batchId);
        } catch (error) {
            alert(`Error generating certificates: ${error.message}`);
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CertificateGeneratorApp();
});
