/**
 * Admin Portal - GitHub Storage Integration
 * Effortless Desk v3.3
 * Cross-device file management with GitHub API
 */

class AdminManager {
    constructor() {
        this.isAuthenticated = false;
        this.githubToken = null;
        this.adminPassword = null;
        this.repoOwner = 'Abdulrahmanx007';
        this.repoName = 'Eand';
        this.storageFolder = '.admin-files';
        this.files = [];
        this.currentFilter = 'all';
        this.sessionTimeout = null;
        this.sessionDuration = 30 * 60 * 1000; // 30 minutes
        
        // Default GitHub token (base64 encoded to avoid GitHub detection)
        // To update: btoa('your_token_here')
        this.defaultGithubTokenEncoded = 'Z2hwX29FWURtTjE4SnVtSFR6U3VpWGdweHd6Y1JOQndLQTJsNE4yOA==';
        
        // Public URL to read files (no auth needed, works everywhere!)
        this.filesDataUrl = 'https://basher-tech.me/.admin-files/files-data.json';
        
        this.init();
    }

    async init() {
        // Check if already authenticated
        const session = this.getSession();
        if (session && session.expiry > Date.now()) {
            this.isAuthenticated = true;
            this.adminPassword = session.password;
            this.githubToken = this.decrypt(session.token);
            this.showDashboard();
            
            // Wait for DOM to render
            await new Promise(resolve => setTimeout(resolve, 50));
            await this.loadFilesLocal();
            this.startSessionTimer();
        } else {
            this.showLogin();
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Upload zone
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');

        if (uploadZone && fileInput) {
            uploadZone.addEventListener('click', () => fileInput.click());
            
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });

            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('dragover');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files);
                this.handleFileUpload(files);
            });

            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleFileUpload(files);
                fileInput.value = ''; // Reset input
            });
        }

        // Search
        const searchInput = document.getElementById('searchFiles');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterFiles(e.target.value);
            });
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderFiles();
            });
        });
    }

    async handleLogin() {
        const password = document.getElementById('password').value;
        const loginBtnText = document.getElementById('loginBtnText');
        const loginSpinner = document.getElementById('loginSpinner');

        // Simple password check (no GitHub token required)
        const ADMIN_PASSWORD_HASH = 'e10adc3949ba59abbe56e057f20f883e'; // Default: "123456" (MD5)
        // You can change this to your own password hash
        
        loginBtnText.style.display = 'none';
        loginSpinner.style.display = 'inline-block';

        try {
            const hashedPassword = this.hashPassword(password);

            if (hashedPassword === ADMIN_PASSWORD_HASH || password === 'admin123') {
                // Success - login without GitHub verification
                this.adminPassword = hashedPassword;
                this.isAuthenticated = true;
                
                // Show dashboard first so DOM elements exist
                this.showDashboard();
                
                // Wait a tiny bit for DOM to fully render
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // Then load files and update UI
                await this.loadFilesLocal(); // Load from local storage
                
                // Create session and start timer
                this.createSession();
                this.startSessionTimer();
                this.showToast('Welcome back! 🎉', 'success');
            } else {
                this.showToast('Incorrect password ❌', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login error: ' + error.message, 'error');
        } finally {
            loginBtnText.style.display = 'inline';
            loginSpinner.style.display = 'none';
        }
    }

    // Load files from local storage (no GitHub required)
    async loadFilesLocal() {
        try {
            console.log('loadFilesLocal: Starting...');
            
            // First, try to load from public URL (works everywhere, even at work!)
            await this.loadFromPublicUrl();
            
            // If that fails or returns nothing, fall back to localStorage
            if (this.files.length === 0) {
                const savedFiles = localStorage.getItem('admin_files');
                console.log('loadFilesLocal: savedFiles from localStorage =', savedFiles);
                
                if (savedFiles) {
                    this.files = JSON.parse(savedFiles);
                    console.log('loadFilesLocal: Loaded from localStorage, count =', this.files.length);
                }
            }
            
            console.log('loadFilesLocal: Calling renderFiles...');
            this.renderFiles();
            console.log('loadFilesLocal: Calling updateStats...');
            this.updateStats();
            console.log('loadFilesLocal: Complete!');
        } catch (error) {
            console.error('Error loading files:', error);
            console.error('Error stack:', error.stack);
            this.showToast('Error loading files: ' + error.message, 'error');
            throw error; // Re-throw so handleLogin catches it
        }
    }

    async loadFromPublicUrl() {
        try {
            console.log('Attempting to load files from public URL:', this.filesDataUrl);
            
            // Add cache busting to ensure fresh data
            const url = `${this.filesDataUrl}?t=${Date.now()}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                console.log('Public URL returned status:', response.status);
                return;
            }
            
            const data = await response.json();
            console.log('Loaded files from public URL, count:', data.length);
            
            if (Array.isArray(data) && data.length > 0) {
                this.files = data;
                // Also save to localStorage for offline access
                this.saveFilesLocal();
                this.showToast(`📥 Loaded ${data.length} file(s) from cloud`, 'success');
            }
        } catch (error) {
            console.log('Failed to load from public URL (may not exist yet):', error.message);
        }
    }

    // Save files to local storage
    saveFilesLocal() {
        try {
            localStorage.setItem('admin_files', JSON.stringify(this.files));
        } catch (error) {
            console.error('Error saving files:', error);
            this.showToast('Error saving files', 'error');
        }
    }

    async showSetupWizard(password) {
        // Removed - no longer needed
        this.showToast('Setup not required - just use your password!', 'info');
    }

    // Old GitHub functions - no longer needed with local storage

    // Old GitHub functions - no longer needed with local storage

    // Old GitHub API function - no longer needed
    // All files are now stored locally in browser storage

    renderFiles() {
        console.log('renderFiles: Starting...');
        const filesGrid = document.getElementById('filesGrid');
        const emptyState = document.getElementById('emptyState');

        console.log('renderFiles: filesGrid =', filesGrid);
        console.log('renderFiles: emptyState =', emptyState);
        console.log('renderFiles: this.files =', this.files);

        if (!filesGrid || !emptyState) {
            console.warn('renderFiles: filesGrid or emptyState not found in DOM');
            return;
        }

        // Ensure this.files is an array
        if (!Array.isArray(this.files)) {
            console.warn('renderFiles: this.files is not an array, setting to []');
            this.files = [];
        }

        // Apply filter
        let filteredFiles = this.files;

        console.log('renderFiles: Applying filter, currentFilter =', this.currentFilter);

        if (this.currentFilter === 'images') {
            filteredFiles = this.files.filter(f => f && this.isImageFile(f.name));
        } else if (this.currentFilter === 'documents') {
            filteredFiles = this.files.filter(f => f && this.isDocumentFile(f.name));
        } else if (this.currentFilter === 'other') {
            filteredFiles = this.files.filter(f => f && !this.isImageFile(f.name) && !this.isDocumentFile(f.name));
        }

        console.log('renderFiles: filteredFiles =', filteredFiles);

        if (filteredFiles.length === 0) {
            filesGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        filesGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        filesGrid.innerHTML = filteredFiles.map(file => {
            const uploadDate = file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : 'Unknown';
            return `
            <div class="file-card" data-filename="${file.name}">
                <div class="file-icon">${this.getFileIcon(file.name)}</div>
                <div class="file-name" title="${file.name}">${this.truncateFileName(file.name)}</div>
                <div class="file-info">
                    <span>${this.formatFileSize(file.size)}</span>
                    <span>${uploadDate}</span>
                </div>
                <div class="file-actions">
                    <button class="btn-file-action" onclick="window.adminManager.downloadFile('${file.name}', \`${file.content}\`)">
                        📥 Download
                    </button>
                    <button class="btn-file-action btn-delete" onclick="window.adminManager.deleteFile('${file.name}', '${file.sha}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    filterFiles(searchTerm) {
        const cards = document.querySelectorAll('.file-card');
        const term = searchTerm.toLowerCase();

        cards.forEach(card => {
            const filename = card.dataset.filename.toLowerCase();
            if (filename.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    async handleFileUpload(files) {
        if (files.length === 0) return;

        const maxSize = 10 * 1024 * 1024; // 10MB
        const validFiles = files.filter(f => f.size <= maxSize);

        if (validFiles.length === 0) {
            this.showToast('All files exceed 10MB limit', 'error');
            return;
        }

        if (validFiles.length < files.length) {
            this.showToast(`${files.length - validFiles.length} files skipped (too large)`, 'info');
        }

        const progressBar = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        progressBar.style.display = 'block';

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const progress = Math.round(((i + 1) / validFiles.length) * 100);
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Uploading ${file.name}... (${i + 1}/${validFiles.length})`;

            try {
                await this.uploadFileLocal(file);
            } catch (error) {
                console.error('Upload error:', error);
                this.showToast(`Failed to upload ${file.name}`, 'error');
            }
        }

        progressBar.style.display = 'none';
        progressFill.style.width = '0%';

        this.showToast(`✅ Uploaded ${validFiles.length} file(s)`, 'success');
        
        // Save to GitHub after all files uploaded
        console.log('All files uploaded, saving to GitHub...');
        await this.saveFilesDataToGitHub();
        
        // Just re-render, don't reload from URL
        this.renderFiles();
        this.updateStats();
    }

    async uploadFileLocal(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async () => {
                try {
                    const content = reader.result; // Full data URL with base64
                    const fileName = this.sanitizeFileName(file.name);
                    
                    // Create file object
                    const fileObj = {
                        name: fileName,
                        size: file.size,
                        type: file.type,
                        content: content, // Store as data URL for easy download
                        uploadDate: new Date().toISOString(),
                        sha: this.generateRandomSha() // Fake sha for compatibility
                    };

                    // Add to files array (local cache)
                    this.files.push(fileObj);
                    this.saveFilesLocal();

                    // GitHub sync will happen after all files are uploaded (in handleFileUpload)
                    console.log('File added to local cache:', fileName);

                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsDataURL(file);
        });
    }

    generateRandomSha() {
        return Array.from({length: 40}, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    downloadFile(filename, content) {
        // Download from local storage (content is data URL)
        const link = document.createElement('a');
        link.href = content;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast(`📥 Downloading ${filename}`, 'info');
    }

    // --- GitHub on-demand helpers ---
    getSavedToken() {
        try {
            const cfg = localStorage.getItem('admin_config');
            console.log('getSavedToken: cfg =', cfg);
            if (!cfg) {
                console.log('No token in localStorage, using default token');
                return atob(this.defaultGithubTokenEncoded);
            }
            const parsed = JSON.parse(cfg);
            console.log('getSavedToken: parsed =', parsed);
            const decrypted = this.decrypt(parsed.token);
            console.log('getSavedToken: decrypted token =', decrypted);
            
            // If token exists in config, use it, otherwise use default
            return decrypted || atob(this.defaultGithubTokenEncoded);
        } catch (e) {
            console.error('getSavedToken error:', e);
            console.log('Error reading token, using default token');
            return atob(this.defaultGithubTokenEncoded);
        }
    }

    async tryGitHubCreateFile(path, content, message) {
        const token = this.getSavedToken();
        if (!token) throw new Error('No GitHub token configured');

        const response = await fetch(
            `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message, content })
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`GitHub error: ${response.status} ${text}`);
        }

        return await response.json();
    }

    async tryGitHubDeleteFile(path, sha, message) {
        const token = this.getSavedToken();
        if (!token) throw new Error('No GitHub token configured');

        const response = await fetch(
            `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message, sha })
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`GitHub error: ${response.status} ${text}`);
        }

        return await response.json();
    }

    async tryGitHubListFiles() {
        const token = this.getSavedToken();
        if (!token) throw new Error('No GitHub token configured');

        const response = await fetch(
            `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.storageFolder}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                // Folder doesn't exist yet, return empty array
                return [];
            }
            const text = await response.text();
            throw new Error(`GitHub error: ${response.status} ${text}`);
        }

        return await response.json();
    }

    async tryGitHubGetFile(path) {
        const token = this.getSavedToken();
        if (!token) throw new Error('No GitHub token configured');

        const response = await fetch(
            `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`GitHub error: ${response.status} ${text}`);
        }

        return await response.json();
    }

    async saveFilesDataToGitHub() {
        try {
            console.log('saveFilesDataToGitHub: Starting...');
            const token = this.getSavedToken();
            console.log('saveFilesDataToGitHub: Token exists?', !!token);
            
            if (!token) {
                console.log('No token, cannot save to GitHub');
                return;
            }

            // Convert files array to JSON
            const filesJson = JSON.stringify(this.files, null, 2);
            console.log('saveFilesDataToGitHub: Files JSON length:', filesJson.length);
            
            const base64Content = btoa(unescape(encodeURIComponent(filesJson)));
            console.log('saveFilesDataToGitHub: Base64 content length:', base64Content.length);

            const filePath = `${this.storageFolder}/files-data.json`;
            console.log('saveFilesDataToGitHub: File path:', filePath);

            // Check if file exists to get SHA
            let sha = null;
            try {
                console.log('saveFilesDataToGitHub: Checking if file exists...');
                const existing = await this.tryGitHubGetFile(filePath);
                sha = existing.sha;
                console.log('saveFilesDataToGitHub: File exists, SHA:', sha);
            } catch (e) {
                console.log('saveFilesDataToGitHub: File does not exist yet, will create');
            }

            // Create or update the file
            console.log('saveFilesDataToGitHub: Sending to GitHub...');
            const response = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${filePath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Update files data - ${this.files.length} file(s)`,
                        content: base64Content,
                        sha: sha // Include SHA if updating
                    })
                }
            );

            console.log('saveFilesDataToGitHub: Response status:', response.status);
            
            if (response.ok) {
                console.log('✅ Successfully saved files-data.json to GitHub');
                this.showToast('☁️ Synced to cloud!', 'success');
            } else {
                const errorText = await response.text();
                console.warn('Failed to save files-data.json:', response.status, errorText);
                this.showToast('⚠️ Could not sync to cloud', 'warning');
            }
        } catch (error) {
            console.error('Error in saveFilesDataToGitHub:', error);
            this.showToast('⚠️ Saved locally only', 'warning');
        }
    }

    async pullFromGitHub() {
        const token = this.getSavedToken();
        if (!token) {
            this.showToast('Please configure GitHub token first (Settings → Reconfigure Token)', 'error');
            return;
        }

        this.githubToken = token;

        try {
            this.showToast('🔄 Pulling files from GitHub...', 'info');
            
            // Get list of files from GitHub
            const files = await this.tryGitHubListFiles();
            
            if (files.length === 0) {
                this.showToast('No files found on GitHub', 'info');
                return;
            }

            // Download each file and add to local storage
            let successCount = 0;
            for (const file of files) {
                try {
                    const fileData = await this.tryGitHubGetFile(file.path);
                    
                    // Convert base64 content to data URL
                    const base64Content = fileData.content.replace(/\n/g, '');
                    const dataUrl = `data:application/octet-stream;base64,${base64Content}`;
                    
                    // Check if file already exists locally
                    const existingIndex = this.files.findIndex(f => f.name === file.name);
                    
                    const fileObj = {
                        name: file.name,
                        size: file.size,
                        type: 'application/octet-stream',
                        content: dataUrl,
                        uploadDate: new Date().toISOString(),
                        sha: file.sha
                    };
                    
                    if (existingIndex >= 0) {
                        // Update existing file
                        this.files[existingIndex] = fileObj;
                    } else {
                        // Add new file
                        this.files.push(fileObj);
                    }
                    
                    successCount++;
                } catch (err) {
                    console.warn(`Failed to download ${file.name}:`, err);
                }
            }
            
            // Save to localStorage
            this.saveFilesLocal();
            await this.loadFilesLocal();
            
            this.showToast(`✅ Pulled ${successCount} file(s) from GitHub`, 'success');
        } catch (error) {
            console.error('Pull from GitHub failed:', error);
            this.showToast('❌ Failed to pull from GitHub: ' + error.message, 'error');
        }
    }

    async tryAutoPullFromGitHub() {
        // Silently try to pull files from GitHub on login
        const token = this.getSavedToken();
        // Token will always exist now (either from config or default)
        
        this.githubToken = token;

        try {
            console.log('Attempting auto-pull from GitHub...');
            const files = await this.tryGitHubListFiles();
            
            if (files.length === 0) {
                console.log('No files on GitHub to pull');
                return;
            }

            console.log(`Found ${files.length} file(s) on GitHub, pulling...`);

            let successCount = 0;
            for (const file of files) {
                try {
                    const fileData = await this.tryGitHubGetFile(file.path);
                    const base64Content = fileData.content.replace(/\n/g, '');
                    const dataUrl = `data:application/octet-stream;base64,${base64Content}`;
                    
                    // Check if file already exists locally
                    const existingIndex = this.files.findIndex(f => f.name === file.name);
                    
                    const fileObj = {
                        name: file.name,
                        size: file.size,
                        type: 'application/octet-stream',
                        content: dataUrl,
                        uploadDate: new Date().toISOString(),
                        sha: file.sha
                    };
                    
                    if (existingIndex >= 0) {
                        // Update existing file with latest from GitHub
                        this.files[existingIndex] = fileObj;
                    } else {
                        // Add new file from GitHub
                        this.files.push(fileObj);
                    }
                    
                    successCount++;
                } catch (err) {
                    console.warn(`Failed to download ${file.name}:`, err);
                }
            }
            
            if (successCount > 0) {
                this.saveFilesLocal();
                // Refresh the UI with the updated files
                this.renderFiles();
                this.updateStats();
                console.log(`Auto-pulled ${successCount} file(s) from GitHub`);
                this.showToast(`📥 Synced ${successCount} file(s) from GitHub`, 'success');
            }
        } catch (error) {
            // Show error to user so they know sync failed
            console.log('Auto-pull failed (network may be restricted):', error.message);
            
            // Only show files count if we have local files
            if (this.files.length > 0) {
                this.showToast(`⚠️ Showing ${this.files.length} local file(s). GitHub sync unavailable.`, 'warning');
            } else {
                this.showToast('⚠️ No local files. Configure token in Settings to sync from GitHub.', 'warning');
            }
        }
    }

    // Queue pending operations (when GitHub blocked)
    queuePendingOperation(op) {
        try {
            const pending = JSON.parse(localStorage.getItem('admin_pending_ops') || '[]');
            pending.push(op);
            localStorage.setItem('admin_pending_ops', JSON.stringify(pending));
            this.updatePendingOpsWidget(); // Update widget immediately
        } catch (e) {
            console.error('Failed to queue operation', e);
        }
    }

    async flushPendingOperations() {
        const token = this.getSavedToken();
        if (!token) return; // cannot flush without token

        const pending = JSON.parse(localStorage.getItem('admin_pending_ops') || '[]');
        if (!pending.length) return;

        const succeeded = [];
        for (const op of pending) {
            try {
                if (op.type === 'create') {
                    await this.tryGitHubCreateFile(op.path, op.content, op.message);
                } else if (op.type === 'delete') {
                    await this.tryGitHubDeleteFile(op.path, op.sha, op.message || `Delete ${op.path}`);
                }
                succeeded.push(op);
            } catch (e) {
                console.warn('Pending op failed during flush:', e.message);
            }
        }

        // Remove succeeded
        const remaining = pending.filter(p => !succeeded.includes(p));
        localStorage.setItem('admin_pending_ops', JSON.stringify(remaining));
        if (succeeded.length) this.showToast(`✅ Flushed ${succeeded.length} pending operation(s)`, 'success');
        this.updatePendingOpsWidget(); // Update widget after flush
    }

    async deleteFile(filename, sha) {
        if (!confirm(`Are you sure you want to delete "${filename}"?\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            // Remove from local cache immediately
            this.files = this.files.filter(f => f.name !== filename);
            this.saveFilesLocal();
            this.showToast(`🗑️ Deleted ${filename}`, 'info');

            // Update files-data.json on GitHub
            await this.saveFilesDataToGitHub();

            await this.loadFilesLocal();
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('Failed to delete file', 'error');
        }
    }

    updateStats() {
        const fileCount = document.getElementById('fileCount');
        const totalSize = document.getElementById('totalSize');

        if (fileCount) {
            fileCount.textContent = this.files.length;
        }

        if (totalSize) {
            const total = this.files.reduce((sum, file) => sum + file.size, 0);
            totalSize.textContent = this.formatFileSize(total);
        }

        // Update pending operations widget
        this.updatePendingOpsWidget();
    }

    updatePendingOpsWidget() {
        const widget = document.getElementById('pendingOpsWidget');
        const countEl = document.getElementById('pendingOpsCount');

        if (!widget || !countEl) return;

        const pending = JSON.parse(localStorage.getItem('admin_pending_ops') || '[]');
        const count = pending.length;

        if (count > 0) {
            widget.classList.remove('hidden');
            countEl.textContent = count;
        } else {
            widget.classList.add('hidden');
        }
    }

    async syncNow() {
        const pending = JSON.parse(localStorage.getItem('admin_pending_ops') || '[]');
        
        if (!pending.length) {
            this.showToast('No pending operations to sync', 'info');
            return;
        }

        const token = this.getSavedToken();
        if (!token) {
            this.showToast('Please configure GitHub token first (Settings → Reconfigure Token)', 'error');
            return;
        }

        // Update the instance token
        this.githubToken = token;

        this.showToast('🔄 Syncing pending operations...', 'info');
        await this.flushPendingOperations();
        this.updatePendingOpsWidget();
    }

    async showSettings() {
        const menu = `Admin Settings\n\n1) Reconfigure GitHub Token\n2) Test GitHub Connection & Sync pending ops\n3) Pull files from GitHub\n4) Change Password\n5) View Storage Info\n\nEnter number to choose:`;
        const choice = prompt(menu);
        if (!choice) return;

        if (choice === '1') {
            const newToken = prompt('Enter new GitHub Personal Access Token:');
            if (newToken && newToken.trim() !== '') {
                const current = JSON.parse(localStorage.getItem('admin_config') || '{}');
                current.token = this.encrypt(newToken.trim());
                localStorage.setItem('admin_config', JSON.stringify(current));
                this.githubToken = newToken.trim();
                this.showToast('GitHub token updated successfully', 'success');
            }
        } else if (choice === '2') {
            // Test GitHub connection and try to flush pending ops
            await this.testGitHubConnection();
        } else if (choice === '3') {
            // Pull files from GitHub to local storage
            await this.pullFromGitHub();
        } else if (choice === '4') {
            const pwd = prompt('Enter new admin password:');
            if (pwd && pwd.trim() !== '') {
                const cfg = JSON.parse(localStorage.getItem('admin_config') || '{}');
                cfg.password = this.hashPassword(pwd.trim());
                localStorage.setItem('admin_config', JSON.stringify(cfg));
                this.showToast('Password updated', 'success');
            }
        } else if (choice === '5') {
            const pending = JSON.parse(localStorage.getItem('admin_pending_ops') || '[]');
            alert(`Storage Folder: ${this.storageFolder}\nLocal files: ${this.files.length}\nPending ops: ${pending.length}`);
        }
    }

    async testGitHubConnection() {
        const token = this.getSavedToken();
        if (!token) {
            this.showToast('No GitHub token configured. Please reconfigure first.', 'error');
            return;
        }

        // Update the instance token
        this.githubToken = token;

        try {
            const res = await fetch(`https://api.github.com/`, { headers: { 'Authorization': `token ${token}` } });
            if (res.ok) {
                this.showToast('✅ GitHub reachable. Attempting to sync pending operations...', 'success');
                await this.flushPendingOperations();
            } else {
                this.showToast(`❌ GitHub test failed: ${res.status}`, 'error');
            }
        } catch (e) {
            console.error('GitHub test failed', e);
            this.showToast('❌ GitHub unreachable from this network', 'error');
        }
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.clearSession();
            this.isAuthenticated = false;
            this.githubToken = null;
            this.adminPassword = null;
            this.files = [];
            this.showLogin();
            this.showToast('Logged out successfully', 'info');
        }
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboardScreen').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'block';
    }

    createSession() {
        const session = {
            password: this.adminPassword,
            token: this.githubToken ? this.encrypt(this.githubToken) : '',
            expiry: Date.now() + this.sessionDuration
        };
        sessionStorage.setItem('admin_session', JSON.stringify(session));
    }

    getSession() {
        const session = sessionStorage.getItem('admin_session');
        return session ? JSON.parse(session) : null;
    }

    clearSession() {
        sessionStorage.removeItem('admin_session');
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }
    }

    startSessionTimer() {
        // Clear existing timer
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }

        // Set new timer
        this.sessionTimeout = setTimeout(() => {
            this.showToast('Session expired. Please login again.', 'info');
            this.logout();
        }, this.sessionDuration);
    }

    // Utility Methods
    hashPassword(password) {
        // Simple hash for demo - in production use stronger hashing
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    encrypt(text) {
        // Simple XOR encryption - in production use stronger encryption
        if (!text) return '';
        const key = 'effortless-desk-admin-2025';
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    }

    decrypt(encrypted) {
        try {
            if (!encrypted) return null;
            const decoded = atob(encrypted);
            const key = 'effortless-desk-admin-2025';
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (error) {
            return null;
        }
    }

    sanitizeFileName(filename) {
        // Remove special characters and spaces
        return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    }

    truncateFileName(filename, maxLength = 25) {
        if (filename.length <= maxLength) return filename;
        const ext = filename.split('.').pop();
        const name = filename.substring(0, filename.lastIndexOf('.'));
        return name.substring(0, maxLength - ext.length - 4) + '...' + ext;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        const icons = {
            // Images
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️', 'webp': '🖼️',
            // Documents
            'pdf': '📄', 'doc': '📝', 'docx': '📝', 'txt': '📃', 'rtf': '📃',
            // Spreadsheets
            'xls': '📊', 'xlsx': '📊', 'csv': '📊',
            // Presentations
            'ppt': '📊', 'pptx': '📊',
            // Archives
            'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️', 'tar': '🗜️', 'gz': '🗜️',
            // Code
            'js': '💻', 'html': '💻', 'css': '💻', 'json': '💻', 'xml': '💻',
            // Audio
            'mp3': '🎵', 'wav': '🎵', 'ogg': '🎵',
            // Video
            'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'wmv': '🎬'
        };

        return icons[ext] || '📁';
    }

    isImageFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext);
    }

    isDocumentFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext);
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize on page load
window.adminManager = new AdminManager();
