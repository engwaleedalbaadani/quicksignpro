// المتغيرات العامة
let currentZoom = 100;
let currentPage = 1;
let totalPages = 1;
let signatureFields = [];
let currentSignatureField = null;
let isDrawing = false;
let canvas = null;
let ctx = null;

// تهيئة صفحة التوقيع
document.addEventListener('DOMContentLoaded', async function() {
    await initializePage();
    await loadDocumentContent();
    initializeSignatureCanvas();
    setupEventListeners();
    loadRequiredFields();
});

async function initializePage() {
    // الحصول على معرف الطلب من الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id') || window.location.pathname.split('/').pop();
    
    // حفظ معرف الطلب عالمياً
    window.currentRequestId = requestId;
    
    // تحميل بيانات طلب التوقيع
    await loadSignatureRequestData(requestId);
    
    console.log('تم تهيئة صفحة التوقيع للطلب:', requestId);
}

async function loadSignatureRequestData(requestId) {
    try {
        // تحميل بيانات طلب التوقيع المحفوظة
        const storedData = localStorage.getItem(`signature_request_${requestId}`);
        
        if (storedData) {
            const signatureRequestData = JSON.parse(storedData);
            window.signatureRequestData = signatureRequestData;
            
            // تحميل معلومات المستلم
            loadRecipientInfo(signatureRequestData);
            
            // تحديث عنوان المستند إذا كان متاحاً
            if (signatureRequestData.documentName) {
                document.title = `توقيع: ${signatureRequestData.documentName}`;
                const titleElement = document.querySelector('.document-title');
                if (titleElement) {
                    titleElement.textContent = signatureRequestData.documentName;
                }
            }
            
            // تحديث معلومات الموقع
            updateSignerInfo(signatureRequestData);
            
            console.log('تم تحميل بيانات طلب التوقيع:', signatureRequestData);
        } else {
            console.warn('لم يتم العثور على بيانات طلب التوقيع');
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات طلب التوقيع:', error);
    }
}

function loadRecipientInfo(data) {
    // تحديث معلومات المستلم في الواجهة
    const recipientName = data.recipients?.[0]?.name || 'غير محدد';
    const recipientEmail = data.recipients?.[0]?.email || 'غير محدد';
    
    // تحديث عناصر الواجهة
    const nameElements = document.querySelectorAll('.recipient-name');
    const emailElements = document.querySelectorAll('.recipient-email');
    
    nameElements.forEach(el => el.textContent = recipientName);
    emailElements.forEach(el => el.textContent = recipientEmail);
}

function updateSignerInfo(data) {
    const signerName = data.recipients?.[0]?.name || 'الموقع';
    const signerEmail = data.recipients?.[0]?.email || '';
    
    const signerNameEl = document.querySelector('.signer-name');
    const signerEmailEl = document.querySelector('.signer-email');
    
    if (signerNameEl) signerNameEl.textContent = signerName;
    if (signerEmailEl) signerEmailEl.textContent = signerEmail;
}

async function loadDocumentContent() {
    try {
        const requestId = window.currentRequestId;
        if (!requestId) {
            console.error('معرف الطلب غير متاح');
            return;
        }

        // تحميل محتوى المستند
        const response = await fetch(`/api/documents/${requestId}/content`);
        if (!response.ok) {
            throw new Error('فشل في تحميل محتوى المستند');
        }

        const contentType = response.headers.get('content-type');
        const documentContainer = document.querySelector('.document-content');
        
        if (contentType && contentType.includes('application/pdf')) {
            // عرض ملف PDF
            const blob = await response.blob();
            const pdfUrl = URL.createObjectURL(blob);
            
            documentContainer.innerHTML = `
                <iframe src="${pdfUrl}" 
                        type="application/pdf" 
                        width="100%" 
                        height="600px"
                        style="border: none; border-radius: 8px;">
                    <p>متصفحك لا يدعم عرض ملفات PDF. 
                       <a href="${pdfUrl}" target="_blank">انقر هنا لتحميل الملف</a>
                    </p>
                </iframe>
            `;
        } else {
            // عرض محتوى نصي أو HTML
            const content = await response.text();
            documentContainer.innerHTML = `
                <div class="document-text-content">
                    ${content}
                </div>
            `;
        }
        
        // تحميل حقول التوقيع
        await loadSignatureFields();
        
    } catch (error) {
        console.error('خطأ في تحميل محتوى المستند:', error);
        const documentContainer = document.querySelector('.document-content');
        documentContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>حدث خطأ في تحميل المستند</p>
                <button onclick="location.reload()" class="btn btn-primary">إعادة المحاولة</button>
            </div>
        `;
    }
}

async function loadSignatureFields() {
    try {
        const requestId = window.currentRequestId;
        const response = await fetch(`/api/signature-requests/${requestId}/fields`);
        
        if (response.ok) {
            signatureFields = await response.json();
            displaySignatureFields();
        } else {
            // إنشاء حقول افتراضية إذا لم توجد
            signatureFields = [
                {
                    id: 'signature_1',
                    type: 'signature',
                    label: 'التوقيع',
                    required: true,
                    signed: false
                },
                {
                    id: 'date_1',
                    type: 'date',
                    label: 'التاريخ',
                    required: true,
                    signed: false
                }
            ];
            displaySignatureFields();
        }
    } catch (error) {
        console.error('خطأ في تحميل حقول التوقيع:', error);
        // إنشاء حقول افتراضية
        signatureFields = [
            {
                id: 'signature_1',
                type: 'signature',
                label: 'التوقيع',
                required: true,
                signed: false
            }
        ];
        displaySignatureFields();
    }
}

function displaySignatureFields() {
    const container = document.querySelector('.signature-fields-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!signatureFields || signatureFields.length === 0) {
        container.innerHTML = '<p class="no-fields">No signature fields required</p>';
        return;
    }
    
    signatureFields.forEach(field => {
        const fieldElement = createSignatureFieldElement(field);
        container.appendChild(fieldElement);
    });
}

function createSignatureFieldElement(field) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = `signature-field ${field.signed ? 'completed' : ''}`;
    fieldDiv.dataset.fieldId = field.id;
    fieldDiv.dataset.fieldType = field.type;
    
    const icon = getFieldIcon(field.type);
    const description = getFieldDescription(field.type);
    
    fieldDiv.innerHTML = `
        <div class="field-icon">
            <i class="${icon}"></i>
        </div>
        <div class="field-label">${field.label}</div>
        <div class="field-description">${description}</div>
    `;
    
    fieldDiv.addEventListener('click', () => openSignatureModal(field));
    
    return fieldDiv;
}

function getFieldIcon(type) {
    const icons = {
        'signature': 'fas fa-signature',
        'initial': 'fas fa-font',
        'date': 'fas fa-calendar-alt',
        'text': 'fas fa-edit'
    };
    return icons[type] || 'fas fa-pen';
}

function getFieldDescription(type) {
    const descriptions = {
        'signature': 'Click to add your signature',
        'initial': 'Click to add initials',
        'date': 'Click to add date',
        'text': 'Click to add text'
    };
    return descriptions[type] || 'Click to edit';
}

function openSignatureModal(field) {
    currentSignatureField = field;
    const modal = document.querySelector('.signature-modal');
    const modalTitle = modal.querySelector('.signature-modal-header h3');
    
    // تحديث عنوان النافذة المنبثقة
    modalTitle.textContent = field.label;
    
    // إظهار النافذة المنبثقة
    modal.classList.add('active');
    
    // تهيئة اللوحة إذا كان نوع الحقل توقيع
    if (field.type === 'signature' || field.type === 'initial') {
        setTimeout(() => {
            initializeSignatureCanvas();
        }, 100);
    }
    
    // إذا كان نوع الحقل تاريخ، ملء التاريخ الحالي
    if (field.type === 'date') {
        const today = new Date().toLocaleDateString('ar-SA');
        const input = modal.querySelector('#typedSignature');
        if (input) {
            input.value = today;
            input.placeholder = 'أدخل التاريخ';
        }
    }
    
    // إذا كان نوع الحقل نص
    if (field.type === 'text') {
        const input = modal.querySelector('#typedSignature');
        if (input) {
            input.placeholder = 'أدخل النص المطلوب';
        }
    }
}

function closeSignatureModal() {
    const modal = document.querySelector('.signature-modal');
    modal.classList.remove('active');
    currentSignatureField = null;
    
    // مسح اللوحة
    if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // مسح النص المكتوب
    const input = document.querySelector('#typedSignature');
    if (input) {
        input.value = '';
    }
}

function initializeSignatureCanvas() {
    canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    
    // تعيين حجم اللوحة
    canvas.width = 400;
    canvas.height = 200;
    
    // تعيين خصائص الرسم
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // إضافة مستمعي الأحداث
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // دعم اللمس للأجهزة المحمولة
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
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

function clearSignatureCanvas() {
    if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function updateTypedSignature() {
    const input = document.querySelector('#typedSignature');
    const preview = document.querySelector('.signature-preview');
    
    if (input && preview) {
        preview.textContent = input.value || 'معاينة التوقيع';
    }
}

function applySignature() {
    if (!currentSignatureField) return;
    
    let signatureData = null;
    
    // الحصول على بيانات التوقيع حسب النوع
    if (currentSignatureField.type === 'signature' || currentSignatureField.type === 'initial') {
        // التحقق من وجود رسم على اللوحة
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasDrawing = imageData.data.some(pixel => pixel !== 0);
        
        if (hasDrawing) {
            signatureData = canvas.toDataURL();
        } else {
            alert('يرجى رسم التوقيع أولاً');
            return;
        }
    } else {
        // للنص والتاريخ
        const input = document.querySelector('#typedSignature');
        if (input && input.value.trim()) {
            signatureData = input.value.trim();
        } else {
            alert('يرجى إدخال القيمة المطلوبة');
            return;
        }
    }
    
    // حفظ التوقيع
    saveSignature(currentSignatureField.id, signatureData);
    
    // تحديث حالة الحقل
    currentSignatureField.signed = true;
    currentSignatureField.signatureData = signatureData;
    
    // تحديث الواجهة
    updateFieldDisplay(currentSignatureField);
    
    // إغلاق النافذة المنبثقة
    closeSignatureModal();
    
    // التحقق من اكتمال جميع الحقول
    checkCompletionStatus();
}

function saveSignature(fieldId, signatureData) {
    try {
        const requestId = window.currentRequestId;
        const signatures = JSON.parse(localStorage.getItem(`signatures_${requestId}`) || '{}');
        
        signatures[fieldId] = {
            data: signatureData,
            timestamp: new Date().toISOString(),
            type: currentSignatureField.type
        };
        
        localStorage.setItem(`signatures_${requestId}`, JSON.stringify(signatures));
        console.log('تم حفظ التوقيع:', fieldId);
    } catch (error) {
        console.error('خطأ في حفظ التوقيع:', error);
    }
}

function updateFieldDisplay(field) {
    const fieldElement = document.querySelector(`[data-field-id="${field.id}"]`);
    if (fieldElement) {
        fieldElement.classList.add('completed');
    }
}

function checkCompletionStatus() {
    const requiredFields = signatureFields.filter(field => field.required);
    const completedFields = signatureFields.filter(field => field.signed);
    
    if (requiredFields.length === completedFields.length) {
        // جميع الحقول المطلوبة مكتملة
        enableCompleteButton();
    }
}

function enableCompleteButton() {
    const completeBtn = document.querySelector('#completeSigningBtn');
    if (completeBtn) {
        completeBtn.disabled = false;
        completeBtn.textContent = 'إكمال التوقيع';
        completeBtn.classList.add('btn-primary');
        completeBtn.classList.remove('btn-secondary');
    }
}

function completeSigningProcess() {
    // التحقق من اكتمال جميع الحقول المطلوبة
    const requiredFields = signatureFields.filter(field => field.required);
    const completedFields = signatureFields.filter(field => field.signed);
    
    if (requiredFields.length !== completedFields.length) {
        alert('يرجى إكمال جميع الحقول المطلوبة قبل المتابعة');
        return;
    }
    
    // حفظ حالة الإكمال
    const requestId = window.currentRequestId;
    localStorage.setItem(`signing_completed_${requestId}`, 'true');
    
    // إظهار نافذة النجاح
    showSuccessModal();
}

function showSuccessModal() {
    const modal = document.querySelector('.success-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Add fade-in effect
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

function downloadSignedDocument() {
    // تنفيذ تحميل المستند الموقع
    const requestId = window.currentRequestId;
    const downloadUrl = `/api/documents/${requestId}/download-signed`;
    
    // إنشاء رابط تحميل
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `signed_document_${requestId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function setupEventListeners() {
    // إغلاق النوافذ المنبثقة
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('signature-modal-close')) {
            closeSignatureModal();
        }
        
        if (e.target.classList.contains('signature-modal') || 
            e.target.classList.contains('success-modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // أزرار النوافذ المنبثقة
    const applyBtn = document.querySelector('#applySignatureBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', applySignature);
    }
    
    const clearBtn = document.querySelector('#clearCanvasBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSignatureCanvas);
    }
    
    const completeBtn = document.querySelector('#completeSigningBtn');
    if (completeBtn) {
        completeBtn.addEventListener('click', completeSigningProcess);
    }
    
    const downloadBtn = document.querySelector('#downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadSignedDocument);
    }
    
    // تحديث معاينة النص المكتوب
    const typedInput = document.querySelector('#typedSignature');
    if (typedInput) {
        typedInput.addEventListener('input', updateTypedSignature);
    }
    
    // منع إرسال النموذج بالضغط على Enter
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });
}

function loadRequiredFields() {
    // تحميل الحقول المطلوبة من البيانات المحفوظة
    const requestId = window.currentRequestId;
    const savedSignatures = localStorage.getItem(`signatures_${requestId}`);
    
    if (savedSignatures) {
        try {
            const signatures = JSON.parse(savedSignatures);
            
            // تحديث حالة الحقول المحفوظة
            signatureFields.forEach(field => {
                if (signatures[field.id]) {
                    field.signed = true;
                    field.signatureData = signatures[field.id].data;
                }
            });
            
            // تحديث العرض
            displaySignatureFields();
            checkCompletionStatus();
        } catch (error) {
            console.error('خطأ في تحميل التوقيعات المحفوظة:', error);
        }
    }
}

// تصدير الوظائف للاستخدام العام
window.openSignatureModal = openSignatureModal;
window.closeSignatureModal = closeSignatureModal;
window.applySignature = applySignature;
window.clearSignatureCanvas = clearSignatureCanvas;
window.completeSigningProcess = completeSigningProcess;
window.downloadSignedDocument = downloadSignedDocument;