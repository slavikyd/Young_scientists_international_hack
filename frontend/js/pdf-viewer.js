class PDFViewer {
    constructor() {
        this.pdfUrl = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.pdf = null;
        try {
            this.init();
        } catch (error) {
            console.error('❌ Error in PDFViewer.init():', error);
            console.error('Stack:', error.stack);
        }
    }

    init() {
        // Set up PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        }

        // Setup close button if exists
        const closeBtn = document.querySelector('.pdf-viewer-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePDF());
        }

        // Setup navigation buttons
        const prevBtn = document.getElementById('pdfPrevBtn');
        const nextBtn = document.getElementById('pdfNextBtn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());

        // Setup close button by ID
        const closePdfBtn = document.getElementById('closePdfViewer');
        if (closePdfBtn) {
            closePdfBtn.addEventListener('click', () => this.closePDF());
        }
    }

    async showPDF(url) {
        this.pdfUrl = url;
        const container = document.getElementById('pdfViewerContainer');
        if (!container) return;

        container.classList.remove('hidden');
        
        try {
            // Load PDF
            this.pdf = await pdfjsLib.getDocument(url).promise;
            this.totalPages = this.pdf.numPages;
            this.currentPage = 1;
            
            // Render first page
            await this.renderPage(1);
            
            // Update page info
            this.updatePageInfo();
        } catch (error) {
            console.error('Error loading PDF:', error);
            const viewer = document.getElementById('pdfViewer');
            if (viewer) {
                viewer.innerHTML = '<p style="padding: 20px; color: var(--color-error);">Ошибка при загрузке PDF</p>';
            }
        }
    }

    async renderPage(pageNum) {
        if (!this.pdf) return;
        
        const page = await this.pdf.getPage(pageNum);
        const canvas = document.getElementById('pdfCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        this.currentPage = pageNum;
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.renderPage(this.currentPage + 1);
            this.updatePageInfo();
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.renderPage(this.currentPage - 1);
            this.updatePageInfo();
        }
    }

    updatePageInfo() {
        const info = document.getElementById('pdfPageInfo');
        if (info) {
            info.textContent = `${this.currentPage} / ${this.totalPages}`;
        }
    }

    closePDF() {
        const container = document.getElementById('pdfViewerContainer');
        if (container) {
            container.classList.add('hidden');
        }
        this.pdf = null;
        this.currentPage = 1;
        this.totalPages = 0;
    }
}