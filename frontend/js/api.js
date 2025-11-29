const API_BASE_URL = '/api/v1';

class CertificateAPI {
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

    // Templates endpoints - FIXED
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
        // Backend returns array directly
        return fetch(`${API_BASE_URL}/templates`)
            .then(res => this.handleResponse(res))
            .then(data => Array.isArray(data) ? data : []);
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
    async generateCertificates(templateId, eventName, eventLocation, issueDate, sendEmail = false) {
        return fetch(`${API_BASE_URL}/certificates/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                template_id: templateId,
                event_name: eventName,
                event_location: eventLocation,
                issue_date: issueDate,
                send_email: sendEmail
            }),
        }).then(res => this.handleResponse(res));
    }

    async previewCertificate(participantId) {
        return fetch(`${API_BASE_URL}/certificates/${participantId}/preview`)
            .then(res => this.handleResponse(res));
    }

    async downloadCertificates() {
        try {
            const response = await fetch(`${API_BASE_URL}/certificates/download`);
            
            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificates_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log('Certificates downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }

    async handleResponse(response) {
        if (!response.ok) {
            try {
                const error = await response.json();
                throw new Error(error.detail || error.message || `HTTP ${response.status}`);
            } catch (e) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        
        if (response.status === 204) {
            return { success: true };
        }
        
        return response.json();
    }
}

const api = new CertificateAPI();