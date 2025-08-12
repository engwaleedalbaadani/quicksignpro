// Signature Manager JavaScript
let currentUser = null;
let signatureRequests = [];
let mySignatureRequests = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
    setupEventListeners();
});

// Initialize page
async function initializePage() {
    try {
        // Check authentication
        await checkAuthentication();
        
        // Load signature requests
        await loadMySignatureRequests();
        
        // Update UI
        updateDashboard();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('حدث خطأ أثناء تحميل البيانات');
    }
}

// Check user authentication
async function checkAuthentication() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }
        
        // Verify token with server
        const response = await fetch('/api/verify-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = '/index.html';
            return;
        }
        
        const data = await response.json();
        currentUser = data.user;
        
        // Update user info in UI
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userEmail').textContent = currentUser.email;
        
    } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    }
}

// Load my signature requests
async function loadMySignatureRequests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/my-signature-requests', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل طلبات التوقيع');
        }
        
        const data = await response.json();
        mySignatureRequests = data.requests || [];
        
        // Render requests
        renderSignatureRequests();
        
    } catch (error) {
        console.error('Error loading signature requests:', error);
        showError('فشل في تحميل طلبات التوقيع');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Create new request button
    document.getElementById('createRequestBtn').addEventListener('click', showCreateRequestModal);
    
    // Modal close buttons
    document.getElementById('createModalClose').addEventListener('click', hideCreateRequestModal);
    document.getElementById('cancelCreateRequest').addEventListener('click', hideCreateRequestModal);
    
    // Create request form
    document.getElementById('createRequestForm').addEventListener('submit', handleCreateRequest);
    
    // Add signer button
    document.getElementById('addSignerBtn').addEventListener('click', addSignerField);
    
    // File upload
    document.getElementById('documentFile').addEventListener('change', handleFileUpload);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('createRequestModal');
        if (e.target === modal) {
            hideCreateRequestModal();
        }
    });
}

// Update dashboard statistics
function updateDashboard() {
    const totalRequests = mySignatureRequests.length;
    const pendingRequests = mySignatureRequests.filter(r => r.status === 'pending').length;
    const completedRequests = mySignatureRequests.filter(r => r.status === 'completed').length;
    const signingRequests = mySignatureRequests.filter(r => r.needsMySignature).length;
    
    document.getElementById('totalRequests').textContent = totalRequests;
    document.getElementById('pendingRequests').textContent = pendingRequests;
    document.getElementById('completedRequests').textContent = completedRequests;
    document.getElementById('signingRequests').textContent = signingRequests;
}

// Render signature requests
function renderSignatureRequests() {
    const createdContainer = document.getElementById('createdRequestsList');
    const signingContainer = document.getElementById('signingRequestsList');
    
    // Filter requests
    const createdRequests = mySignatureRequests.filter(r => r.createdBy === currentUser.email);
    const signingRequests = mySignatureRequests.filter(r => r.needsMySignature);
    
    // Render created requests
    if (createdRequests.length === 0) {
        createdContainer.innerHTML = `
            <div class="empty-state">
                <p>لم تقم بإنشاء أي طلبات توقيع بعد</p>
                <button class="btn btn-primary" onclick="showCreateRequestModal()">إنشاء طلب جديد</button>
            </div>
        `;
    } else {
        createdContainer.innerHTML = createdRequests.map(request => renderRequestCard(request, 'created')).join('');
    }
    
    // Render signing requests
    if (signingRequests.length === 0) {
        signingContainer.innerHTML = `
            <div class="empty-state">
                <p>لا توجد مستندات تحتاج إلى توقيعك</p>
            </div>
        `;
    } else {
        signingContainer.innerHTML = signingRequests.map(request => renderRequestCard(request, 'signing')).join('');
    }
}

// Render request card
function renderRequestCard(request, type) {
    const statusClass = getStatusClass(request.status);
    const statusText = getStatusText(request.status);
    const createdDate = new Date(request.createdAt).toLocaleDateString('ar');
    
    // Calculate progress
    const totalSigners = request.signers.length;
    const signedCount = request.signers.filter(s => s.status === 'signed').length;
    const progress = totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0;
    
    const actions = type === 'created' ? `
        <button class="btn btn-sm btn-outline" onclick="viewRequest('${request.id}')">عرض التفاصيل</button>
        ${request.status === 'pending' ? `<button class="btn btn-sm btn-danger" onclick="cancelRequest('${request.id}')">إلغاء</button>` : ''}
    ` : `
        <button class="btn btn-sm btn-primary" onclick="signDocument('${request.id}')">توقيع المستند</button>
        <button class="btn btn-sm btn-outline" onclick="viewRequest('${request.id}')">عرض التفاصيل</button>
    `;
    
    return `
        <div class="request-card">
            <div class="request-header">
                <h3 class="request-title">${request.documentName}</h3>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            
            <div class="request-info">
                <div class="info-item">
                    <span class="info-label">تاريخ الإنشاء:</span>
                    <span class="info-value">${createdDate}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">عدد الموقعين:</span>
                    <span class="info-value">${totalSigners}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">التقدم:</span>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${signedCount}/${totalSigners}</span>
                    </div>
                </div>
            </div>
            
            <div class="request-actions">
                ${actions}
            </div>
        </div>
    `;
}

// Get status class
function getStatusClass(status) {
    switch (status) {
        case 'completed': return 'status-completed';
        case 'pending': return 'status-pending';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
}

// Get status text
function getStatusText(status) {
    switch (status) {
        case 'completed': return 'مكتمل';
        case 'pending': return 'في الانتظار';
        case 'cancelled': return 'ملغي';
        default: return 'في الانتظار';
    }
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Show create request modal
function showCreateRequestModal() {
    const modal = document.getElementById('createRequestModal');
    modal.style.display = 'flex';
    
    // Reset form
    document.getElementById('createRequestForm').reset();
    document.getElementById('signersContainer').innerHTML = '';
    addSignerField(); // Add first signer field
}

// Hide create request modal
function hideCreateRequestModal() {
    const modal = document.getElementById('createRequestModal');
    modal.style.display = 'none';
}

// Add signer field
function addSignerField() {
    const container = document.getElementById('signersContainer');
    const signerCount = container.children.length + 1;
    
    const signerField = document.createElement('div');
    signerField.className = 'signer-field';
    signerField.innerHTML = `
        <div class="signer-header">
            <h4>الموقع ${signerCount}</h4>
            ${signerCount > 1 ? `<button type="button" class="btn-remove" onclick="removeSignerField(this)">×</button>` : ''}
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>الاسم *</label>
                <input type="text" name="signerName" required>
            </div>
            
            <div class="form-group">
                <label>البريد الإلكتروني *</label>
                <input type="email" name="signerEmail" required>
            </div>
        </div>
        
        <div class="form-group">
            <label>ترتيب التوقيع</label>
            <select name="signerOrder">
                <option value="${signerCount}">الموقع ${signerCount}</option>
            </select>
        </div>
    `;
    
    container.appendChild(signerField);
    updateSignerOrders();
}

// Remove signer field
function removeSignerField(button) {
    const signerField = button.closest('.signer-field');
    signerField.remove();
    updateSignerNumbers();
    updateSignerOrders();
}

// Update signer numbers
function updateSignerNumbers() {
    const signerFields = document.querySelectorAll('.signer-field');
    signerFields.forEach((field, index) => {
        const header = field.querySelector('.signer-header h4');
        header.textContent = `الموقع ${index + 1}`;
    });
}

// Update signer orders
function updateSignerOrders() {
    const signerFields = document.querySelectorAll('.signer-field');
    signerFields.forEach((field, index) => {
        const select = field.querySelector('select[name="signerOrder"]');
        select.innerHTML = '';
        
        for (let i = 1; i <= signerFields.length; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `الموقع ${i}`;
            if (i === index + 1) option.selected = true;
            select.appendChild(option);
        }
    });
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('filePreview');
    
    if (file) {
        preview.innerHTML = `
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
        `;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

// Handle create request
async function handleCreateRequest(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const file = document.getElementById('documentFile').files[0];
    
    if (!file) {
        alert('يرجى اختيار ملف للتوقيع');
        return;
    }
    
    // Collect signers data
    const signers = [];
    const signerFields = document.querySelectorAll('.signer-field');
    
    signerFields.forEach(field => {
        const name = field.querySelector('input[name="signerName"]').value;
        const email = field.querySelector('input[name="signerEmail"]').value;
        const order = parseInt(field.querySelector('select[name="signerOrder"]').value);
        
        signers.push({ name, email, order });
    });
    
    if (signers.length === 0) {
        alert('يرجى إضافة موقع واحد على الأقل');
        return;
    }
    
    try {
        // Show loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'جاري الإنشاء...';
        submitBtn.disabled = true;
        
        // Upload file first
        const uploadFormData = new FormData();
        uploadFormData.append('document', file);
        
        const token = localStorage.getItem('token');
        const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: uploadFormData
        });
        
        if (!uploadResponse.ok) {
            throw new Error('فشل في رفع الملف');
        }
        
        const uploadData = await uploadResponse.json();
        
        // Create signature request
        const requestData = {
            documentId: uploadData.documentId,
            documentName: formData.get('documentName') || file.name,
            message: formData.get('message') || '',
            signers: signers,
            workflow: formData.get('workflow') || 'sequential'
        };
        
        const createResponse = await fetch('/api/signature-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });
        
        if (!createResponse.ok) {
            throw new Error('فشل في إنشاء طلب التوقيع');
        }
        
        const result = await createResponse.json();
        
        // Success
        showSuccess('تم إنشاء طلب التوقيع بنجاح!');
        hideCreateRequestModal();
        
        // Reload requests
        await loadMySignatureRequests();
        updateDashboard();
        
    } catch (error) {
        console.error('Error creating signature request:', error);
        alert('حدث خطأ أثناء إنشاء طلب التوقيع');
    } finally {
        // Reset button
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// View request details
function viewRequest(requestId) {
    // For now, just show an alert
    alert(`عرض تفاصيل الطلب: ${requestId}`);
    // TODO: Implement detailed view modal
}

// Sign document
function signDocument(requestId) {
    const request = mySignatureRequests.find(r => r.id === requestId);
    if (!request) return;
    
    // Find current user's signer info
    const signer = request.signers.find(s => s.email === currentUser.email);
    if (!signer) return;
    
    // Redirect to signing page
    window.location.href = `/sign.html?request=${requestId}&signer=${signer.id}`;
}

// Cancel request
async function cancelRequest(requestId) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/signature-requests/${requestId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في إلغاء الطلب');
        }
        
        showSuccess('تم إلغاء الطلب بنجاح');
        
        // Reload requests
        await loadMySignatureRequests();
        updateDashboard();
        
    } catch (error) {
        console.error('Error cancelling request:', error);
        alert('حدث خطأ أثناء إلغاء الطلب');
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
}

// Show success message
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show error message
function showError(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Export functions for global access
window.showCreateRequestModal = showCreateRequestModal;
window.hideCreateRequestModal = hideCreateRequestModal;
window.addSignerField = addSignerField;
window.removeSignerField = removeSignerField;
window.viewRequest = viewRequest;
window.signDocument = signDocument;
window.cancelRequest = cancelRequest;
window.logout = logout;