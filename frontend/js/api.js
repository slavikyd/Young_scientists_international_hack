// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

class CertificateAPI {
    // Participants endpoints
    async uploadParticipants(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return fetch(`${API_BASE_URL}/participants/upload`, {
            method: 'POST',
            body: formData,
        }).then(res => this.handleResponse(res));
    }

    async getParticipants() {
        return fetch(`${API_BASE_URL}/participants`)
            .then(res => this.handleResponse(res));
    }

    async deleteParticipants() {
        return fetch(`${API_BASE_URL}/participants`, {
            method: 'DELETE',
        }).then(res => this.handleResponse(res));
    }

    // Templates endpoints
    async createTemplate(templateData) {
        return fetch(`${API_BASE_URL}/templates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateData),
        }).then(res => this.handleResponse(res));
    }

    async getTemplates() {
        return fetch(`${API_BASE_URL}/templates`)
            .then(res => this.handleResponse(res));
    }

    async updateTemplate(id, templateData) {
        return fetch(`${API_BASE_URL}/templates/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateData),
        }).then(res => this.handleResponse(res));
    }

    async deleteTemplate(id) {
        return fetch(`${API_BASE_URL}/templates/${id}`, {
            method: 'DELETE',
        }).then(res => this.handleResponse(res));
    }

    // Certificates endpoints
    async generateCertificates(params) {
        return fetch(`${API_BASE_URL}/certificates/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        }).then(res => this.handleResponse(res));
    }

    async downloadCertificates(batchId) {
        return fetch(`${API_BASE_URL}/certificates/download/${batchId}`)
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificates_${batchId}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            });
    }

    // Helper method for error handling
    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'An error occurred');
        }
        return response.json();
    }
}

// Global API instance
const api = new CertificateAPI();
