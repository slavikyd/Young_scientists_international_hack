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

    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const participants = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.some(v => v)) {
                const participant = {};
                headers.forEach((header, idx) => {
                    participant[header] = values[idx] || '';
                });
                participants.push(participant);
            }
        }

        return participants;
    }

    analyzeParticipants(participants) {
        const roles = new Set();
        const places = new Set();

        participants.forEach(p => {
            if (p.роль) roles.add(p.роль);
            if (p.место) places.add(p.место);
        });

        return {
            roles: Array.from(roles),
            places: Array.from(places).sort()
        };
    }

    async generateCertificates(params) {
        return fetch(`${API_BASE_URL}/certificates/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        }).then(res => this.handleResponse(res));
    }

    async uploadTemplate(params) {
        return fetch(`${API_BASE_URL}/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        }).then(res => this.handleResponse(res));
    }

    async handleResponse(response) {
        if (!response.ok) {
            try {
                const error = await response.json();
                throw new Error(error.message || `HTTP Error: ${response.status}`);
            } catch (e) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
        }
        return response.json();
    }
}

const api = new CertificateAPI();
window.api = api;
