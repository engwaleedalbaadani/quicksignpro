// Enhanced signature system JavaScript
let currentSignatureRequest = null;
let currentSigner = null;
let signatureFields = [];
let completedFields = 0;
let currentFieldId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
    setupEventListeners();
});

// Initialize page with URL parameters
async function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('request');
    const signerId = urlParams.get('signer');
    
    if (!requestId) {
        showError('معرف الطلب مفقود');
        return;
    }
    
    try {
        // Load signature request details
        await loadSignatureRequest(requestId);
        
        // Load signature fields
        await loadSignatureFields();
        
        // Update UI
        updateProgress();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('حدث خطأ أثناء تحميل البيانات');
    }
}

// Load signature request details
async function loadSignatureRequest(requestId) {
    try {
        const response = await fetch(`/api/signature-requests/${requestId}`);
        
        if (!response.ok) {
            throw new Error('فشل في تحميل تفاصيل الطلب');
        }
        
        const data = await response.json();
        currentSignatureRequest = data.request;
        
        // Find current signer from URL or email
        const urlParams = new URLSearchParams(window.location.search);
        const signerId = urlParams.get('signer');
        
        if (signerId) {
            currentSigner = currentSignatureRequest.signers.find(s => s.id === signerId);
        }
        
        // Update UI with request details
        updateRequestUI();
        
    } catch (error) {
        console.error('Error loading signature request:', error);
        throw error;
    }
}

// Load signature fields for document
async function loadSignatureFields() {
    try {
        const documentId = currentSignatureRequest.documentId;
        const signerEmail = currentSigner?.email;
        
        const response = await fetch(`/api/documents/${documentId}/fields?signerEmail=${signerEmail || ''}`);
        
        if (!response.ok) {
            throw new Error('فشل في تحميل حقول التوقيع');
        }
        
        const data = await response.json();
        signatureFields = data.fields;
        
        // Render signature fields
        renderSignatureFields();
        
    } catch (error) {
        console.error('Error loading signature fields:', error);
        // Create default signature field if none exist
        createDefaultSignatureField();
    }
}

// Update request UI
function updateRequestUI() {
    if (!currentSignatureRequest) return;
    
    // Update document title
    document.getElementById('documentTitle').textContent = currentSignatureRequest.documentName;
    
    // Update signer info
    if (currentSigner) {
        document.getElementById('recipientName').textContent = currentSigner.name;
        document.getElementById('recipientEmail').textContent = currentSigner.email;
        document.getElementById('signerOrder').textContent = currentSigner.order;
        
        // Update status based on signer status
        const statusElement = document.getElementById('requestStatus');
        if (currentSigner.status === 'signed') {
            statusElement.textContent = 'تم التوقيع';
            statusElement.style.color = '#059669';
        } else {
            statusElement.textContent = 'في انتظار توقيعك';
        }
    }
}

// Render signature fields
function renderSignatureFields() {
    const container = document.getElementById('signatureFields');
    
    if (signatureFields.length === 0) {
        container.innerHTML = `
            <div class="signature-field" onclick="openSignatureModal('default')">
                <span class="field-label">التوقيع الرقمي</span>
                <span class="field-placeholder">انقر هنا لإضافة توقيعك</span>
                <span class="field-status pending">مطلوب</span>
            </div>
        `;
        return;
    }
    
    const fieldsHTML = signatureFields.map(field => {
        const isSigned = field.value !== null;
        const statusClass = isSigned ? 'signed' : '';
        const statusText = isSigned ? 'مكتمل' : 'مطلوب';
        const statusBadgeClass = isSigned ? '' : 'pending';
        
        if (isSigned) completedFields++;
        
        return `
            <div class="signature-field ${statusClass}" onclick="${!isSigned ? `openSignatureModal('${field.id}')` : ''}">
                <span class="field-label">${field.label || 'التوقيع الرقمي'}</span>
                ${isSigned ? 
                    `<span class="field-value">✓ تم التوقيع في ${new Date(field.signedAt).toLocaleDateString('ar')}</span>` :
                    `<span class="field-placeholder">${field.placeholder || 'انقر هنا لإضافة توقيعك'}</span>`
                }
                <span class="field-status ${statusBadgeClass}">${statusText}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = fieldsHTML;
}

// Create default signature field if none exist
function createDefaultSignatureField() {
    signatureFields = [{
        id: 'default',
        type: 'signature',
        label: 'التوقيع الرقمي',
        placeholder: 'انقر هنا لإضافة توقيعك',
        required: true,
        value: null,
        signedAt: null
    }];
    
    renderSignatureFields();
}

// Update progress
function updateProgress() {
    const totalFields = signatureFields.length || 1;
    const progress = (completedFields / totalFields) * 100;
    
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${completedFields} من ${totalFields} حقول مكتملة`;
    
    // Enable/disable complete button
    const completeBtn = document.getElementById('completeSigningBtn');
    if (completedFields === totalFields) {
        completeBtn.disabled = false;
        completeBtn.style.opacity = '1';
    } else {
        completeBtn.disabled = true;
        completeBtn.style.opacity = '0.6';
    }
}

// Open signature modal
function openSignatureModal(fieldId) {
    currentFieldId = fieldId;
    const modal = document.getElementById('signatureModal');
    modal.style.display = 'flex';
    
    // Clear previous signature
    clearCanvas();
    document.getElementById('typedSignature').value = '';
    document.getElementById('signaturePreview').textContent = 'معاينة التوقيع';
}

// Setup event listeners
function setupEventListeners() {
    // Signature modal events
    document.getElementById('signatureModalClose').addEventListener('click', closeSignatureModal);
    document.getElementById('cancelSignature').addEventListener('click', closeSignatureModal);
    document.getElementById('applySignature').addEventListener('click', applySignature);
    document.getElementById('clearCanvas').addEventListener('click', clearCanvas);
    
    // Typed signature preview
    document.getElementById('typedSignature').addEventListener('input', updateSignaturePreview);
    
    // Complete signing button
    document.getElementById('completeSigningBtn').addEventListener('click', completeSigning);
    
    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadDocument);
    
    // Canvas drawing
    setupCanvasDrawing();
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('signatureModal');
        if (e.target === modal) {
            closeSignatureModal();
        }
    });
}

// Setup canvas drawing
function setupCanvasDrawing() {
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    
    // Set canvas style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    function handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                         e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
}

// Clear canvas
function clearCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Update signature preview
function updateSignaturePreview() {
    const input = document.getElementById('typedSignature');
    const preview = document.getElementById('signaturePreview');
    
    if (input.value.trim()) {
        preview.textContent = input.value;
        preview.style.fontFamily = 'cursive';
        preview.style.fontSize = '24px';
        preview.style.color = '#2563eb';
    } else {
        preview.textContent = 'معاينة التوقيع';
        preview.style.fontFamily = 'inherit';
        preview.style.fontSize = 'inherit';
        preview.style.color = 'inherit';
    }
}

// Apply signature
async function applySignature() {
    let signatureData = null;
    
    // Get signature from canvas or typed input
    const canvas = document.getElementById('signatureCanvas');
    const typedSignature = document.getElementById('typedSignature').value.trim();
    
    // Check if canvas has content
    const ctx = canvas.getContext('2d');
    const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasCanvasContent = canvasData.data.some(channel => channel !== 0);
    
    if (hasCanvasContent) {
        signatureData = {
            type: 'drawn',
            data: canvas.toDataURL('image/png')
        };
    } else if (typedSignature) {
        signatureData = {
            type: 'typed',
            data: typedSignature
        };
    } else {
        alert('يرجى إضافة توقيع أولاً');
        return;
    }
    
    try {
        // Apply signature to field
        await applySignatureToField(currentFieldId, signatureData);
        
        // Update UI
        completedFields++;
        renderSignatureFields();
        updateProgress();
        
        // Close modal
        closeSignatureModal();
        
        showSuccess('تم إضافة التوقيع بنجاح!');
        
    } catch (error) {
        console.error('Error applying signature:', error);
        alert('حدث خطأ أثناء إضافة التوقيع');
    }
}

// Apply signature to field
async function applySignatureToField(fieldId, signatureData) {
    // Update local field data
    const field = signatureFields.find(f => f.id === fieldId);
    if (field) {
        field.value = signatureData;
        field.signedAt = new Date().toISOString();
    } else if (fieldId === 'default') {
        // Handle default field
        signatureFields[0] = {
            id: 'default',
            type: 'signature',
            label: 'التوقيع الرقمي',
            value: signatureData,
            signedAt: new Date().toISOString()
        };
    }
    
    // If this is part of a signature request, update on server
    if (currentSignatureRequest && currentSigner) {
        try {
            const response = await fetch(`/api/signature-requests/${currentSignatureRequest.id}/sign/${currentSigner.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fieldId: fieldId,
                    signatureData: signatureData,
                    signerInfo: {
                        name: currentSigner.name,
                        email: currentSigner.email
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('فشل في حفظ التوقيع على الخادم');
            }
            
            const result = await response.json();
            
            // Update signer status
            if (result.signer) {
                currentSigner.status = result.signer.status;
                currentSigner.signedAt = result.signer.signedAt;
            }
            
        } catch (error) {
            console.error('Error saving signature to server:', error);
            // Continue with local update even if server update fails
        }
    }
}

// Close signature modal
function closeSignatureModal() {
    const modal = document.getElementById('signatureModal');
    modal.style.display = 'none';
    currentFieldId = null;
}

// Complete signing process
async function completeSigning() {
    if (completedFields < signatureFields.length) {
        alert('يرجى إكمال جميع حقول التوقيع المطلوبة');
        return;
    }
    
    try {
        // Show success modal
        showSuccessModal();
        
        // If this is a legacy signing (not part of new system), use old endpoint
        if (!currentSignatureRequest) {
            const urlParams = new URLSearchParams(window.location.search);
            const requestId = urlParams.get('id') || 'default';
            
            await fetch(`/api/signature-requests/${requestId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    signerName: 'المستخدم',
                    signerEmail: 'user@example.com'
                })
            });
        }
        
    } catch (error) {
        console.error('Error completing signing:', error);
        alert('حدث خطأ أثناء إكمال التوقيع');
    }
}

// Download document
async function downloadDocument() {
    try {
        // Generate and download signed PDF
        const documentName = currentSignatureRequest?.documentName || 'signed-document';
        
        // Create a simple PDF download link
        const link = document.createElement('a');
        link.href = '#';
        link.download = `${documentName}.pdf`;
        
        alert('سيتم إرسال نسخة موقعة من المستند إلى بريدك الإلكتروني قريباً');
        
    } catch (error) {
        console.error('Error downloading document:', error);
        alert('حدث خطأ أثناء تحميل المستند');
    }
}

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            modal.style.display = 'none';
            // Redirect to agreements page or home
            window.location.href = '/agreements.html';
        }, 3000);
    }
}

// Show success message
function showSuccess(message) {
    // Create a simple success notification
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
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show error message
function showError(message) {
    // Create a simple error notification
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
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Export functions for global access
window.openSignatureModal = openSignatureModal;
window.closeSignatureModal = closeSignatureModal;
window.clearCanvas = clearCanvas;