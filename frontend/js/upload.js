class UploadManager {
    constructor() {
        this.uploadedFile = null;
        try {
            this.init();
        } catch (error) {
            console.error('❌ Error in UploadManager.init():', error);
            console.error('Stack:', error.stack);
        }
    }

    init() {
        console.log('📍 UploadManager.init() called');
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const clearBtn = document.getElementById('clearUploadBtn');

        console.log('  - uploadArea:', !!uploadArea);
        console.log('  - fileInput:', !!fileInput);
        console.log('  - clearBtn:', !!clearBtn);

        uploadArea.addEventListener('dragover', (e) => {
            if (this.uploadedFile) return;
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            if (this.uploadedFile) return;
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        uploadArea.addEventListener('click', () => {
            if (!this.uploadedFile) fileInput.click();
        });

        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        clearBtn.addEventListener('click', () => this.clearUpload());

        // Download example files
        const downloadXlsxBtn = document.getElementById('downloadXlsx');
        const downloadCsvBtn = document.getElementById('downloadCsv');
        console.log('  - downloadXlsxBtn:', !!downloadXlsxBtn);
        console.log('  - downloadCsvBtn:', !!downloadCsvBtn);
        
        if (downloadXlsxBtn) {
            downloadXlsxBtn.addEventListener('click', () => {
                console.log('🖱️ Download XLSX clicked');
                this.downloadExample('xlsx');
            });
        }
        if (downloadCsvBtn) {
            downloadCsvBtn.addEventListener('click', () => {
                console.log('🖱️ Download CSV clicked');
                this.downloadExample('csv');
            });
        }

        this.updateUploadAreaState();
    }

    downloadExample(format) {
        const csvData = `ФИО,Почта,Роль,Место
Пупкин Василий Жёнович,vasiliy@pupka.net,Победитель,1
Любопыткина Варвара Безносая,varvara@nosa.net,Участник,
Иванов Петр Сергеевич,peter@ivan.ru,Победитель,2
Сидорова Мария Ивановна,maria@sidorova.ru,Участник,
Смирнов Иван Николаевич,ivan@smirnov.org,Участник,3
Козлова Елена Петровна,elena@kozlova.net,Участник,`;

        if (format === 'xlsx') {
            // Create proper Excel file using XLSX library
            if (typeof XLSX === 'undefined') {
                alert('XLSX библиотека ещё загружается. Пожалуйста, попробуйте снова через 1-2 секунды.');
                return;
            }
            try {
                const lines = csvData.split('\n');
                const data = lines.map(line => 
                    line.split(',').map(cell => cell.trim())
                );
                const ws = XLSX.utils.aoa_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Participants");
                XLSX.writeFile(wb, `example_participants.xlsx`);
            } catch (error) {
                alert(`Ошибка при создании Excel файла: ${error.message}`);
                console.error('XLSX error:', error);
            }
        } else {
            // CSV download with UTF-8 BOM for proper encoding in Excel
            const BOM = '\uFEFF'; // UTF-8 BOM
            const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `example_participants.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    }

    updateUploadAreaState() {
        const uploadArea = document.getElementById('uploadArea');
        if (this.uploadedFile) {
            uploadArea.style.opacity = '0.5';
            uploadArea.style.cursor = 'not-allowed';
            uploadArea.style.pointerEvents = 'none';
        } else {
            uploadArea.style.opacity = '1';
            uploadArea.style.cursor = 'pointer';
            uploadArea.style.pointerEvents = 'auto';
        }
    }

    async handleFileUpload(files) {
        if (files.length === 0 || this.uploadedFile) return;

        const file = files[0];
        const isValid = file.name.endsWith('.csv') || file.name.endsWith('.xlsx');

        if (!isValid) {
            ui.showStatus('uploadStatus', 'Пожалуйста, загрузите CSV или XLSX файл', 'error');
            return;
        }

        try {
            let participants = [];
            
            // Parse file locally
            if (file.name.endsWith('.xlsx')) {
                // Parse XLSX with XLSX library
                if (typeof XLSX === 'undefined') {
                    throw new Error('XLSX библиотека ещё не загружена');
                }
                
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(worksheet);
                
                // Convert data to expected format
                participants = data.map(row => {
                    const participant = {};
                    Object.keys(row).forEach(key => {
                        const lowerKey = key.toLowerCase().trim();
                        participant[lowerKey] = String(row[key] || '').trim();
                    });
                    return participant;
                });
                
                console.log('📊 XLSX parsed, participants:', participants.length);
            } else {
                // Parse CSV
                const text = await file.text();
                participants = api.parseCSV(text);
                console.log('📊 CSV parsed, participants:', participants.length);
            }
            
            if (participants.length === 0) {
                throw new Error('Файл не содержит участников');
            }
            
            // Update AppState with parsed data
            const analysis = api.analyzeParticipants(participants);
            AppState.setUploadedFile(file);
            AppState.setParticipants(participants);
            AppState.setRolesUsed(analysis.roles);
            AppState.setPlacesUsed(analysis.places);
            
            // Also try to upload to backend if available
            try {
                await api.uploadParticipants(file);
            } catch (e) {
                console.warn('⚠️ Backend upload failed, using local parsing:', e.message);
            }
            
            this.uploadedFile = file;
            ui.showStatus('uploadStatus', `✓ Успешно загружено ${participants.length} участников!`, 'success');
            
            ui.hideElement('fileFormatInfo');
            
            ui.updateFilePreview(
                participants,
                file.name,
                AppState.rolesUsed,
                AppState.placesUsed
            );
            // Reset preview index to first participant so UI shows 1 / total
            if (typeof AppState.setPreviewIndex === 'function') {
                AppState.setPreviewIndex(1);
            } else {
                AppState.previewIndex = 1;
            }
            
            document.getElementById('clearUploadBtn').classList.remove('hidden');
            this.updateUploadAreaState();
            
            ui.enableNextSteps('templates');
            
        } catch (error) {
            ui.showStatus('uploadStatus', `Ошибка: ${error.message}`, 'error');
            console.error('❌ File upload error:', error);
        }
    }

    clearUpload() {
        if (!confirm('Вы уверены? Это удалит все загруженные данные.')) return;

        this.uploadedFile = null;
        AppState.setUploadedFile(null);
        AppState.setParticipants([]);
        AppState.setRolesUsed([]);
        AppState.setPlacesUsed([]);

        ui.hideElement('filePreviewSection');
        ui.hideElement('uploadStatus');
        ui.showElement('fileFormatInfo');
        document.getElementById('clearUploadBtn').classList.add('hidden');
        document.getElementById('fileInput').value = '';
        
        this.updateUploadAreaState();
        ui.disableNextSteps('templates');
    }
}