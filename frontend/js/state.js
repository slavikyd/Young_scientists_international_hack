const AppState = {
    // Upload data
    uploadedFile: null,
    participants: [],
    rolesUsed: [],
    placesUsed: [],
    
    // Template data
    templates: [],
    selectedTemplate: null,
    
    // Generate data
    emailsEnabled: true,
    recipientCount: 90,
    previewIndex: 1,
    eventName: '',
    eventLocation: '',
    issueDate: new Date().toISOString().split('T')[0],
    
    // setters
    setUploadedFile(file) {
        this.uploadedFile = file;
    },
    
    setParticipants(data) {
        this.participants = data;
    },
    
    setRolesUsed(roles) {
        this.rolesUsed = roles;
    },
    
    setPlacesUsed(places) {
        this.placesUsed = places;
    },
    
    async addTemplate(template) {
    try {
        console.log('📡 Saving template to backend...', template);
        
        // POST to backend
        const response = await fetch('/api/v1/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: template.name,
                content: template.content,
                template_type: template.type
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const savedTemplate = await response.json();
        console.log('✅ Template saved to backend:', savedTemplate);
        
        // Add to frontend too
        this.templates.push(savedTemplate);
        
    } catch (error) {
        console.error('❌ Error saving template:', error);
        throw error;
    }
},
    
    updateTemplate(id, template) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index !== -1) {
            this.templates[index] = { ...this.templates[index], ...template };
        }
    },
    
    deleteTemplate(id) {
        this.templates = this.templates.filter(t => t.id !== id);
    },
    
    selectTemplate(id) {
        this.selectedTemplate = id;
    },
    
    getSelectedTemplate() {
        return this.templates.find(t => t.id === this.selectedTemplate);
    },
    
    setEmailsEnabled(enabled) {
        this.emailsEnabled = enabled;
    },
    
    setRecipientCount(count) {
        this.recipientCount = count;
    },

    setEventName(name) {
        this.eventName = name;
    },

    setEventLocation(location) {
        this.eventLocation = location;
    },

    setIssueDate(date) {
        this.issueDate = date;
    },

    setPreviewIndex(index) {
        this.previewIndex = index;
    },
    
    reset() {
        this.uploadedFile = null;
        this.participants = [];
        this.rolesUsed = [];
        this.placesUsed = [];
        this.selectedTemplate = null;
        this.emailsEnabled = true;
        this.recipientCount = 90;
        this.eventName = '';
        this.eventLocation = '';
        this.issueDate = new Date().toISOString().split('T')[0];
    }
};

window.AppState = AppState;