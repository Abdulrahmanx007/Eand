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
        
        this.init();
    }

    init() {
        // Check if already authenticated
        const session = this.getSession();
        if (session && session.expiry > Date.now()) {
            this.isAuthenticated = true;
            this.adminPassword = session.password;
            this.githubToken = this.decrypt(session.token);
            this.showDashboard();
            this.loadFiles();
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

        // Check if first time setup
        const savedConfig = localStorage.getItem('admin_config');
        
        if (!savedConfig) {
            // First time - setup wizard
            await this.showSetupWizard(password);
        } else {
            // Verify password
            loginBtnText.style.display = 'none';
            loginSpinner.style.display = 'inline-block';

            const config = JSON.parse(savedConfig);
            const hashedPassword = this.hashPassword(password);

            if (hashedPassword === config.password) {
                this.adminPassword = hashedPassword;
                this.githubToken = this.decrypt(config.token);
                this.isAuthenticated = true;

                // Verify GitHub token is still valid
                const isValid = await this.verifyGitHubToken();
                
                if (isValid) {
                    this.createSession();
                    this.showDashboard();
                    await this.loadFiles();
                    this.startSessionTimer();
                    this.showToast('Welcome back! 🎉', 'success');
                } else {
                    this.showToast('GitHub token expired. Please reconfigure.', 'error');
                    await this.showSetupWizard(password);
                }
            } else {
                this.showToast('Incorrect password ❌', 'error');
            }

            loginBtnText.style.display = 'inline';
            loginSpinner.style.display = 'none';
        }
    }

    async showSetupWizard(password) {
        const token = prompt('🔧 First Time Setup\n\nPlease enter your GitHub Personal Access Token:\n\n(See SETUP-GUIDE.md for instructions)');
        
        if (!token || token.trim() === '') {
            this.showToast('Setup cancelled', 'info');
            return;
        }

        // Verify token
        this.githubToken = token.trim();
        const isValid = await this.verifyGitHubToken();

        if (!isValid) {
            this.showToast('Invalid GitHub token. Please check and try again.', 'error');
            return;
        }

        // Save configuration
        const hashedPassword = this.hashPassword(password);
        const encryptedToken = this.encrypt(token.trim());
        
        const config = {
            password: hashedPassword,
            token: encryptedToken,
            setupDate: new Date().toISOString()
        };

        localStorage.setItem('admin_config', JSON.stringify(config));
        
        this.adminPassword = hashedPassword;
        this.isAuthenticated = true;
        this.createSession();
        this.showDashboard();
        await this.ensureStorageFolder();
        await this.loadFiles();
        this.startSessionTimer();
        
        this.showToast('Setup complete! 🎉 Welcome to Admin Portal', 'success');
    }

    async verifyGitHubToken() {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    async ensureStorageFolder() {
        try {
            // Check if .admin-files folder exists
            const response = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.storageFolder}`,
                {
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                // Create folder with README
                await this.createFile(
                    `${this.storageFolder}/README.md`,
                    '# Admin Files Storage\n\nThis folder contains files uploaded via the Admin Portal.\nDo not manually edit files in this folder.',
                    'Initialize admin storage folder'
                );
            }
        } catch (error) {
            console.error('Error ensuring storage folder:', error);
        }
    }

    async loadFiles() {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.storageFolder}`,
                {
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load files');
            }

            const data = await response.json();
            
            // Filter out README and directories
            this.files = data.filter(item => 
                item.type === 'file' && 
                item.name !== 'README.md' &&
                item.name !== '.gitkeep'
            ).map(item => ({
                name: item.name,
                size: item.size,
                downloadUrl: item.download_url,
                sha: item.sha,
                path: item.path,
                uploadDate: new Date(item.sha).toLocaleDateString() // Approximation
            }));

            this.renderFiles();
            this.updateStats();
        } catch (error) {
            console.error('Error loading files:', error);
            this.showToast('Error loading files', 'error');
        }
    }

    renderFiles() {
        const filesGrid = document.getElementById('filesGrid');
        const emptyState = document.getElementById('emptyState');

        if (!filesGrid) return;

        // Apply filter
        let filteredFiles = this.files;

        if (this.currentFilter === 'images') {
            filteredFiles = this.files.filter(f => this.isImageFile(f.name));
        } else if (this.currentFilter === 'documents') {
            filteredFiles = this.files.filter(f => this.isDocumentFile(f.name));
        } else if (this.currentFilter === 'other') {
            filteredFiles = this.files.filter(f => !this.isImageFile(f.name) && !this.isDocumentFile(f.name));
        }

        if (filteredFiles.length === 0) {
            filesGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        filesGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        filesGrid.innerHTML = filteredFiles.map(file => `
            <div class="file-card" data-filename="${file.name}">
                <div class="file-icon">${this.getFileIcon(file.name)}</div>
                <div class="file-name" title="${file.name}">${this.truncateFileName(file.name)}</div>
                <div class="file-info">
                    <span>${this.formatFileSize(file.size)}</span>
                    <span>${file.uploadDate}</span>
                </div>
                <div class="file-actions">
                    <button class="btn-file-action" onclick="window.adminManager.downloadFile('${file.name}', '${file.downloadUrl}')">
                        📥 Download
                    </button>
                    <button class="btn-file-action btn-delete" onclick="window.adminManager.deleteFile('${file.name}', '${file.sha}', '${file.path}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
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
                await this.uploadFile(file);
            } catch (error) {
                console.error('Upload error:', error);
                this.showToast(`Failed to upload ${file.name}`, 'error');
            }
        }

        progressBar.style.display = 'none';
        progressFill.style.width = '0%';

        this.showToast(`✅ Uploaded ${validFiles.length} file(s)`, 'success');
        await this.loadFiles();
    }

    async uploadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async () => {
                try {
                    const content = reader.result.split(',')[1]; // Get base64 content
                    const fileName = this.sanitizeFileName(file.name);
                    const path = `${this.storageFolder}/${fileName}`;

                    await this.createFile(path, content, `Upload ${fileName}`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsDataURL(file);
        });
    }

    async createFile(path, content, message) {
        const response = await fetch(
            `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    content: content.includes(',') ? content : btoa(content) // Handle both base64 and plain text
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to create file: ${response.statusText}`);
        }

        return await response.json();
    }

    downloadFile(filename, downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast(`📥 Downloading ${filename}`, 'info');
    }

    async deleteFile(filename, sha, path) {
        if (!confirm(`Are you sure you want to delete "${filename}"?\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Delete ${filename}`,
                        sha: sha
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete file');
            }

            this.showToast(`🗑️ Deleted ${filename}`, 'success');
            await this.loadFiles();
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
    }

    showSettings() {
        const action = confirm('Admin Settings\n\n• Reconfigure GitHub Token\n• Change Password\n• View Storage Info\n\nClick OK to reconfigure, Cancel to close');
        
        if (action) {
            const newToken = prompt('Enter new GitHub Personal Access Token:');
            if (newToken && newToken.trim() !== '') {
                const config = JSON.parse(localStorage.getItem('admin_config'));
                config.token = this.encrypt(newToken.trim());
                localStorage.setItem('admin_config', JSON.stringify(config));
                this.githubToken = newToken.trim();
                this.showToast('GitHub token updated successfully', 'success');
            }
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
            token: this.encrypt(this.githubToken),
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
        const key = 'effortless-desk-admin-2025';
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    }

    decrypt(encrypted) {
        try {
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
