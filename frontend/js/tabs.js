// Tab switching functionality
class TabManager {
    constructor() {
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.init();
    }

    init() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button));
        });
    }

    switchTab(button) {
        const tabName = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and contents
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new TabManager();
});
