// Ensured initialization order: state → ui → managers
function initializeApp() {
    console.log('🚀 Certificate Generator GlobalCertHub initializing...');
    
    try {
        // Ensure state is ready
        if (!window.AppState) {
            console.error('❌ AppState not found');
            return;
        }
        console.log('✓ AppState ready');

        // Initialize UI manager first (sets up navigation, pages, etc.)
        if (!window.ui) {
            console.log('📍 Initializing UIManager...');
            window.ui = new UIManager();
            console.log('✓ UIManager initialized');
        }

        // Then initialize other managers
        if (!window.uploadManager) {
            console.log('📍 Initializing UploadManager...');
            window.uploadManager = new UploadManager();
            console.log('✓ UploadManager initialized');
        }

        if (!window.templatesManager) {
            console.log('📍 Initializing TemplatesManager...');
            window.templatesManager = new TemplatesManager();
            console.log('✓ TemplatesManager initialized');
        }

        if (!window.generateManager) {
            console.log('📍 Initializing GenerateManager...');
            window.generateManager = new GenerateManager();
            console.log('✓ GenerateManager initialized');
        }

        // Initialize PDF viewer if available
        if (!window.pdfViewer) {
            if (typeof PDFViewer !== 'undefined') {
                console.log('📍 Initializing PDFViewer...');
                try {
                    window.pdfViewer = new PDFViewer();
                    console.log('✓ PDFViewer initialized');
                } catch (error) {
                    console.error('❌ Error initializing PDFViewer:', error);
                }
            } else {
                console.warn('⚠️  PDFViewer class not found');
            }
        }

        console.log('✅ All managers initialized successfully');
    } catch (error) {
        console.error('❌ Error during app initialization:', error);
        console.error('Stack:', error.stack);
    }
}

// Wait for DOM to be ready, then initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // If DOM is already loaded (rare but possible)
    initializeApp();
}