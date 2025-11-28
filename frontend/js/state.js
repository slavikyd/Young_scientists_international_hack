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
    
    addTemplate(template) {
        template.id = Date.now().toString();
        this.templates.push(template);
        return template;
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
    
    reset() {
        this.uploadedFile = null;
        this.participants = [];
        this.rolesUsed = [];
        this.placesUsed = [];
        this.selectedTemplate = null;
        this.emailsEnabled = true;
        this.recipientCount = 90;
    }
};

window.AppState = AppState;