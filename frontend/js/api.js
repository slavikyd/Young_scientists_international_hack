// API Configuration - FIXED FOR NGINX PROXY
// Frontend runs on 8001, nginx proxies /api/* to backend on 8000
const API_BASE_URL = '/api/v1';  // ✅ Relative URL - nginx handles routing

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

    async deleteParticipant(id) {
        return fetch(`${API_BASE_URL}/participants/${id}`, {
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

    async getTemplate(id) {
        return fetch(`${API_BASE_URL}/templates/${id}`)
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
    async generateCertificates(templateId, sendEmail = false) {
        return fetch(`${API_BASE_URL}/certificates/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                template_id: templateId,
                send_email: sendEmail
            }),
        }).then(res => this.handleResponse(res));
    }

    async previewCertificate(participantId) {
        return fetch(`${API_BASE_URL}/certificates/${participantId}/preview`)
            .then(res => this.handleResponse(res));
    }

    async downloadCertificates() {
        // Download from /downloads/certificates.zip endpoint
        try {
            const response = await fetch('/downloads/certificates.zip');
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'certificates.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }

    // Helper method for error handling
    async handleResponse(response) {
        if (!response.ok) {
            try {
                const error = await response.json();
                throw new Error(error.detail || error.message || `HTTP ${response.status}`);
            } catch (e) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        
        // Handle empty responses (204 No Content)
        if (response.status === 204) {
            return { success: true };
        }
        
        return response.json();
    }
}

// Global API instance
const api = new CertificateAPI();