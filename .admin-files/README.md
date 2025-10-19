# 📁 Admin Files Storage

This folder contains files uploaded via the **Admin Portal** of Effortless Desk.

## ⚠️ Important Notes

### Purpose:
This folder is used by the Admin Portal (`admin.html`) to store files uploaded by the admin. Files in this folder are synchronized across all devices using GitHub as cloud storage.

### Usage:
- **Upload**: Files are uploaded through the admin portal interface
- **Download**: Files can be downloaded from any device using the admin portal
- **Delete**: Files can be deleted through the admin portal interface
- **Access**: Only accessible via the password-protected admin portal

### Security:
- 🔐 Access is password-protected
- 🔒 GitHub token required for file operations
- 🚫 Not publicly accessible via the main website
- ✅ HTTPS encryption for all transfers

### Best Practices:
- ✅ Do NOT manually edit files in this folder
- ✅ Do NOT commit large files (max 10MB recommended)
- ✅ Use the admin portal interface for all file operations
- ✅ Regularly clean up old/unused files

### File Management:
- Files are base64 encoded when uploaded
- Each file operation creates a Git commit
- File history is preserved in Git history
- Deleted files are removed from the repository

### Storage Info:
- **Location**: `.admin-files/` (hidden folder)
- **Capacity**: Up to 100 GB (GitHub free tier)
- **File Limit**: 10 MB per file (configurable)
- **File Types**: Any file type supported

---

**Part of Effortless Desk v3.3**  
**Admin Portal Feature - Cross-Device File Sync**  
**Created: January 2025**
