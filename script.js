// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

// Mobile Navigation Toggle
if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.background = '#fff';
        navbar.style.backdropFilter = 'none';
    }
});

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Add animation class
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.animation = 'modalSlideIn 0.3s ease';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.animation = 'modalSlideOut 0.3s ease';
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

function switchModal(currentModalId, targetModalId) {
    closeModal(currentModalId);
    setTimeout(() => {
        openModal(targetModalId);
    }, 300);
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="block"]');
        if (openModal) {
            closeModal(openModal.id);
        }
    }
});

// Initialize upload functionality
function initializeUploadFunctionality() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const browseFilesBtn = document.getElementById('browseFilesBtn');
    
    if (uploadArea && fileInput) {
        // Remove existing event listeners to prevent duplicates
        uploadArea.replaceWith(uploadArea.cloneNode(true));
        const newUploadArea = document.getElementById('uploadArea');
        
        // Click to upload
        newUploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop functionality
        newUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            newUploadArea.classList.add('dragover');
        });

        newUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            newUploadArea.classList.remove('dragover');
        });

        newUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            newUploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
    
    // Browse files button
    if (browseFilesBtn) {
        browseFilesBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
}

// File Upload Functionality - Initialize on page load
initializeUploadFunctionality();

// Handle file upload
function handleFileUpload(file) {
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
    
    // Simulate file upload
    simulateFileUpload(file);
}

// Show upload progress
function showUploadProgress(file) {
    const uploadArea = document.getElementById('uploadArea');
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

// Simulate file upload with progress
function simulateFileUpload(file) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.querySelector('.progress-text');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;

        if (progressFill && progressText) {
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                showUploadSuccess(file);
            }, 500);
        }
    }, 200);
}

// Show upload success
function showUploadSuccess(file) {
    const uploadArea = document.getElementById('uploadArea');
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
            proceedBtn.addEventListener('click', proceedToSigning);
        }
        if (uploadAnotherBtn) {
            uploadAnotherBtn.addEventListener('click', resetUpload);
        }
    }, 100);
}

// Reset upload area
function resetUpload() {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <h3>Drag and drop your document here</h3>
        <p>or click to browse files</p>
        <input type="file" id="fileInput" accept=".pdf,.doc,.docx" hidden>
        <button class="btn-browse" id="resetBrowseBtn">Browse Files</button>
    `;
    
    // Re-attach event listeners
    const newFileInput = document.getElementById('fileInput');
    const resetBrowseBtn = document.getElementById('resetBrowseBtn');
    
    if (newFileInput) {
        newFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
    
    if (resetBrowseBtn) {
        resetBrowseBtn.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }
}

// Proceed to signing interface
function proceedToSigning() {
    closeModal('uploadModal');
    showNotification('Redirecting to signing interface...', 'success');
    
    // In a real application, this would redirect to the signing page
    setTimeout(() => {
        openSigningInterface();
    }, 1000);
}

// Open signing interface (demo)
function openSigningInterface() {
    const signingModal = createSigningModal();
    document.body.appendChild(signingModal);
    openModal('signingModal');
}

// Create signing interface modal
function createSigningModal() {
    const modal = document.createElement('div');
    modal.id = 'signingModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content signing-modal">
            <span class="close" id="signingModalCloseBtn">&times;</span>
            <h2>Document Signing</h2>
            <div class="signing-interface">
                <div class="document-viewer">
                    <div class="document-page">
                        <h3>Sample Contract Agreement</h3>
                        <p>This is a sample document for demonstration purposes.</p>
                        <div class="signature-fields">
                            <div class="signature-field-container">
                                <label>Your Signature:</label>
                                <div class="signature-pad" id="signaturePad">
                                    <canvas width="400" height="150"></canvas>
                                    <div class="signature-controls">
                                        <button class="btn-clear" id="clearSignatureBtn">Clear</button>
                                        <button class="btn-save" id="saveSignatureBtn">Save Signature</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="signing-actions">
                    <button class="btn-primary" id="completeSignatureBtn">
                        <i class="fas fa-check"></i>
                        Complete Signature
                    </button>
                    <button class="btn-secondary" id="cancelSignatureBtn">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners after modal is created
    setTimeout(() => {
        const closeBtn = document.getElementById('signingModalCloseBtn');
        const clearBtn = document.getElementById('clearSignatureBtn');
        const saveBtn = document.getElementById('saveSignatureBtn');
        const completeBtn = document.getElementById('completeSignatureBtn');
        const cancelBtn = document.getElementById('cancelSignatureBtn');
        
        if (closeBtn) closeBtn.addEventListener('click', closeSigningModal);
        if (clearBtn) clearBtn.addEventListener('click', clearSignature);
        if (saveBtn) saveBtn.addEventListener('click', saveSignature);
        if (completeBtn) completeBtn.addEventListener('click', completeSignature);
        if (cancelBtn) cancelBtn.addEventListener('click', closeSigningModal);
    }, 100);
    
    return modal;
}

// Close signing modal
function closeSigningModal() {
    const modal = document.getElementById('signingModal');
    if (modal) {
        closeModal('signingModal');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Signature pad functionality
let isDrawing = false;
let signatureCanvas = null;
let signatureCtx = null;

// Initialize signature pad
function initSignaturePad() {
    signatureCanvas = document.querySelector('#signaturePad canvas');
    if (signatureCanvas) {
        signatureCtx = signatureCanvas.getContext('2d');
        signatureCtx.strokeStyle = '#000';
        signatureCtx.lineWidth = 2;
        signatureCtx.lineCap = 'round';

        // Mouse events
        signatureCanvas.addEventListener('mousedown', startDrawing);
        signatureCanvas.addEventListener('mousemove', draw);
        signatureCanvas.addEventListener('mouseup', stopDrawing);
        signatureCanvas.addEventListener('mouseout', stopDrawing);

        // Touch events for mobile
        signatureCanvas.addEventListener('touchstart', handleTouch);
        signatureCanvas.addEventListener('touchmove', handleTouch);
        signatureCanvas.addEventListener('touchend', stopDrawing);
    }
}

// Start drawing
function startDrawing(e) {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    signatureCtx.beginPath();
    signatureCtx.moveTo(x, y);
}

// Draw
function draw(e) {
    if (!isDrawing) return;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();
}

// Stop drawing
function stopDrawing() {
    isDrawing = false;
}

// Handle touch events
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                     e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    signatureCanvas.dispatchEvent(mouseEvent);
}

// Clear signature
function clearSignature() {
    if (signatureCtx && signatureCanvas) {
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    }
}

// Save signature
function saveSignature() {
    if (signatureCanvas) {
        const signatureData = signatureCanvas.toDataURL();
        showNotification('Signature saved successfully!', 'success');
        // In a real application, you would save this data
        console.log('Signature data:', signatureData);
    }
}

// Complete signature process
function completeSignature() {
    showNotification('Document signed successfully!', 'success');
    closeSigningModal();
    
    // Show completion modal
    setTimeout(() => {
        showCompletionModal();
    }, 500);
}

// Show completion modal
function showCompletionModal() {
    const completionModal = document.createElement('div');
    completionModal.id = 'completionModal';
    completionModal.className = 'modal';
    completionModal.innerHTML = `
        <div class="modal-content completion-modal">
            <div class="completion-content">
                <div class="success-animation">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Document Signed Successfully!</h2>
                <p>Your document has been signed and is now legally binding.</p>
                <div class="completion-actions">
                    <button class="btn-primary" id="downloadDocumentBtn">
                        <i class="fas fa-download"></i>
                        Download Signed Document
                    </button>
                    <button class="btn-secondary" id="returnToDashboardBtn">
                        <i class="fas fa-home"></i>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(completionModal);
    
    // Add event listeners after modal is created
    setTimeout(() => {
        const downloadBtn = document.getElementById('downloadDocumentBtn');
        const returnBtn = document.getElementById('returnToDashboardBtn');
        
        if (downloadBtn) downloadBtn.addEventListener('click', downloadDocument);
        if (returnBtn) returnBtn.addEventListener('click', closeCompletionModal);
    }, 100);
    
    openModal('completionModal');
}

// Close completion modal
function closeCompletionModal() {
    const modal = document.getElementById('completionModal');
    if (modal) {
        closeModal('completionModal');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Download document (demo)
function downloadDocument() {
    showNotification('Downloading signed document...', 'info');
    // In a real application, this would trigger an actual download
    setTimeout(() => {
        showNotification('Document downloaded successfully!', 'success');
        closeCompletionModal();
    }, 2000);
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add event listener for close button
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    // Update navigation to show user is logged in
    const signupBtn = document.querySelector('.btn-signup');
    const loginBtn = document.querySelector('.btn-login');
    
    if (signupBtn && loginBtn) {
        // Replace login/signup buttons with user menu
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <span class="user-name">Welcome, ${user.name}</span>
            <button class="btn-logout" id="logoutBtn">Logout</button>
        `;
        
        // Add event listener for logout button
        setTimeout(() => {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }
        }, 100);
        
        signupBtn.parentNode.replaceChild(userMenu, signupBtn);
        loginBtn.style.display = 'none';
    }
    
    // Show dashboard instead of landing page
    showDashboard(user);
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    showNotification('Logged out successfully!', 'success');
    
    // Remove dashboard and restore original content
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        dashboard.remove();
    }
    
    // Show all main sections again
    const sectionsToShow = ['hero', 'features', 'how-it-works', 'pricing', 'contact'];
    sectionsToShow.forEach(sectionId => {
        const section = document.getElementById(sectionId) || document.querySelector(`.${sectionId}`);
        if (section) {
            section.style.display = '';
        }
    });
    
    // Reload the page to reset UI completely
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Show dashboard for logged in users
function showDashboard(user) {
    // Hide all main sections
    const sectionsToHide = ['hero', 'features', 'how-it-works', 'pricing', 'contact'];
    sectionsToHide.forEach(sectionId => {
        const section = document.getElementById(sectionId) || document.querySelector(`.${sectionId}`);
        if (section) {
            section.style.display = 'none';
        }
    });
    
    // Create dashboard container
    const dashboardContainer = document.createElement('div');
    dashboardContainer.id = 'dashboard';
    dashboardContainer.className = 'dashboard-container';
    
    dashboardContainer.innerHTML = `
        <div class="dashboard-header">
            <h1>Welcome back, ${user.name}!</h1>
            <p>Manage your documents and signatures from your personal dashboard</p>
        </div>
        
        <div class="dashboard-stats">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-file-signature"></i>
                </div>
                <div class="stat-info">
                    <h3>0</h3>
                    <p>Documents Signed</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-info">
                    <h3>0</h3>
                    <p>Pending Signatures</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-info">
                    <h3>0</h3>
                    <p>Completed</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h3>0</h3>
                    <p>Collaborators</p>
                </div>
            </div>
        </div>
        
        <div class="dashboard-actions">
            <div class="action-card">
                <div class="action-icon">
                    <i class="fas fa-upload"></i>
                </div>
                <h3>Upload Document</h3>
                <p>Upload a new document to get signatures</p>
                <button class="btn-action" id="dashboardUploadBtn">Start</button>
            </div>
            <div class="action-card">
                <div class="action-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <h3>Create from Template</h3>
                <p>Use pre-built templates for common documents</p>
                <button class="btn-action" id="dashboardTemplatesBtn">Browse Templates</button>
            </div>
            <div class="action-card">
                <div class="action-icon">
                    <i class="fas fa-history"></i>
                </div>
                <h3>Recent Documents</h3>
                <p>View and manage your recent documents</p>
                <button class="btn-action" id="dashboardRecentBtn">View All</button>
            </div>
        </div>
        
        <div class="dashboard-recent">
            <h2>Recent Activity</h2>
            <div class="recent-list">
                <div class="recent-item empty">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No recent activity</h3>
                        <p>Start by uploading your first document or creating one from a template.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert dashboard after navbar
    const navbar = document.querySelector('.navbar');
    navbar.insertAdjacentElement('afterend', dashboardContainer);
    
    // Add event listeners for dashboard action buttons
    setTimeout(() => {
        const uploadBtn = document.getElementById('dashboardUploadBtn');
        const templatesBtn = document.getElementById('dashboardTemplatesBtn');
        const recentBtn = document.getElementById('dashboardRecentBtn');
        
        if (uploadBtn) uploadBtn.addEventListener('click', startDocumentUpload);
        if (templatesBtn) templatesBtn.addEventListener('click', showTemplates);
        if (recentBtn) recentBtn.addEventListener('click', showRecentDocuments);
    }, 100);
}

// Dashboard action functions
function startDocumentUpload() {
    // Open agreements page in new tab
    window.open('agreements.html', '_blank');
}

function showTemplates() {
    // Create templates modal
    const templatesModal = document.createElement('div');
    templatesModal.className = 'modal';
    templatesModal.id = 'templatesModal';
    templatesModal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="templatesModalClose">&times;</span>
            <h2>Document Templates</h2>
            <div class="templates-grid">
                <div class="template-card" id="contractTemplate" data-template="contract">
                    <i class="fas fa-file-contract"></i>
                    <h3>Contract Template</h3>
                    <p>Standard business contract template</p>
                </div>
                <div class="template-card" id="invoiceTemplate" data-template="invoice">
                    <i class="fas fa-file-invoice"></i>
                    <h3>Invoice Template</h3>
                    <p>Professional invoice template</p>
                </div>
                <div class="template-card" id="agreementTemplate" data-template="agreement">
                    <i class="fas fa-handshake"></i>
                    <h3>Agreement Template</h3>
                    <p>Legal agreement template</p>
                </div>
                <div class="template-card" id="ndaTemplate" data-template="nda">
                    <i class="fas fa-user-secret"></i>
                    <h3>NDA Template</h3>
                    <p>Non-disclosure agreement template</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(templatesModal);
    
    // Add event listeners for template cards and close button
    setTimeout(() => {
        const closeBtn = document.getElementById('templatesModalClose');
        const templateCards = document.querySelectorAll('.template-card[data-template]');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal('templatesModal'));
        }
        
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                const templateType = card.getAttribute('data-template');
                useTemplate(templateType);
            });
        });
    }, 100);
    
    openModal('templatesModal');
}

function showRecentDocuments() {
    // Create recent documents modal
    const recentModal = document.createElement('div');
    recentModal.className = 'modal';
    recentModal.id = 'recentModal';
    recentModal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="recentModalClose">&times;</span>
            <h2>Recent Documents</h2>
            <div class="recent-documents-list">
                <div class="document-item">
                    <i class="fas fa-file-pdf"></i>
                    <div class="document-info">
                        <h4>Contract_2024.pdf</h4>
                        <p>Last modified: 2 hours ago</p>
                    </div>
                    <div class="document-actions">
                        <button class="btn-small" id="viewContract2024" data-doc="contract_2024">View</button>
                        <button class="btn-small" id="downloadContract2024" data-doc="contract_2024">Download</button>
                    </div>
                </div>
                <div class="document-item">
                    <i class="fas fa-file-word"></i>
                    <div class="document-info">
                        <h4>Agreement_Draft.docx</h4>
                        <p>Last modified: 1 day ago</p>
                    </div>
                    <div class="document-actions">
                        <button class="btn-small" id="viewAgreementDraft" data-doc="agreement_draft">View</button>
                        <button class="btn-small" id="downloadAgreementDraft" data-doc="agreement_draft">Download</button>
                    </div>
                </div>
                <div class="document-item">
                    <i class="fas fa-file-pdf"></i>
                    <div class="document-info">
                        <h4>Invoice_001.pdf</h4>
                        <p>Last modified: 3 days ago</p>
                    </div>
                    <div class="document-actions">
                        <button class="btn-small" id="viewInvoice001" data-doc="invoice_001">View</button>
                        <button class="btn-small" id="downloadInvoice001" data-doc="invoice_001">Download</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(recentModal);
    
    // Add event listeners for recent documents modal
    setTimeout(() => {
        const closeBtn = document.getElementById('recentModalClose');
        const viewButtons = document.querySelectorAll('.btn-small[id^="view"]');
        const downloadButtons = document.querySelectorAll('.btn-small[id^="download"]');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal('recentModal'));
        }
        
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = btn.getAttribute('data-doc');
                viewDocument(docId);
            });
        });
        
        downloadButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const docId = btn.getAttribute('data-doc');
                downloadDocument(docId);
            });
        });
    }, 100);
    
    openModal('recentModal');
}

// Template and document functions
function useTemplate(templateType) {
    closeModal('templatesModal');
    showNotification(`Using ${templateType} template...`, 'success');
    // Here you would typically load the template
    setTimeout(() => {
        showNotification('Template loaded! You can now edit and sign.', 'success');
    }, 1500);
}

function viewDocument(docId) {
    showNotification(`Opening document: ${docId}`, 'info');
    // Here you would typically open the document viewer
}

function downloadDocument(docId) {
    showNotification(`Downloading document: ${docId}`, 'success');
    // Here you would typically trigger the download
}

// Demo modal function
function showDemoModal() {
    const demoModal = document.createElement('div');
    demoModal.className = 'modal';
    demoModal.id = 'demoModal';
    demoModal.innerHTML = `
        <div class="modal-content demo-modal">
            <span class="close" id="demoModalClose">&times;</span>
            <h2>QuickSign Pro Demo</h2>
            <div class="demo-content">
                <div class="demo-video">
                    <div class="video-placeholder">
                        <i class="fas fa-play-circle"></i>
                        <p>Interactive Demo</p>
                    </div>
                </div>
                <div class="demo-features">
                    <h3>See QuickSign Pro in Action</h3>
                    <ul>
                        <li><i class="fas fa-check"></i> Upload and prepare documents</li>
                        <li><i class="fas fa-check"></i> Add signature fields and recipients</li>
                        <li><i class="fas fa-check"></i> Send for electronic signatures</li>
                        <li><i class="fas fa-check"></i> Track progress in real-time</li>
                        <li><i class="fas fa-check"></i> Download completed documents</li>
                    </ul>
                    <button class="btn-primary" id="startInteractiveDemoBtn">Try Interactive Demo</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(demoModal);
    
    // Add event listeners for demo modal
    setTimeout(() => {
        const closeBtn = document.getElementById('demoModalClose');
        const startDemoBtn = document.getElementById('startInteractiveDemoBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal('demoModal'));
        }
        if (startDemoBtn) {
            startDemoBtn.addEventListener('click', startInteractiveDemo);
        }
    }, 100);
    
    openModal('demoModal');
}

// Interactive demo function
function startInteractiveDemo() {
    closeModal('demoModal');
    showNotification('Starting interactive demo...', 'info');
    setTimeout(() => {
        openSigningInterface();
        showNotification('This is a demo of our signing interface!', 'success');
    }, 1000);
}

// Pricing selection handler
function handlePricingSelection(planName) {
    const token = localStorage.getItem('token');
    if (!token) {
        // User not logged in, show signup modal
        openModal('signupModal');
        showNotification(`Please sign up to select the ${planName} plan`, 'info');
    } else {
        // User logged in, show plan selection confirmation
        showPlanSelectionModal(planName);
    }
}

// Plan selection modal
function showPlanSelectionModal(planName) {
    const planModal = document.createElement('div');
    planModal.className = 'modal';
    planModal.id = 'planModal';
    planModal.innerHTML = `
        <div class="modal-content plan-modal">
            <span class="close" id="planModalClose">&times;</span>
            <h2>Upgrade to ${planName}</h2>
            <div class="plan-confirmation">
                <div class="plan-details">
                    <h3>${planName} Plan Selected</h3>
                    <p>You've selected the ${planName} plan. This will give you access to enhanced features and capabilities.</p>
                    <div class="plan-benefits">
                        ${getPlanBenefits(planName)}
                    </div>
                </div>
                <div class="plan-actions">
                    <button class="btn-primary" id="confirmUpgradeBtn" data-plan="${planName}">Confirm Upgrade</button>
                    <button class="btn-secondary" id="cancelUpgradeBtn">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(planModal);
    
    // Add event listeners for plan modal
    setTimeout(() => {
        const closeBtn = document.getElementById('planModalClose');
        const confirmBtn = document.getElementById('confirmUpgradeBtn');
        const cancelBtn = document.getElementById('cancelUpgradeBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal('planModal'));
        }
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const plan = confirmBtn.getAttribute('data-plan');
                confirmPlanUpgrade(plan);
            });
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => closeModal('planModal'));
        }
    }, 100);
    
    openModal('planModal');
}

// Get plan benefits
function getPlanBenefits(planName) {
    const benefits = {
        'Free': '<ul><li>3 documents per month</li><li>Basic templates</li><li>Email support</li></ul>',
        'Professional': '<ul><li>Unlimited documents</li><li>Advanced templates</li><li>Priority support</li><li>API access</li></ul>',
        'Enterprise': '<ul><li>Unlimited everything</li><li>Custom branding</li><li>Dedicated support</li><li>Advanced analytics</li></ul>'
    };
    return benefits[planName] || '<p>Plan details coming soon!</p>';
}

// Confirm plan upgrade
function confirmPlanUpgrade(planName) {
    closeModal('planModal');
    showNotification(`Successfully upgraded to ${planName} plan!`, 'success');
    // Here you would typically handle the actual plan upgrade
}

// Check if user is already logged in on page load
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');
    
    if (token && userName) {
        updateUIForLoggedInUser({ name: userName });
    }
}

// Show email verification modal
function showEmailVerificationModal(email) {
    const verificationModal = document.createElement('div');
    verificationModal.id = 'verificationModal';
    verificationModal.className = 'modal';
    verificationModal.innerHTML = `
        <div class="modal-content verification-modal">
            <span class="close" id="verificationModalClose">&times;</span>
            <h2>Check your email</h2>
            <p>A temporary confirmation code was sent to <strong>${email}</strong></p>
            <form class="verification-form" id="verificationForm">
                <div class="form-group">
                    <label for="verificationCode">6 Digit Verification Code *</label>
                    <input type="text" id="verificationCode" name="verificationCode" 
                           placeholder="Enter 6-digit code" maxlength="6" required>
                </div>
                <button type="submit" class="btn-auth">Verify Email</button>
            </form>
            <div class="verification-actions">
                <a href="#" id="resendCode">Send my code again</a> | 
                <a href="#" id="useAnotherEmail">Use a different email address</a>
            </div>
        </div>
    `;
    
    document.body.appendChild(verificationModal);
    openModal('verificationModal');
    
    // Add event listeners
    const closeBtn = verificationModal.querySelector('#verificationModalClose');
    const resendBtn = verificationModal.querySelector('#resendCode');
    const useAnotherBtn = verificationModal.querySelector('#useAnotherEmail');
    const verificationForm = verificationModal.querySelector('#verificationForm');
    
    closeBtn.addEventListener('click', () => closeVerificationModal());
    resendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resendVerificationCode(email);
    });
    useAnotherBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeVerificationModal();
        setTimeout(() => openModal('signupModal'), 300);
    });
    
    verificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = verificationForm.querySelector('#verificationCode').value;
        await verifyEmailCode(email, code);
    });
}

// Close verification modal
function closeVerificationModal() {
    const modal = document.getElementById('verificationModal');
    if (modal) {
        closeModal('verificationModal');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Verify email code
async function verifyEmailCode(email, code) {
    if (!code || code.length !== 6) {
        showNotification('Please enter a valid 6-digit code', 'error');
        return;
    }
    
    showNotification('Verifying code...', 'info');
    
    try {
        const response = await fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                verificationCode: code
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Email verified successfully!', 'success');
            // Store the token for future requests
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userName', data.user.fullName);
            closeVerificationModal();
            // Update UI to show logged in state
            updateUIForLoggedInUser(data.user);
        } else {
            showNotification(data.error || 'Verification failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Verification error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    }
}

// Resend verification code
async function resendVerificationCode(email) {
    showNotification('Sending new code...', 'info');
    
    try {
        const response = await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('New verification code sent!', 'success');
        } else {
            showNotification(data.error || 'Failed to resend code. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Resend error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    }
}



// Setup all event listeners
function setupEventListeners() {
    // Navigation buttons
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', () => openModal('loginModal'));
    if (signupBtn) signupBtn.addEventListener('click', () => openModal('signupModal'));
    
    // Modal close buttons
    const loginModalClose = document.getElementById('loginModalClose');
    const signupModalClose = document.getElementById('signupModalClose');
    const uploadModalClose = document.getElementById('uploadModalClose');
    
    if (loginModalClose) loginModalClose.addEventListener('click', () => closeModal('loginModal'));
    if (signupModalClose) signupModalClose.addEventListener('click', () => closeModal('signupModal'));
    if (uploadModalClose) uploadModalClose.addEventListener('click', () => closeModal('uploadModal'));
    
    // Modal switch links
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');
    
    if (switchToSignup) switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        switchModal('loginModal', 'signupModal');
    });
    if (switchToLogin) switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchModal('signupModal', 'loginModal');
    });
    
    // Browse files button is now handled in initializeUploadFunctionality()
    
    // Start button in hero section
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', () => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            // User is logged in, open agreements page in new tab
            window.open('agreements.html', '_blank');
        } else {
            // User not logged in, open signup modal
            openModal('signupModal');
        }
    });
    
    // Watch Demo button
    const watchDemoBtn = document.querySelector('.btn-secondary');
    if (watchDemoBtn && watchDemoBtn.textContent.includes('Watch Demo')) {
        watchDemoBtn.addEventListener('click', () => {
            showDemoModal();
        });
    }
    
    // Pricing buttons
    const pricingButtons = document.querySelectorAll('.btn-pricing');
    pricingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planName = e.target.closest('.pricing-card').querySelector('h3').textContent;
            handlePricingSelection(planName);
        });
    });
}

// Form submissions
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Add event listeners for all buttons
    setupEventListeners();
    // Login form
    const loginForm = document.querySelector('#loginModal .auth-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            
            if (email && password) {
                showNotification('Logging in...', 'info');
                
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showNotification('Login successful!', 'success');
                        // Store the token for future requests
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('userName', data.user.fullName);
                        loginForm.reset();
                        closeModal('loginModal');
                        // Update UI to show logged in state
                        updateUIForLoggedInUser(data.user);
                    } else {
                        showNotification(data.message || 'Login failed. Please check your credentials.', 'error');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    showNotification('Network error. Please check your connection and try again.', 'error');
                }
            } else {
                showNotification('Please fill in all fields!', 'error');
            }
        });
    }
    
    // Signup form
    const signupForm = document.querySelector('#signupModal .auth-form');
    console.log('Signup form found:', signupForm);
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            console.log('Signup form submitted');
            e.preventDefault();
            const inputs = signupForm.querySelectorAll('input');
            const values = Array.from(inputs).map(input => input.value);
            console.log('Form values:', values);
            
            if (values.every(value => value.trim() !== '')) {
                const fullName = inputs[0].value;
                const email = inputs[1].value;
                const password = inputs[2].value;
                const confirmPassword = inputs[3].value;
                
                if (password !== confirmPassword) {
                    showNotification('Passwords do not match!', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showNotification('Password must be at least 6 characters long!', 'error');
                    return;
                }
                
                showNotification('Creating account...', 'info');
                
                try {
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            fullName: fullName,
                            email: email,
                            password: password
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        if (data.requiresVerification) {
                            showNotification('Verification code sent to your email!', 'success');
                            signupForm.reset();
                            closeModal('signupModal');
                            // Show email verification modal
                            setTimeout(() => {
                                showEmailVerificationModal(data.email);
                            }, 500);
                        } else if (data.token && data.user) {
                            // Direct registration successful (no email verification needed)
                            showNotification(data.message || 'Account created successfully!', 'success');
                            // Store the token for future requests
                            localStorage.setItem('authToken', data.token);
                            localStorage.setItem('userName', data.user.fullName);
                            signupForm.reset();
                            closeModal('signupModal');
                            // Update UI to show logged in state
                            updateUIForLoggedInUser(data.user);
                        } else {
                            showNotification('Account created successfully!', 'success');
                            signupForm.reset();
                            closeModal('signupModal');
                            setTimeout(() => {
                                openModal('loginModal');
                            }, 1000);
                        }
                    } else {
                        showNotification(data.error || 'Registration failed. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Registration error:', error);
                    showNotification('Network error. Please check your connection and try again.', 'error');
                }
            } else {
                showNotification('Please fill in all fields!', 'error');
            }
        });
    }
});

// Initialize signature pad when signing modal opens
document.addEventListener('click', (e) => {
    if (e.target.textContent === 'Proceed to Signing') {
        setTimeout(() => {
            initSignaturePad();
        }, 500);
    }
});

// Add CSS for additional components
const additionalCSS = `
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
        background: linear-gradient(90deg, #4f46e5, #7c3aed);
        border-radius: 4px;
        transition: width 0.3s ease;
        width: 0%;
    }
    
    .upload-success, .upload-progress {
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
    
    .signing-modal {
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .document-viewer {
        background: #f8faff;
        border-radius: 10px;
        padding: 30px;
        margin-bottom: 20px;
    }
    
    .signature-pad {
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        padding: 10px;
        margin-top: 10px;
    }
    
    .signature-pad canvas {
        border: 1px dashed #d1d5db;
        border-radius: 5px;
        cursor: crosshair;
        width: 100%;
        max-width: 400px;
    }
    
    .signature-controls {
        display: flex;
        gap: 10px;
        margin-top: 10px;
        justify-content: center;
    }
    
    .btn-clear, .btn-save {
        padding: 8px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.9rem;
    }
    
    .btn-clear {
        background: #ef4444;
        color: white;
    }
    
    .btn-save {
        background: #10b981;
        color: white;
    }
    
    .signing-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
    }
    
    .completion-modal {
        text-align: center;
        max-width: 500px;
    }
    
    .success-animation {
        font-size: 5rem;
        color: #10b981;
        margin-bottom: 20px;
        animation: bounceIn 0.6s ease;
    }
    
    @keyframes bounceIn {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .completion-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-top: 30px;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        padding: 15px 20px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 3000;
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

    .verification-modal {
        max-width: 500px;
        text-align: center;
    }

    .verification-modal h2 {
        color: #333;
        margin-bottom: 15px;
    }

    .verification-modal p {
        color: #666;
        margin-bottom: 25px;
        line-height: 1.5;
    }

    .verification-form {
        margin-bottom: 20px;
    }

    .verification-form .form-group {
        margin-bottom: 20px;
    }

    .verification-form input[type="text"] {
        width: 100%;
        padding: 12px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 16px;
        text-align: center;
        letter-spacing: 2px;
        font-weight: bold;
    }

    .verification-form input[type="text"]:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .verification-actions {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
    }

    .verification-actions a {
        color: #4f46e5;
        text-decoration: none;
        font-size: 14px;
    }

    .verification-actions a:hover {
        text-decoration: underline;
    }

    .dashboard-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px 20px;
    }

    .dashboard-header {
        text-align: center;
        color: white;
        margin-bottom: 40px;
    }

    .dashboard-header h1 {
        font-size: 2.5rem;
        margin-bottom: 10px;
        font-weight: 700;
    }

    .dashboard-header p {
        font-size: 1.1rem;
        opacity: 0.9;
    }

    .dashboard-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
    }

    .stat-card {
        background: white;
        border-radius: 15px;
        padding: 30px;
        display: flex;
        align-items: center;
        gap: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(0,0,0,0.15);
    }

    .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
    }

    .stat-info h3 {
        font-size: 2rem;
        font-weight: 700;
        color: #333;
        margin: 0;
    }

    .stat-info p {
        color: #666;
        margin: 5px 0 0 0;
        font-size: 0.9rem;
    }

    .dashboard-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 25px;
        margin-bottom: 40px;
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
    }

    .action-card {
        background: white;
        border-radius: 15px;
        padding: 30px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .action-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(0,0,0,0.15);
    }

    .action-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2rem;
        margin: 0 auto 20px;
    }

    .action-card h3 {
        color: #333;
        margin-bottom: 10px;
        font-size: 1.3rem;
    }

    .action-card p {
        color: #666;
        margin-bottom: 20px;
        line-height: 1.5;
    }

    .btn-action {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .btn-action:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
    }

    .dashboard-recent {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        border-radius: 15px;
        padding: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .dashboard-recent h2 {
        color: #333;
        margin-bottom: 20px;
        font-size: 1.5rem;
    }

    .recent-list {
        min-height: 200px;
    }

    .recent-item.empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
    }

    .empty-state {
        text-align: center;
        color: #666;
    }

    .empty-state i {
        font-size: 3rem;
        color: #ddd;
        margin-bottom: 15px;
    }

    .empty-state h3 {
        color: #999;
        margin-bottom: 10px;
    }

    .empty-state p {
        color: #bbb;
        line-height: 1.5;
    }

    .templates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }

    .template-card {
        background: #f8faff;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 25px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .template-card:hover {
        border-color: #4f46e5;
        background: #f0f4ff;
        transform: translateY(-2px);
    }

    .template-card i {
        font-size: 2.5rem;
        color: #4f46e5;
        margin-bottom: 15px;
    }

    .template-card h3 {
        color: #333;
        margin-bottom: 8px;
        font-size: 1.1rem;
    }

    .template-card p {
        color: #666;
        font-size: 0.9rem;
        margin: 0;
    }

    .recent-documents-list {
        margin-top: 20px;
    }

    .document-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 10px;
        transition: background 0.3s ease;
    }

    .document-item:hover {
        background: #f8faff;
    }

    .document-item i {
        font-size: 1.5rem;
        color: #4f46e5;
        width: 30px;
    }

    .document-info {
        flex: 1;
    }

    .document-info h4 {
        margin: 0 0 5px 0;
        color: #333;
        font-size: 1rem;
    }

    .document-info p {
        margin: 0;
        color: #666;
        font-size: 0.85rem;
    }

    .document-actions {
        display: flex;
        gap: 8px;
    }

    .btn-small {
        padding: 6px 12px;
        border: 1px solid #4f46e5;
        background: white;
        color: #4f46e5;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.3s ease;
    }

    .btn-small:hover {
         background: #4f46e5;
         color: white;
     }

     .demo-modal {
         max-width: 800px;
     }

     .demo-content {
         display: grid;
         grid-template-columns: 1fr 1fr;
         gap: 30px;
         margin-top: 20px;
     }

     .video-placeholder {
         background: #f3f4f6;
         border: 2px dashed #d1d5db;
         border-radius: 12px;
         padding: 60px 20px;
         text-align: center;
         cursor: pointer;
         transition: all 0.3s ease;
     }

     .video-placeholder:hover {
         background: #e5e7eb;
         border-color: #4f46e5;
     }

     .video-placeholder i {
         font-size: 4rem;
         color: #4f46e5;
         margin-bottom: 15px;
     }

     .video-placeholder p {
         color: #666;
         font-size: 1.1rem;
         margin: 0;
     }

     .demo-features h3 {
         color: #333;
         margin-bottom: 20px;
     }

     .demo-features ul {
         list-style: none;
         padding: 0;
         margin-bottom: 25px;
     }

     .demo-features li {
         display: flex;
         align-items: center;
         gap: 10px;
         margin-bottom: 12px;
         color: #555;
     }

     .demo-features li i {
         color: #10b981;
         font-size: 0.9rem;
     }

     .plan-modal {
         max-width: 600px;
     }

     .plan-confirmation {
         margin-top: 20px;
     }

     .plan-details {
         background: #f8faff;
         padding: 25px;
         border-radius: 12px;
         margin-bottom: 25px;
     }

     .plan-details h3 {
         color: #4f46e5;
         margin-bottom: 10px;
     }

     .plan-details p {
         color: #666;
         margin-bottom: 20px;
     }

     .plan-benefits ul {
         list-style: none;
         padding: 0;
         margin: 0;
     }

     .plan-benefits li {
         padding: 8px 0;
         color: #555;
         border-bottom: 1px solid #e5e7eb;
     }

     .plan-benefits li:last-child {
         border-bottom: none;
     }

     .plan-actions {
         display: flex;
         gap: 15px;
         justify-content: center;
     }

     @media (max-width: 768px) {
         .demo-content {
             grid-template-columns: 1fr;
             gap: 20px;
         }

         .plan-actions {
             flex-direction: column;
         }
     }

     @media (max-width: 768px) {
        .dashboard-container {
            padding: 20px 15px;
        }
        
        .dashboard-header h1 {
            font-size: 2rem;
        }
        
        .dashboard-stats {
            grid-template-columns: 1fr;
        }
        
        .dashboard-actions {
            grid-template-columns: 1fr;
        }
        
        .stat-card, .action-card {
            padding: 20px;
        }
    }

    @keyframes modalSlideOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-50px); }
    }
`;

// Inject additional CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('QuickSign Pro initialized successfully!');
    
    // Add some interactive animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            }
        });
    }, observerOptions);
    
    // Observe feature cards and other elements
    document.querySelectorAll('.feature-card, .step, .pricing-card').forEach(el => {
        observer.observe(el);
    });
});

// Add fade in animation
const fadeInCSS = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const fadeStyleSheet = document.createElement('style');
fadeStyleSheet.textContent = fadeInCSS;
document.head.appendChild(fadeStyleSheet);