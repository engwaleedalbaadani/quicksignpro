// Agreements Page JavaScript

// DOM Elements
const menuItems = document.querySelectorAll('.menu-item');
const actionButtons = document.querySelectorAll('.action-buttons button');
const quickActionItems = document.querySelectorAll('.quick-action-item');
const uploadModal = document.getElementById('uploadModal');
const templateModal = document.getElementById('templateModal');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkAuthStatus();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Sidebar menu navigation
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            handleMenuClick(this);
        });
    });

    // Action buttons
    const sendDocumentBtn = document.getElementById('sendDocumentBtn');
    const uploadDocumentBtn = document.getElementById('uploadDocumentBtn');
    const createTemplateBtn = document.getElementById('createTemplateBtn');
    const requestSignatureBtn = document.getElementById('requestSignatureBtn');

    if (sendDocumentBtn) {
        sendDocumentBtn.addEventListener('click', handleSendDocument);
    }
    if (uploadDocumentBtn) {
        uploadDocumentBtn.addEventListener('click', handleUploadDocument);
    }
    if (createTemplateBtn) {
        createTemplateBtn.addEventListener('click', handleCreateTemplate);
    }
    if (requestSignatureBtn) {
        requestSignatureBtn.addEventListener('click', handleRequestSignature);
    }

    // Quick action items
    quickActionItems.forEach(item => {
        item.addEventListener('click', function() {
            handleQuickAction(this.dataset.action);
        });
    });

    // Modal close buttons
    const uploadModalClose = document.getElementById('uploadModalClose');
    const templateModalClose = document.getElementById('templateModalClose');
    const requestSignatureModalClose = document.getElementById('requestSignatureModalClose');
    const browseFilesBtn = document.getElementById('browseFilesBtn');

    if (uploadModalClose) {
        uploadModalClose.addEventListener('click', () => closeModal('uploadModal'));
    }
    if (templateModalClose) {
        templateModalClose.addEventListener('click', () => closeModal('templateModal'));
    }
    if (requestSignatureModalClose) {
        requestSignatureModalClose.addEventListener('click', () => closeModal('requestSignatureModal'));
    }
    if (browseFilesBtn) {
        browseFilesBtn.addEventListener('click', () => fileInput.click());
    }

    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }

    // Upload area drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }

    // Template cards
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        card.addEventListener('click', function() {
            handleTemplateSelection(this.dataset.template);
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
}

// Handle sidebar menu clicks
function handleMenuClick(menuItem) {
    // Remove active class from all menu items
    menuItems.forEach(item => item.classList.remove('active'));
    
    // Add active class to clicked item
    menuItem.classList.add('active');
    
    // Get section name
    const section = menuItem.dataset.section;
    
    // Update main content based on section
    updateMainContent(section);
}

// Update main content based on selected section
function updateMainContent(section) {
    const contentHeader = document.querySelector('.content-header h1');
    const emptyState = document.querySelector('.empty-state');
    
    // Update header title
    const sectionTitles = {
        'inbox': 'Inbox',
        'sent': 'Sent',
        'drafts': 'Drafts',
        'completed': 'Completed',
        'action-required': 'Action Required',
        'waiting': 'Waiting for Others',
        'templates': 'Templates'
    };
    
    if (contentHeader) {
        contentHeader.textContent = sectionTitles[section] || 'Inbox';
    }
    
    // Update empty state message
    if (emptyState) {
        updateEmptyState(section);
    }
}

// Update empty state based on section
function updateEmptyState(section) {
    const emptyContent = document.querySelector('.empty-content');
    const emptyMessages = {
        'inbox': {
            icon: 'fas fa-inbox',
            title: 'Your inbox is empty',
            message: 'Other companies send you documents to sign, they will show up here. You can also send documents to others.'
        },
        'sent': {
            icon: 'fas fa-paper-plane',
            title: 'No sent documents',
            message: 'Documents you send to others for signing will appear here.'
        },
        'drafts': {
            icon: 'fas fa-edit',
            title: 'No drafts',
            message: 'Save documents as drafts to complete them later.'
        },
        'completed': {
            icon: 'fas fa-check-circle',
            title: 'No completed documents',
            message: 'Fully signed and completed documents will appear here.'
        },
        'action-required': {
            icon: 'fas fa-exclamation-triangle',
            title: 'No action required',
            message: 'Documents requiring your attention will appear here.'
        },
        'waiting': {
            icon: 'fas fa-clock',
            title: 'No pending documents',
            message: 'Documents waiting for others to sign will appear here.'
        },
        'templates': {
            icon: 'fas fa-file-alt',
            title: 'No templates',
            message: 'Create reusable templates for frequently used documents.'
        }
    };
    
    const config = emptyMessages[section] || emptyMessages['inbox'];
    
    if (emptyContent) {
        const iconElement = emptyContent.querySelector('.empty-icon i');
        const titleElement = emptyContent.querySelector('h2');
        const messageElement = emptyContent.querySelector('p');
        
        if (iconElement) iconElement.className = config.icon;
        if (titleElement) titleElement.textContent = config.title;
        if (messageElement) messageElement.textContent = config.message;
    }
}

// Action button handlers
function handleSendDocument() {
    showNotification('Send Document feature coming soon!', 'info');
}

function handleUploadDocument() {
    openModal('uploadModal');
}

function handleCreateTemplate() {
    openModal('templateModal');
}

function handleRequestSignature() {
    openModal('requestSignatureModal');
    initializeRequestSignatureModal();
}

// Quick action handlers
function handleQuickAction(action) {
    const actionMessages = {
        'contract': 'Creating contract template...',
        'nda': 'Creating NDA template...',
        'invoice': 'Creating invoice template...',
        'proposal': 'Creating proposal template...',
        'agreement': 'Creating service agreement template...',
        'form': 'Creating custom form...'
    };
    
    const message = actionMessages[action] || 'Creating template...';
    showNotification(message, 'info');
    
    // Simulate template creation
    setTimeout(() => {
        showNotification('Template created successfully!', 'success');
    }, 2000);
}

// File handling functions
function handleFileSelection(e) {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
}

async function handleFileUpload(file) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
        showNotification('Please upload a PDF, DOC, or DOCX file.', 'error');
        return;
    }

    // Validate file size
    if (file.size > maxSize) {
        showNotification('File size must be less than 10MB.', 'error');
        return;
    }

    // Show upload progress
    showUploadProgress(file);
    
    // Actually upload file to server
    await uploadFileToServer(file);
}

function showUploadProgress(file) {
    uploadArea.innerHTML = `
        <div class="upload-progress">
            <div class="upload-icon">
                <i class="fas fa-file-upload"></i>
            </div>
            <h3>Uploading ${file.name}</h3>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <p class="progress-text">0%</p>
        </div>
    `;
}

async function uploadFileToServer(file) {
    try {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('title', file.name);
        formData.append('description', `Uploaded document: ${file.name}`);

        const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const result = await response.json();
        console.log('Document uploaded successfully:', result);
        
        // Store the uploaded document info for later use
        window.uploadedDocument = {
            id: result.document.id,
            name: result.document.title,
            filename: result.document.filename,
            path: result.document.path
        };
        
        // Update progress to 100%
        const progressFill = document.getElementById('progressFill');
        const progressText = document.querySelector('.progress-text');
        if (progressFill && progressText) {
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
        }
        
        setTimeout(() => {
            showUploadSuccess(file);
        }, 500);
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Upload failed. Please try again.', 'error');
        resetUploadArea();
    }
}

function showUploadSuccess(file) {
    uploadArea.innerHTML = `
        <div class="upload-success">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Upload Successful!</h3>
            <p>${file.name} has been uploaded successfully.</p>
            <div class="upload-actions">
                <button class="btn-primary" id="proceedToSigningBtn">
                    <i class="fas fa-signature"></i>
                    Proceed to Signing
                </button>
                <button class="btn-secondary" id="uploadAnotherBtn">
                    <i class="fas fa-upload"></i>
                    Upload Another
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners for the new buttons
    setTimeout(() => {
        const proceedBtn = document.getElementById('proceedToSigningBtn');
        const uploadAnotherBtn = document.getElementById('uploadAnotherBtn');
        
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => {
                closeModal('uploadModal');
                showNotification('Proceeding to signing interface...', 'success');
            });
        }
        if (uploadAnotherBtn) {
            uploadAnotherBtn.addEventListener('click', resetUploadArea);
        }
    }, 100);
}

function resetUploadArea() {
    uploadArea.innerHTML = `
        <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <h3>Drag and drop your document here</h3>
        <p>or click to browse files</p>
        <input type="file" id="fileInput" accept=".pdf,.doc,.docx" hidden>
        <button class="btn-browse" id="browseFilesBtn">Browse Files</button>
    `;
    
    // Re-attach event listeners
    const newFileInput = document.getElementById('fileInput');
    const newBrowseBtn = document.getElementById('browseFilesBtn');
    
    if (newFileInput) {
        newFileInput.addEventListener('change', handleFileSelection);
    }
    if (newBrowseBtn) {
        newBrowseBtn.addEventListener('click', () => newFileInput.click());
    }
    
    // Re-attach drag and drop
    const newUploadArea = document.getElementById('uploadArea');
    if (newUploadArea) {
        newUploadArea.addEventListener('click', () => newFileInput.click());
        newUploadArea.addEventListener('dragover', handleDragOver);
        newUploadArea.addEventListener('dragleave', handleDragLeave);
        newUploadArea.addEventListener('drop', handleDrop);
    }
}

// Template selection handler
function handleTemplateSelection(templateType) {
    closeModal('templateModal');
    
    const templateMessages = {
        'contract': 'Loading contract template...',
        'nda': 'Loading NDA template...',
        'invoice': 'Loading invoice template...',
        'proposal': 'Loading proposal template...'
    };
    
    const message = templateMessages[templateType] || 'Loading template...';
    showNotification(message, 'info');
    
    setTimeout(() => {
        showNotification('Template loaded successfully!', 'success');
    }, 1500);
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Notification function
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = getNotificationIcon(type);
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => notification.remove());
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    return icons[type] || icons['info'];
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
        return;
    }
    
    // Update UI for logged in user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    updateUIForLoggedInUser(user);
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (loginBtn && signupBtn && navMenu) {
        // Remove login/signup buttons
        loginBtn.parentElement.remove();
        signupBtn.parentElement.remove();
        
        // Add user menu
        const userMenu = document.createElement('li');
        userMenu.innerHTML = `
            <div class="user-menu">
                <span class="user-name">Welcome, ${user.fullName || user.email}</span>
                <button class="btn-logout" id="logoutBtn">Logout</button>
            </div>
        `;
        navMenu.appendChild(userMenu);
        
        // Add logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Request Signature Modal Functions
function initializeRequestSignatureModal() {
    // Initialize step navigation
    initializeStepNavigation();
    
    // Initialize document upload
    initializeDocumentUpload();
    
    // Initialize recipients functionality
    initializeRecipients();
    
    // Initialize message functionality
    initializeMessage();
    
    // Initialize modal controls
    initializeModalControls();
    
    // Reset modal state
    resetModalState();
}

function initializeStepNavigation() {
    const stepHeaders = document.querySelectorAll('.step-header');
    const collapseButtons = document.querySelectorAll('.btn-collapse');
    
    stepHeaders.forEach((header, index) => {
        header.addEventListener('click', () => {
            toggleStep(index + 1);
        });
    });
    
    collapseButtons.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleStep(index + 1);
        });
    });
}

function toggleStep(stepNumber) {
    const stepContent = document.getElementById(`step${stepNumber}`);
    const stepBody = stepContent.querySelector('.step-body');
    const collapseBtn = stepContent.querySelector('.btn-collapse i');
    
    if (stepBody.classList.contains('collapsed')) {
        stepBody.classList.remove('collapsed');
        collapseBtn.className = 'fas fa-chevron-up';
        stepContent.classList.add('active');
    } else {
        stepBody.classList.add('collapsed');
        collapseBtn.className = 'fas fa-chevron-down';
        stepContent.classList.remove('active');
    }
}

function initializeDocumentUpload() {
    const browseDocumentsBtn = document.getElementById('browseDocumentsBtn');
    const documentFileInput = document.getElementById('documentFileInput');
    const documentUploadArea = document.getElementById('documentUploadArea');
    
    if (browseDocumentsBtn) {
        browseDocumentsBtn.textContent = 'Browse Files';
        browseDocumentsBtn.addEventListener('click', () => {
            documentFileInput.click();
        });
    }
    
    if (documentFileInput) {
        documentFileInput.addEventListener('change', handleDocumentSelection);
    }
    
    if (documentUploadArea) {
        documentUploadArea.addEventListener('dragover', handleDocumentDragOver);
        documentUploadArea.addEventListener('dragleave', handleDocumentDragLeave);
        documentUploadArea.addEventListener('drop', handleDocumentDrop);
        documentUploadArea.addEventListener('click', () => {
            if (!documentUploadArea.querySelector('.uploaded-documents')) {
                documentFileInput.click();
            }
        });
    }
}

async function handleDocumentSelection(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        await uploadAndDisplayDocuments(files);
        updateStepProgress();
    }
}

function handleDocumentDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDocumentDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

async function handleDocumentDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        await uploadAndDisplayDocuments(files);
        updateStepProgress();
    }
}

async function uploadAndDisplayDocuments(files) {
    const documentUploadArea = document.getElementById('documentUploadArea');
    
    // Create uploaded documents container
    let uploadedContainer = documentUploadArea.querySelector('.uploaded-documents');
    if (!uploadedContainer) {
        uploadedContainer = document.createElement('div');
        uploadedContainer.className = 'uploaded-documents';
        documentUploadArea.appendChild(uploadedContainer);
        
        // Hide the upload placeholder
        const placeholder = documentUploadArea.querySelector('.upload-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }
    
    // Initialize uploaded documents array if not exists
    if (!window.uploadedDocuments) {
        window.uploadedDocuments = [];
    }
    
    // Upload and add each file
    for (const file of files) {
        try {
            // Upload file to server
            const formData = new FormData();
            formData.append('document', file);
            formData.append('title', file.name);
            formData.append('description', `Uploaded document: ${file.name}`);

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            console.log('Document uploaded successfully:', result);
            
            // Store the uploaded document info
            const documentInfo = {
                id: result.document.id,
                name: result.document.title,
                filename: result.document.filename,
                path: result.document.path,
                size: file.size
            };
            
            window.uploadedDocuments.push(documentInfo);
            
            // Set the first uploaded document as the main document
            if (!window.uploadedDocument) {
                window.uploadedDocument = documentInfo;
            }
            
            // Create file item in UI
            const fileItem = document.createElement('div');
            fileItem.className = 'uploaded-file-item';
            fileItem.dataset.documentId = documentInfo.id;
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file-pdf"></i>
                    <div class="file-details">
                        <h4>${documentInfo.name}</h4>
                        <p>${formatFileSize(documentInfo.size)}</p>
                    </div>
                </div>
                <button class="btn-remove-file" onclick="removeUploadedFile(this)">
                    <i class="fas fa-times"></i>
                </button>
            `;
            uploadedContainer.appendChild(fileItem);
            
        } catch (error) {
            console.error('Upload error:', error);
            showNotification(`Failed to upload ${file.name}. Please try again.`, 'error');
        }
    }
    
    // Add upload more button
    if (!uploadedContainer.querySelector('.btn-upload-more')) {
        const uploadMoreBtn = document.createElement('button');
        uploadMoreBtn.className = 'btn-upload-more';
        uploadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Add More Documents';
        uploadMoreBtn.addEventListener('click', () => {
            document.getElementById('documentFileInput').click();
        });
        uploadedContainer.appendChild(uploadMoreBtn);
    }
}

function removeUploadedFile(button) {
    const fileItem = button.closest('.uploaded-file-item');
    const uploadedContainer = fileItem.parentElement;
    const documentId = fileItem.dataset.documentId;
    
    // Remove from uploaded documents array
    if (window.uploadedDocuments && documentId) {
        window.uploadedDocuments = window.uploadedDocuments.filter(doc => doc.id !== documentId);
        
        // Update main document reference if this was the main document
        if (window.uploadedDocument && window.uploadedDocument.id === documentId) {
            window.uploadedDocument = window.uploadedDocuments.length > 0 ? window.uploadedDocuments[0] : null;
        }
    }
    
    fileItem.remove();
    
    // If no files left, show placeholder again
    if (uploadedContainer.children.length <= 1) { // Only upload more button left
        const documentUploadArea = document.getElementById('documentUploadArea');
        const placeholder = documentUploadArea.querySelector('.upload-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
        uploadedContainer.remove();
        
        // Clear uploaded documents arrays
        window.uploadedDocuments = [];
        window.uploadedDocument = null;
    }
    
    updateStepProgress();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function initializeRecipients() {
    const addRecipientBtn = document.getElementById('addRecipientBtn');
    const recipientInputs = document.querySelectorAll('#recipientName, #recipientEmail');
    
    if (addRecipientBtn) {
        addRecipientBtn.addEventListener('click', addNewRecipient);
    }
    
    // Add input validation
    recipientInputs.forEach(input => {
        input.addEventListener('input', updateStepProgress);
    });
    
    // Initialize customize dropdown for initial recipient
    initializeCustomizeDropdown();
}

function addNewRecipient() {
    const recipientsList = document.querySelector('.recipients-list');
    const newRecipient = document.createElement('div');
    newRecipient.className = 'recipient-item';
    
    const recipientCount = recipientsList.children.length + 1;
    
    newRecipient.innerHTML = `
        <div class="recipient-info">
            <label for="recipientName${recipientCount}">Name *</label>
            <input type="text" id="recipientName${recipientCount}" placeholder="Enter name" required>
        </div>
        <div class="recipient-info">
            <label for="recipientEmail${recipientCount}">Email *</label>
            <input type="email" id="recipientEmail${recipientCount}" placeholder="Enter email" required>
        </div>
        <div class="recipient-actions">
             <select id="recipientRole${recipientCount}">
                 <option value="needs-to-sign">Needs to Sign</option>
                 <option value="in-person">In Person Signer</option>
                 <option value="receives-copy">Receives a Copy</option>
                 <option value="needs-to-view">Needs to View</option>
             </select>
             <div class="customize-dropdown">
                 <button class="btn-customize" title="Customize">
                     Customize <i class="fas fa-chevron-down"></i>
                 </button>
                 <div class="customize-menu">
                     <div class="customize-option">
                         <i class="fas fa-key"></i>
                         <div class="option-content">
                             <h4>Add access code</h4>
                             <p>Enter a code that only you and this recipient know.</p>
                         </div>
                     </div>
                     <div class="customize-option">
                         <i class="fas fa-comment"></i>
                         <div class="option-content">
                             <h4>Add private message</h4>
                             <p>Include a personal note with this recipient.</p>
                         </div>
                     </div>
                 </div>
             </div>
             <button class="btn-icon" onclick="removeRecipient(this)" title="Remove">
                 <i class="fas fa-trash"></i>
             </button>
         </div>
    `;
    
    recipientsList.appendChild(newRecipient);
    
    // Add event listeners to new inputs
    const newInputs = newRecipient.querySelectorAll('input');
    newInputs.forEach(input => {
        input.addEventListener('input', updateStepProgress);
    });
    
    // Initialize customize dropdown for new recipient
    initializeCustomizeDropdownForElement(newRecipient);
}

function removeRecipient(button) {
    const recipientItem = button.closest('.recipient-item');
    recipientItem.remove();
    updateStepProgress();
}

function initializeCustomizeDropdown() {
    const customizeBtn = document.getElementById('customizeRecipient');
    const customizeMenu = document.getElementById('customizeMenu');
    
    if (customizeBtn && customizeMenu) {
        customizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            customizeMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!customizeBtn.contains(e.target) && !customizeMenu.contains(e.target)) {
                customizeMenu.classList.remove('show');
            }
        });
        
        // Handle customize options
        const customizeOptions = customizeMenu.querySelectorAll('.customize-option');
        customizeOptions.forEach(option => {
            option.addEventListener('click', () => {
                customizeMenu.classList.remove('show');
                // Add functionality for access code and private message here
                showNotification('Customize option selected', 'info');
            });
        });
    }
}

function initializeCustomizeDropdownForElement(element) {
    const customizeBtn = element.querySelector('.btn-customize');
    const customizeMenu = element.querySelector('.customize-menu');
    
    if (customizeBtn && customizeMenu) {
        customizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close all other dropdowns first
            document.querySelectorAll('.customize-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
            
            customizeMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!customizeBtn.contains(e.target) && !customizeMenu.contains(e.target)) {
                customizeMenu.classList.remove('show');
            }
        });
        
        // Handle customize options
        const customizeOptions = customizeMenu.querySelectorAll('.customize-option');
        customizeOptions.forEach(option => {
            option.addEventListener('click', () => {
                customizeMenu.classList.remove('show');
                // Add functionality for access code and private message here
                showNotification('Customize option selected', 'info');
            });
        });
    }
}

function initializeMessage() {
    const emailSubject = document.getElementById('emailSubject');
    const emailMessage = document.getElementById('emailMessage');
    
    if (emailSubject) {
        emailSubject.addEventListener('input', updateStepProgress);
    }
    
    if (emailMessage) {
        emailMessage.addEventListener('input', updateStepProgress);
    }
}

function initializeModalControls() {
    const cancelBtn = document.getElementById('cancelRequestBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeModal('requestSignatureModal');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', handleNextStep);
    }
}

function updateStepProgress() {
    const hasDocuments = document.querySelector('.uploaded-documents') !== null;
    const hasValidRecipients = validateRecipients();
    const hasValidMessage = validateMessage();
    
    // Update step indicators
    updateStepIndicator(1, hasDocuments);
    updateStepIndicator(2, hasValidRecipients);
    updateStepIndicator(3, hasValidMessage);
    
    // Enable/disable next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = !(hasDocuments && hasValidRecipients && hasValidMessage);
    }
}

function updateStepIndicator(stepNumber, isComplete) {
    const step = document.querySelector(`[data-step="${stepNumber}"]`);
    if (step) {
        if (isComplete) {
            step.classList.add('completed');
        } else {
            step.classList.remove('completed');
        }
    }
}

function validateRecipients() {
    const recipientItems = document.querySelectorAll('.recipient-item');
    let hasValidRecipient = false;
    
    recipientItems.forEach(item => {
        const nameInput = item.querySelector('input[type="text"]');
        const emailInput = item.querySelector('input[type="email"]');
        
        if (nameInput && emailInput && nameInput.value.trim() && emailInput.value.trim()) {
            hasValidRecipient = true;
        }
    });
    
    return hasValidRecipient;
}

function validateMessage() {
    const emailSubject = document.getElementById('emailSubject');
    return emailSubject && emailSubject.value.trim() !== '';
}

async function handleNextStep() {
    // Collect form data
    const formData = collectFormData();
    
    // Show loading state
    const nextBtn = document.getElementById('nextBtn');
    const originalText = nextBtn.innerHTML;
    nextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    nextBtn.disabled = true;
    
    // Simulate processing
    setTimeout(async () => {
        closeModal('requestSignatureModal');
        await openDocumentEditor(formData);
        
        // Reset button
        nextBtn.innerHTML = originalText;
        nextBtn.disabled = false;
    }, 1500);
}

function collectFormData() {
    const documents = [];
    const uploadedFiles = document.querySelectorAll('.uploaded-file-item');
    uploadedFiles.forEach(item => {
        const fileName = item.querySelector('h4').textContent;
        documents.push({ name: fileName });
    });
    
    const recipients = [];
    const recipientItems = document.querySelectorAll('.recipient-item');
    recipientItems.forEach(item => {
        const nameInput = item.querySelector('input[type="text"]');
        const emailInput = item.querySelector('input[type="email"]');
        const roleSelect = item.querySelector('select');
        
        if (nameInput.value.trim() && emailInput.value.trim()) {
            recipients.push({
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                role: roleSelect.value
            });
        }
    });
    
    const message = {
        subject: document.getElementById('emailSubject').value.trim(),
        body: document.getElementById('emailMessage').value.trim()
    };
    
    return { documents, recipients, message };
}

function resetModalState() {
    // Reset step 1 to active
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    if (step1) step1.classList.add('active');
    if (step2) step2.classList.remove('active');
    if (step3) step3.classList.remove('active');
    
    // Reset step bodies
    const step1Body = document.querySelector('#step1 .step-body');
    const step2Body = document.querySelector('#step2 .step-body');
    const step3Body = document.querySelector('#step3 .step-body');
    
    if (step1Body) step1Body.classList.remove('collapsed');
    if (step2Body) step2Body.classList.add('collapsed');
    if (step3Body) step3Body.classList.add('collapsed');
    
    // Reset collapse buttons
    const step1Btn = document.querySelector('#step1 .btn-collapse i');
    const step2Btn = document.querySelector('#step2 .btn-collapse i');
    const step3Btn = document.querySelector('#step3 .btn-collapse i');
    
    if (step1Btn) step1Btn.className = 'fas fa-chevron-up';
    if (step2Btn) step2Btn.className = 'fas fa-chevron-down';
    if (step3Btn) step3Btn.className = 'fas fa-chevron-down';
    
    // Clear uploaded documents
    const uploadedContainer = document.querySelector('.uploaded-documents');
    if (uploadedContainer) {
        uploadedContainer.remove();
        const placeholder = document.querySelector('.upload-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
    }
    
    // Reset form fields
    const form = document.getElementById('requestSignatureModal');
    if (form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type !== 'file') {
                input.value = '';
            }
        });
    }
    
    // Reset next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = true;
    }
    
    // Reset step indicators
    updateStepProgress();
}

// Document Editor Functions
async function openDocumentEditor(formData) {
    const modal = document.getElementById('documentEditorModal');
    modal.style.display = 'block';
    
    // Initialize document editor
    initializeDocumentEditor(formData);
    
    // Load document content (uploaded or sample)
    await loadSampleDocument();
}

function initializeDocumentEditor(formData) {
    // Populate recipients list
    populateRecipientsEditor(formData.recipients);
    
    // Initialize field buttons
    initializeFieldButtons();
    
    // Initialize document controls
    initializeDocumentControls();
    
    // Initialize modal close
    const closeBtn = document.getElementById('documentEditorClose');
    const backBtn = document.getElementById('backToSetupBtn');
    const sendBtn = document.getElementById('sendForSignatureBtn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal('documentEditorModal');
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            closeModal('documentEditorModal');
            openModal('requestSignatureModal');
        });
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', handleFinalSendForSignature);
    }
}

function populateRecipientsEditor(recipients) {
    const recipientsList = document.getElementById('recipientsList');
    const colors = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];
    
    recipientsList.innerHTML = '';
    
    recipients.forEach((recipient, index) => {
        const recipientItem = document.createElement('div');
        recipientItem.className = 'recipient-editor-item';
        recipientItem.dataset.recipientIndex = index;
        
        if (index === 0) {
            recipientItem.classList.add('active');
        }
        
        recipientItem.innerHTML = `
            <div class="recipient-color" style="background-color: ${colors[index % colors.length]}"></div>
            <div class="recipient-info">
                <div class="recipient-name">${recipient.name}</div>
                <div class="recipient-role">${recipient.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            </div>
        `;
        
        recipientItem.addEventListener('click', () => {
            document.querySelectorAll('.recipient-editor-item').forEach(item => {
                item.classList.remove('active');
            });
            recipientItem.classList.add('active');
            updateActiveRecipient(index);
        });
        
        recipientsList.appendChild(recipientItem);
    });
}

function initializeFieldButtons() {
    const fieldButtons = document.querySelectorAll('.field-btn');
    let activeField = null;
    
    fieldButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active state from all buttons
            fieldButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active state to clicked button
            button.classList.add('active');
            activeField = button.dataset.field;
            
            // Enable field placement mode
            enableFieldPlacement(activeField);
        });
    });
}

function enableFieldPlacement(fieldType) {
    const documentPreview = document.getElementById('documentPreview');
    const fieldOverlay = document.getElementById('fieldOverlay');
    
    // Enable pointer events on overlay for field placement
    if (fieldOverlay) {
        fieldOverlay.style.pointerEvents = 'auto';
        fieldOverlay.style.cursor = 'crosshair';
        
        // Remove existing click listener
        fieldOverlay.removeEventListener('click', handleDocumentClick);
        
        // Add new click listener for field placement
        fieldOverlay.addEventListener('click', handleDocumentClick);
    } else {
        // Fallback for non-PDF documents
        documentPreview.removeEventListener('click', handleDocumentClick);
        documentPreview.addEventListener('click', handleDocumentClick);
    }
    
    // Change cursor to indicate placement mode
    documentPreview.style.cursor = 'crosshair';
    
    // Store active field type
    documentPreview.dataset.activeField = fieldType;
}

function handleDocumentClick(e) {
    const documentPreview = document.getElementById('documentPreview');
    const fieldOverlay = document.getElementById('fieldOverlay');
    const fieldType = documentPreview.dataset.activeField;
    
    if (!fieldType) return;
    
    // Get click position relative to the overlay or document
    const targetElement = fieldOverlay || documentPreview;
    const rect = targetElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create field element
    createFieldElement(fieldType, x, y, targetElement);
    
    // Reset placement mode
    resetFieldPlacement();
}

function createFieldElement(fieldType, x, y, targetElement) {
    const documentPreview = document.getElementById('documentPreview');
    const fieldOverlay = document.getElementById('fieldOverlay');
    const activeRecipient = document.querySelector('.recipient-editor-item.active');
    const recipientIndex = activeRecipient ? activeRecipient.dataset.recipientIndex : 0;
    
    const field = document.createElement('div');
    field.className = `${fieldType}-field`;
    field.style.position = 'absolute';
    field.style.left = `${x}px`;
    field.style.top = `${y}px`;
    field.dataset.fieldType = fieldType;
    field.dataset.recipientIndex = recipientIndex;
    
    // Set field content based on type
    const fieldLabels = {
        signature: 'Signature',
        initial: 'Initial',
        date: 'Date Signed',
        text: 'Text Field',
        checkbox: 'Checkbox',
        radio: 'Radio Button'
    };
    
    field.innerHTML = `
        ${fieldLabels[fieldType]}
        <button class="field-delete" onclick="removeField(this)">&times;</button>
    `;
    
    // Make field draggable
    makeFieldDraggable(field);
    
    // Add click handler for selection
    field.addEventListener('click', (e) => {
        e.stopPropagation();
        selectField(field);
    });
    
    // Append to overlay if available, otherwise to document preview
    const container = fieldOverlay || documentPreview;
    container.appendChild(field);
}

function makeFieldDraggable(field) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    field.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = parseInt(field.style.left) || 0;
        initialY = parseInt(field.style.top) || 0;
        
        field.style.zIndex = '1000';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        field.style.left = `${initialX + deltaX}px`;
        field.style.top = `${initialY + deltaY}px`;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            field.style.zIndex = 'auto';
        }
    });
}

function selectField(field) {
    // Remove selection from all fields
    document.querySelectorAll('[class*="-field"]').forEach(f => {
        f.classList.remove('field-selected');
    });
    
    // Select clicked field
    field.classList.add('field-selected');
}

function removeField(button) {
    const field = button.closest('[class*="-field"]');
    field.remove();
}

function resetFieldPlacement() {
    const documentPreview = document.getElementById('documentPreview');
    const fieldOverlay = document.getElementById('fieldOverlay');
    const fieldButtons = document.querySelectorAll('.field-btn');
    
    // Reset cursor
    documentPreview.style.cursor = 'default';
    
    // Disable pointer events on overlay
    if (fieldOverlay) {
        fieldOverlay.style.pointerEvents = 'none';
        fieldOverlay.style.cursor = 'default';
    }
    
    // Remove active field type
    delete documentPreview.dataset.activeField;
    
    // Remove active state from field buttons
    fieldButtons.forEach(btn => btn.classList.remove('active'));
}

function updateActiveRecipient(index) {
    // Update field colors or other recipient-specific styling
    console.log(`Active recipient changed to index: ${index}`);
}

function initializeDocumentControls() {
    let zoomLevel = 100;
    const zoomLevelSpan = document.getElementById('zoomLevel');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const documentPreview = document.getElementById('documentPreview');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            zoomLevel = Math.min(200, zoomLevel + 25);
            updateZoom(zoomLevel, documentPreview, zoomLevelSpan);
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            zoomLevel = Math.max(50, zoomLevel - 25);
            updateZoom(zoomLevel, documentPreview, zoomLevelSpan);
        });
    }
}

function updateZoom(level, preview, span) {
    preview.style.transform = `scale(${level / 100})`;
    preview.style.transformOrigin = 'top center';
    span.textContent = `${level}%`;
}

async function loadSampleDocument() {
    const documentPreview = document.getElementById('documentPreview');
    
    // Check if there's an uploaded document
    if (window.uploadedDocument && window.uploadedDocument.id) {
        try {
            const response = await fetch(`/api/documents/${window.uploadedDocument.id}/content`);
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/pdf')) {
                    // For PDF files, use direct API endpoint in iframe with overlay for field placement
                    documentPreview.innerHTML = `
                        <div style="position: relative; width: 100%; height: 800px;">
                            <iframe src="/api/documents/${window.uploadedDocument.id}/content" 
                                    style="width: 100%; height: 100%; border: none; border-radius: 8px;"
                                    title="${window.uploadedDocument.name || 'Uploaded Document'}">
                            </iframe>
                            <div id="fieldOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; pointer-events: none;"></div>
                        </div>
                    `;
                } else {
                    // For other file types, show document info
                    documentPreview.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <i class="fas fa-file-alt" style="font-size: 48px; color: #6c757d; margin-bottom: 20px;"></i>
                            <h3>${window.uploadedDocument.name || 'Uploaded Document'}</h3>
                            <p style="color: #6c757d;">Document loaded successfully</p>
                        </div>
                    `;
                }
                return;
            }
        } catch (error) {
            console.error('Error loading uploaded document:', error);
        }
    }
    
    // Fallback to sample document if no uploaded document or error
    documentPreview.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 30px;">CARRIER AGREEMENT</h2>
        
        <p><strong>1. Equipment Requirements:</strong> Any and all loads requiring refrigeration must have equipment and or a temperature monitoring device that can measure and provide a report of all temperatures throughout the entire shipment from first pickup to final delivery.</p>
        
        <p><strong>2. Acceptance of the shipment:</strong> shall be deemed acknowledgment of all terms and conditions of the Broker Agreement.</p>
        
        <p style="margin-left: 20px;"><strong>A.</strong> If the Carrier agrees to accept the load but then refuses or returns the load within 3 hours of the scheduled pickup, thereby forcing Patterson to hire a different carrier or causing the load to be forfeited, the Carrier shall pay Patterson $150.00 as liquidated damages in addition to any shipper or receiver fees.</p>
        
        <p><strong>3. Carrier agrees to abide by all applicable federal and state laws and regulations, including, but not limited to laws and regulations regarding hours of service and safety.</strong></p>
        
        <div style="margin-top: 50px;">
            <p><strong>Carrier Name (Please Print):</strong> _________________________________________________</p>
            <br>
            <p><strong>Carrier Representative Signature:</strong> _________________________________________________</p>
            <br>
            <p><strong>Print Name:</strong> _________________________________________________</p>
            <br>
            <p><strong>Driver Name/Phone/Tractor or Trailer:</strong> _________________________________________________</p>
            <br>
            <p><strong>Date Signed:</strong> _________________________________________________</p>
        </div>
    `;
}

async function handleFinalSendForSignature() {
    // Collect all field data
    const fields = document.querySelectorAll('[class*="-field"]');
    const fieldData = Array.from(fields).map(field => ({
        type: field.dataset.fieldType,
        recipientIndex: field.dataset.recipientIndex,
        x: parseInt(field.style.left),
        y: parseInt(field.style.top),
        width: field.offsetWidth,
        height: field.offsetHeight
    }));
    
    // Get recipient data and email settings
    const recipients = getRecipientsData();
    console.log('📧 Recipients data collected:', recipients);
    console.log('📧 Number of recipients:', recipients.length);
    
    const emailSubject = document.getElementById('emailSubject')?.value || 'Please DocuSign: Document Signature Required';
    const emailMessage = document.getElementById('emailMessage')?.value || '';
    
    // Show loading state
    const sendBtn = document.getElementById('sendForSignatureBtn');
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    sendBtn.disabled = true;
    
    try {
        // Use the uploaded document ID instead of generating a random request ID
        let documentId = null;
        let documentName = 'Document';
        
        if (window.uploadedDocument) {
            documentId = window.uploadedDocument.id;
            documentName = window.uploadedDocument.name;
        } else {
            // Fallback: generate a request ID if no document was uploaded
            documentId = generateSignatureRequestId();
        }
        
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
        const signatureLink = `${baseUrl}/sign.html?id=${documentId}`;
        
        // Store signature request data for later use
        const signatureRequestData = {
            requestId: documentId,
            documentId: documentId,
            recipients,
            fieldData,
            emailSubject,
            emailMessage,
            documentName: documentName,
            createdAt: new Date().toISOString()
        };
        
        // Store in localStorage for the signing page to access
        localStorage.setItem(`signature_request_${documentId}`, JSON.stringify(signatureRequestData));
        
        // Send signature request emails
        const emailResponse = await fetch('/api/send-signature-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipients: recipients,
                signingLink: signatureLink,
                subject: emailSubject,
                message: emailMessage,
                senderName: getCurrentUserName(),
                documentName: documentName
            })
        });
        
        if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            throw new Error(errorData.error || 'Failed to send emails');
        }
        
        const emailResult = await emailResponse.json();
        console.log('Email sending result:', emailResult);
        
        closeModal('documentEditorModal');
        
        // Show success notification with link
        showSignatureRequestSuccess(signatureLink, documentId);
        
        // Reset button
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
        
        console.log('Field data:', fieldData);
        console.log('Signature request link:', signatureLink);
        console.log('Emails sent to:', recipients.filter(r => r.role === 'Needs to Sign').length, 'recipients');
        
    } catch (error) {
        console.error('Error sending signature request:', error);
        showNotification('Failed to send signature request: ' + error.message, 'error');
        
        // Reset button
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

function generateSignatureRequestId() {
    // Generate a unique ID for the signature request
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `req_${timestamp}_${random}`;
}

function showSignatureRequestSuccess(signatureLink, requestId) {
    // Create a custom modal to show the signature request link
    const modal = document.createElement('div');
    modal.className = 'signature-success-modal';
    modal.innerHTML = `
        <div class="signature-success-content">
            <div class="signature-success-header">
                <h3><i class="fas fa-check-circle" style="color: #4caf50;"></i> Document Sent Successfully!</h3>
                <button class="signature-success-close" onclick="closeSignatureSuccessModal()">&times;</button>
            </div>
            <div class="signature-success-body">
                <p>Your document has been sent for signature. Share the link below with your recipients:</p>
                <div class="signature-link-container">
                    <input type="text" id="signatureLinkInput" value="${signatureLink}" readonly>
                    <button class="copy-link-btn" onclick="copySignatureLink()">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                </div>
                <div class="signature-request-details">
                    <p><strong>Request ID:</strong> ${requestId}</p>
                    <p><strong>Status:</strong> Pending Signatures</p>
                    <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div class="signature-success-actions">
                    <button class="btn btn-primary" onclick="openSignatureLink()">
                        <i class="fas fa-external-link-alt"></i> Preview Signing Experience
                    </button>
                    <button class="btn btn-secondary" onclick="closeSignatureSuccessModal()">
                        Done
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store the link globally for the copy function
    window.currentSignatureLink = signatureLink;
}

function closeSignatureSuccessModal() {
    const modal = document.querySelector('.signature-success-modal');
    if (modal) {
        modal.remove();
    }
}

function copySignatureLink() {
    const input = document.getElementById('signatureLinkInput');
    input.select();
    input.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        const copyBtn = document.querySelector('.copy-link-btn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyBtn.style.background = '#4caf50';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy link:', err);
        showNotification('Failed to copy link. Please copy manually.', 'error');
    }
}

function openSignatureLink() {
    if (window.currentSignatureLink) {
        window.open(window.currentSignatureLink, '_blank');
    }
}

// Helper function to get recipients data
function getRecipientsData() {
    const recipientItems = document.querySelectorAll('.recipient-item');
    const recipients = [];
    
    recipientItems.forEach(item => {
        const nameInput = item.querySelector('input[type="text"]');
        const emailInput = item.querySelector('input[type="email"]');
        const roleSelect = item.querySelector('select');
        
        if (nameInput && emailInput && nameInput.value.trim() && emailInput.value.trim()) {
            recipients.push({
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                role: roleSelect ? roleSelect.value : 'Needs to Sign'
            });
        }
    });
    
    return recipients;
}

// Helper function to get current user name
function getCurrentUserName() {
    // Try to get from localStorage or session
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            return user.fullName || user.name || user.email || 'QuickSign Pro User';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // Fallback to checking if user is logged in via other means
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        const text = userNameElement.textContent;
        const match = text.match(/Welcome,\s*(.+)/);
        if (match) {
            return match[1].trim();
        }
    }
    
    return 'QuickSign Pro User';
}

// Add CSS for notifications and progress bars
const additionalCSS = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        padding: 15px 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        display: flex;
        align-items: center;
        gap: 15px;
        min-width: 300px;
        animation: slideInRight 0.3s ease;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification-success {
        border-left: 4px solid #10b981;
    }
    
    .notification-error {
        border-left: 4px solid #ef4444;
    }
    
    .notification-warning {
        border-left: 4px solid #f59e0b;
    }
    
    .notification-info {
        border-left: 4px solid #3b82f6;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 5px;
        font-size: 16px;
    }
    
    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin: 20px 0;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #2563eb, #1d4ed8);
        border-radius: 4px;
        transition: width 0.3s ease;
        width: 0%;
    }
    
    .upload-progress, .upload-success {
        text-align: center;
    }
    
    .success-icon {
        font-size: 4rem;
        color: #10b981;
        margin-bottom: 20px;
    }
    
    .upload-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-top: 20px;
    }
    
    .user-menu {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .user-name {
        color: #333;
        font-weight: 500;
        font-size: 0.9rem;
    }
    
    .btn-logout {
        background: #ef4444;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.3s ease;
    }
    
    .btn-logout:hover {
        background: #dc2626;
    }
`;

// Add the CSS to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);