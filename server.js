const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const signpdf = require('@signpdf/signpdf').default;
const { pdfAddPlaceholder } = require('@signpdf/placeholder-pdf-lib');
const { P12Signer } = require('@signpdf/signer-p12');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'quicksign-pro-secret-key';

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to check signature status before serving sign.html
app.get('/sign.html', (req, res) => {
    const requestId = req.query.id;
    
    if (!requestId) {
        return res.status(400).send('Request ID is required');
    }
    
    console.log(`🔍 Checking signature status for request ID: ${requestId}`);
    
    // Check if document is already completed
    // In a real application, you would check this from a database
    // For now, we'll check if there's completion data in the system
    
    // Look for any signatures associated with this request
    const documentSignatures = signatures.filter(sig => 
        sig.documentId === requestId || 
        sig.requestId === requestId
    );
    
    // Check if we have a document with this ID that's completed
    const document = documents.find(doc => 
        doc.id === requestId && doc.status === 'completed'
    );
    
    if (document || documentSignatures.length > 0) {
        console.log(`✅ Document ${requestId} is already signed, redirecting to signed view`);
        return res.sendFile(path.join(__dirname, 'signedView.html'));
    }
    
    console.log(`📝 Document ${requestId} is not signed yet, showing signing page`);
    return res.sendFile(path.join(__dirname, 'sign.html'));
});

// Save document completion status (for signature requests)
app.post('/api/signature-requests/:requestId/complete', (req, res) => {
    try {
        const { requestId } = req.params;
        const { signerEmail, signerName, completedAt } = req.body;
        
        if (!requestId) {
            return res.status(400).json({ error: 'Request ID is required' });
        }
        
        // Create a completion record
        const completionRecord = {
            id: uuidv4(),
            requestId,
            signerEmail,
            signerName,
            completedAt: completedAt || new Date().toISOString(),
            status: 'completed'
        };
        
        // Store in signatures array with requestId
        const signature = {
            id: uuidv4(),
            requestId,
            documentId: requestId, // For backward compatibility
            signerEmail,
            signatureData: 'completed', // Mark as completed
            signatureType: 'completion',
            timestamp: completionRecord.completedAt,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        signatures.push(signature);
        
        console.log(`✅ Document completion saved for request ${requestId} by ${signerEmail}`);
        
        res.json({
            message: 'Document completion saved successfully',
            completion: completionRecord
        });
    } catch (error) {
        console.error('Save completion error:', error);
        res.status(500).json({ error: 'Failed to save completion status' });
    }
});

// Check signature request status
app.get('/api/signature-requests/:requestId/status', (req, res) => {
    try {
        const { requestId } = req.params;
        
        if (!requestId) {
            return res.status(400).json({ error: 'Request ID is required' });
        }
        
        // Check for signatures with this requestId
        const requestSignatures = signatures.filter(sig => 
            sig.requestId === requestId || sig.documentId === requestId
        );
        
        // Check for completed documents
        const document = documents.find(doc => 
            doc.id === requestId && doc.status === 'completed'
        );
        
        const isCompleted = requestSignatures.length > 0 || (document && document.status === 'completed');
        
        res.json({
            requestId,
            isCompleted,
            signatures: requestSignatures.length,
            completedAt: document?.completedAt || requestSignatures[0]?.timestamp,
            status: isCompleted ? 'completed' : 'pending'
        });
    } catch (error) {
        console.error('Check status error:', error);
        res.status(500).json({ error: 'Failed to check signature status' });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Load existing documents from uploads directory on startup
function loadExistingDocuments() {
    try {
        const files = fs.readdirSync(uploadsDir);
        console.log(`📁 Found ${files.length} files in uploads directory`);
        
        files.forEach(filename => {
            const filePath = path.join(uploadsDir, filename);
            const stats = fs.statSync(filePath);
            
            // Extract document ID from filename (format: uuid-timestamp.ext)
            const parts = filename.split('-');
            if (parts.length >= 2) {
                const documentId = parts[0];
                const originalName = filename.replace(/^[^-]+-\d+/, '').replace(/^[.-]/, '') || filename;
                
                const document = {
                    id: documentId,
                    originalName: originalName,
                    filename: filename,
                    path: filePath,
                    size: stats.size,
                    mimetype: filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
                    uploadedAt: stats.birthtime.toISOString(),
                    status: 'uploaded',
                    signers: [],
                    signatures: []
                };
                
                documents.push(document);
                console.log(`📄 Loaded document: ${documentId} - ${originalName}`);
            }
        });
        
        console.log(`✅ Loaded ${documents.length} documents from uploads directory`);
    } catch (error) {
        console.error('❌ Error loading existing documents:', error);
    }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Resend verification code endpoint
app.post('/api/auth/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validate input
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Find existing verification data
        const existingVerification = verificationCodes.find(v => v.email === email);
        
        if (!existingVerification) {
            return res.status(404).json({ error: 'No pending verification found for this email' });
        }
        
        // Generate new verification code
        const newVerificationCode = generateVerificationCode();
        const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        
        // Update verification data
        existingVerification.verificationCode = newVerificationCode;
        existingVerification.expiresAt = newExpiresAt;
        
        // Send new verification email
        const emailSent = await sendVerificationEmail(email, newVerificationCode);
        
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send verification email' });
        }
        
        res.status(200).json({
            message: 'New verification code sent to your email'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Email verification endpoint
app.post('/api/auth/verify-email', async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        
        // Validate input
        if (!email || !verificationCode) {
            return res.status(400).json({ error: 'Email and verification code are required' });
        }
        
        // Find verification data
        const verificationData = verificationCodes.find(v => 
            v.email === email && v.verificationCode === verificationCode
        );
        
        if (!verificationData) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }
        
        // Check if code has expired
        if (new Date() > verificationData.expiresAt) {
            // Remove expired verification
            verificationCodes = verificationCodes.filter(v => v.id !== verificationData.id);
            return res.status(400).json({ error: 'Verification code has expired' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(verificationData.password, 10);
        
        // Create user
        const user = {
            id: uuidv4(),
            fullName: verificationData.fullName,
            email: verificationData.email,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            plan: 'free',
            emailVerified: true
        };
        
        users.push(user);
        
        // Remove verification data
        verificationCodes = verificationCodes.filter(v => v.id !== verificationData.id);
        
        // Generate token
        const token = generateToken(user.id);
        
        res.status(201).json({
            message: 'Email verified and user registered successfully',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                plan: user.plan,
                emailVerified: user.emailVerified
            }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// In-memory storage for demo purposes (use a real database in production)
let users = [];
let documents = [];
let signatures = [];
let verificationCodes = []; // Store email verification codes
let signatureRequests = []; // Store signature requests with multiple signers
let signatureFields = []; // Store signature field positions and metadata

// Load existing documents from uploads directory
loadExistingDocuments();

// Enhanced signature request management
const createSignatureRequest = (documentId, requesterId, signers, settings = {}) => {
    const requestId = uuidv4();
    const signatureRequest = {
        id: requestId,
        documentId,
        requesterId,
        signers: signers.map((signer, index) => ({
            id: uuidv4(),
            email: signer.email,
            name: signer.name,
            order: signer.order || index + 1,
            status: 'pending', // pending, signed, declined
            signedAt: null,
            signatureData: null,
            fields: signer.fields || [] // Array of signature field positions
        })),
        settings: {
            requireOrder: settings.requireOrder || false,
            allowDecline: settings.allowDecline !== false,
            expiresAt: settings.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            reminderFrequency: settings.reminderFrequency || 'weekly',
            message: settings.message || '',
            subject: settings.subject || 'Document Signature Required'
        },
        status: 'active', // active, completed, expired, cancelled
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    signatureRequests.push(signatureRequest);
    return signatureRequest;
};

// Get next signer in sequence
const getNextSigner = (requestId) => {
    const request = signatureRequests.find(req => req.id === requestId);
    if (!request || request.status !== 'active') return null;
    
    if (request.settings.requireOrder) {
        // Find the first unsigned signer in order
        return request.signers
            .sort((a, b) => a.order - b.order)
            .find(signer => signer.status === 'pending');
    } else {
        // Return any pending signer
        return request.signers.find(signer => signer.status === 'pending');
    }
};

// Check if signature request is complete
const isSignatureRequestComplete = (requestId) => {
    const request = signatureRequests.find(req => req.id === requestId);
    if (!request) return false;
    
    return request.signers.every(signer => signer.status === 'signed');
};

// Enhanced signature field management
const addSignatureField = (documentId, fieldData) => {
    const fieldId = uuidv4();
    const field = {
        id: fieldId,
        documentId,
        type: fieldData.type || 'signature', // signature, initial, date, text
        position: {
            page: fieldData.page || 1,
            x: fieldData.x || 0,
            y: fieldData.y || 0,
            width: fieldData.width || 200,
            height: fieldData.height || 50
        },
        assignedTo: fieldData.assignedTo || null, // signer email
        required: fieldData.required !== false,
        label: fieldData.label || '',
        placeholder: fieldData.placeholder || '',
        value: null,
        signedAt: null,
        createdAt: new Date().toISOString()
    };
    
    signatureFields.push(field);
    return field;
};

// Get signature fields for document
const getDocumentFields = (documentId, signerEmail = null) => {
    let fields = signatureFields.filter(field => field.documentId === documentId);
    
    if (signerEmail) {
        fields = fields.filter(field => 
            !field.assignedTo || field.assignedTo === signerEmail
        );
    }
    
    return fields;
};

// Initialize admin user if configured
const initializeAdmin = async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && !users.find(user => user.email === adminEmail)) {
        const adminUser = {
            id: uuidv4(),
            fullName: 'System Administrator',
            email: adminEmail,
            password: await bcrypt.hash('admin123', 10), // Default password
            createdAt: new Date().toISOString(),
            plan: 'enterprise',
            emailVerified: true,
            isAdmin: true
        };
        users.push(adminUser);
        console.log(`👑 Admin user created: ${adminEmail} (password: admin123)`);
    }
};

// Call admin initialization
initializeAdmin();

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to other email services
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Test email connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// Generate 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'QuickSign Pro - Email Verification',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to QuickSign Pro!</h2>
                <p>Thank you for signing up. Please use the verification code below to complete your registration:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #007bff; font-size: 32px; margin: 0;">${code}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't create an account with us, please ignore this email.</p>
                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">QuickSign Pro - Digital Document Signing Platform</p>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

// Send signature request email
const sendSignatureRequestEmail = async (recipientEmail, recipientName, signingLink, subject, message, senderName) => {
    try {
        console.log(`📧 Attempting to send signature request email to: ${recipientEmail}`);
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: recipientEmail,
            subject: subject || 'Please DocuSign: Document Signature Required',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; margin: 0;">QuickSign Pro</h1>
                        <p style="color: #666; margin: 5px 0 0 0;">Digital Document Signing Platform</p>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #1f2937; margin: 0 0 15px 0;">Document Signature Request</h2>
                        <p style="margin: 0 0 10px 0;">Hello ${recipientName},</p>
                        <p style="margin: 0 0 15px 0;">${senderName} has sent you a document that requires your signature.</p>
                        ${message ? `<p style="margin: 0 0 15px 0; font-style: italic;">${message}</p>` : ''}
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${signingLink}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review and Sign Document</a>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #92400e;">
                            <strong>Security Notice:</strong> This link is unique to you and should not be shared with others.
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                        <p style="color: #666; font-size: 12px; margin: 0;">If you have any questions about this document, please contact ${senderName}.</p>
                        <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">This email was sent by QuickSign Pro on behalf of ${senderName}.</p>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ Signature request email sent successfully to: ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error(`❌ Signature request email sending error to ${recipientEmail}:`, error);
        return false;
    }
};

// Generate signed PDF document
const generateSignedPDF = async (documentName, signerName, signatureData, originalDocumentPath = null) => {
    try {
        let pdfDoc;
        
        if (originalDocumentPath && fs.existsSync(originalDocumentPath)) {
            // Use the original uploaded PDF file
            const existingPdfBytes = fs.readFileSync(originalDocumentPath);
            pdfDoc = await PDFDocument.load(existingPdfBytes);
        } else {
            // Create a new PDF if original file is not available or not a PDF
            pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            
            // Add document content
            page.drawText(documentName || 'Document', {
                x: 50,
                y: 750,
                size: 16,
                font,
                color: rgb(0, 0, 0),
            });
            
            page.drawText('This document has been digitally signed.', {
                x: 50,
                y: 700,
                size: 12,
                font,
                color: rgb(0, 0, 0),
            });
        }
        
        // Add signature information to the last page
        const pages = pdfDoc.getPages();
        const lastPage = pages[pages.length - 1];
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const { height } = lastPage.getSize();
        
        // Add signature watermark
        lastPage.drawText('DIGITALLY SIGNED', {
            x: 50,
            y: 50,
            size: 10,
            font,
            color: rgb(0.2, 0.7, 0.2),
        });
        
        lastPage.drawText(`Signed by: ${signerName}`, {
            x: 50,
            y: 35,
            size: 8,
            font,
            color: rgb(0, 0, 0),
        });
        
        lastPage.drawText(`Date: ${new Date().toLocaleString()}`, {
            x: 50,
            y: 25,
            size: 8,
            font,
            color: rgb(0, 0, 0),
        });
        
        lastPage.drawText('Verified by QuickSign Pro', {
            x: 50,
            y: 15,
            size: 8,
            font,
            color: rgb(0, 0, 0),
        });
        
        // Return PDF as buffer
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    } catch (error) {
        console.error('PDF generation error:', error);
        return null;
    }
};

// Send completed document notification
const sendCompletedDocumentEmail = async (recipientEmail, recipientName, documentName, senderName, isOriginalSigner = false, signerName = null, documentId = null) => {
    try {
        console.log(`📧 Attempting to send completion notification to: ${recipientEmail} (Original Signer: ${isOriginalSigner})`);
        const subject = isOriginalSigner ? 
            `Document Completed: ${documentName}` : 
            `Copy of Completed Document: ${documentName}`;
            
        // Generate signed PDF for all recipients
        let attachments = [];
        if (signerName) {
            // Find the original document to get its path
            let originalDocumentPath = null;
            if (documentId) {
                const document = documents.find(doc => doc.id === documentId);
                if (document && document.path && document.mimetype === 'application/pdf') {
                    originalDocumentPath = document.path;
                }
            }
            
            const pdfBuffer = await generateSignedPDF(documentName, signerName, null, originalDocumentPath);
            if (pdfBuffer) {
                attachments.push({
                    filename: `${documentName || 'signed-document'}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                });
            }
        }

        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: recipientEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; margin: 0;">QuickSign Pro</h1>
                        <p style="color: #666; margin: 5px 0 0 0;">Digital Document Signing Platform</p>
                    </div>
                    
                    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
                        <h2 style="color: #065f46; margin: 0 0 15px 0;">✅ Document Completed</h2>
                        <p style="margin: 0 0 10px 0;">Hello ${recipientName},</p>
                        <p style="margin: 0 0 15px 0;">
                            ${isOriginalSigner ? 
                                'Thank you for signing the document. All required signatures have been collected.' : 
                                'A document you requested to receive a copy of has been completed.'}
                        </p>
                        <p style="margin: 0; font-weight: bold;">Document: ${documentName}</p>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1f2937; margin: 0 0 15px 0;">Next Steps:</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                            <li>The completed document is now legally binding</li>
                            <li>All parties have received a copy of the signed document</li>
                            <li>The signed PDF is attached to this email</li>
                            <li>You can also download your copy from the signing platform</li>
                        </ul>
                    </div>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                        <p style="color: #666; font-size: 12px; margin: 0;">This document was processed through QuickSign Pro on behalf of ${senderName}.</p>
                        <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">For support, please contact our team or the document sender.</p>
                    </div>
                </div>
            `,
            attachments: attachments
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ Completion notification sent successfully to: ${recipientEmail} (with PDF attachment)`);
        return true;
    } catch (error) {
        console.error(`❌ Completion notification email sending error to ${recipientEmail}:`, error);
        return false;
    }
};

// Utility functions
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const verifyAdmin = (req, res, next) => {
    const user = users.find(u => u.id === req.userId);
    
    if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
};

// Routes

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'QuickSign Pro API'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Server is working!' });
});

app.post('/api/test', (req, res) => {
    console.log('Test POST endpoint hit with body:', req.body);
    res.json({ message: 'POST request received', data: req.body });
});

// User registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        
        // Validate input
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        // Generate verification code
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        
        // Store verification data temporarily
        const verificationData = {
            id: uuidv4(),
            fullName,
            email,
            password,
            verificationCode,
            expiresAt,
            createdAt: new Date().toISOString()
        };
        
        // Remove any existing verification for this email
        verificationCodes = verificationCodes.filter(v => v.email !== email);
        verificationCodes.push(verificationData);
        
        // Check if email is properly configured
        const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS && 
                                 process.env.EMAIL_USER !== 'your-email@gmail.com';
        
        if (isEmailConfigured) {
            // Send verification email
            const emailSent = await sendVerificationEmail(email, verificationCode);
            
            if (!emailSent) {
                console.warn('Email sending failed, falling back to direct registration');
                // Fall back to direct registration
                const hashedPassword = await bcrypt.hash(password, 10);
                const user = {
                    id: uuidv4(),
                    fullName,
                    email,
                    password: hashedPassword,
                    createdAt: new Date().toISOString(),
                    plan: 'free',
                    emailVerified: false // Mark as not verified since email failed
                };
                
                users.push(user);
                const token = generateToken(user.id);
                
                return res.status(201).json({
                    message: 'Account created successfully (email verification skipped due to configuration)',
                    token,
                    user: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        plan: user.plan,
                        emailVerified: user.emailVerified
                    }
                });
            }
            
            res.status(200).json({
                message: 'Verification code sent to your email',
                email: email,
                requiresVerification: true
            });
        } else {
            // Email not configured, register directly
            console.log('Email not configured, registering user directly');
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = {
                id: uuidv4(),
                fullName,
                email,
                password: hashedPassword,
                createdAt: new Date().toISOString(),
                plan: 'free',
                emailVerified: false // Mark as not verified since no email was sent
            };
            
            users.push(user);
            const token = generateToken(user.id);
            
            res.status(201).json({
                message: 'Account created successfully (email verification disabled)',
                token,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    plan: user.plan,
                    emailVerified: user.emailVerified
                }
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Find user
        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = generateToken(user.id);
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                plan: user.plan,
                isAdmin: user.isAdmin || false
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload document
app.post('/api/documents/upload', upload.single('document'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const document = {
            id: uuidv4(),
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadedAt: new Date().toISOString(),
            status: 'uploaded',
            signers: [],
            signatures: []
        };
        
        documents.push(document);
        
        res.json({
            message: 'Document uploaded successfully',
            document: {
                id: document.id,
                originalName: document.originalName,
                size: document.size,
                uploadedAt: document.uploadedAt,
                status: document.status
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Get documents
app.get('/api/documents', verifyToken, (req, res) => {
    try {
        const userDocuments = documents.map(doc => ({
            id: doc.id,
            originalName: doc.originalName,
            size: doc.size,
            uploadedAt: doc.uploadedAt,
            status: doc.status,
            signersCount: doc.signers.length,
            signaturesCount: doc.signatures.length
        }));
        
        res.json({ documents: userDocuments });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to retrieve documents' });
    }
});

// Get specific document
app.get('/api/documents/:id', verifyToken, (req, res) => {
    try {
        const document = documents.find(doc => doc.id === req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        res.json({ document });
    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({ error: 'Failed to retrieve document' });
    }
});

// Get document content for signing (without authentication for signature requests)
app.get('/api/documents/:id/content', (req, res) => {
    try {
        const document = documents.find(doc => doc.id === req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Check if file exists
        if (!fs.existsSync(document.path)) {
            return res.status(404).json({ error: 'Document file not found' });
        }
        
        // For PDF files, we'll serve the file directly
        if (document.mimetype === 'application/pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
            return res.sendFile(path.resolve(document.path));
        }
        
        // For other file types, return document info
        res.json({
            id: document.id,
            originalName: document.originalName,
            mimetype: document.mimetype,
            size: document.size,
            uploadedAt: document.uploadedAt
        });
    } catch (error) {
        console.error('Get document content error:', error);
        res.status(500).json({ error: 'Failed to retrieve document content' });
    }
});

// Add signers to document
app.post('/api/documents/:id/signers', verifyToken, (req, res) => {
    try {
        const { signers } = req.body;
        const document = documents.find(doc => doc.id === req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        if (!Array.isArray(signers) || signers.length === 0) {
            return res.status(400).json({ error: 'Valid signers array is required' });
        }
        
        // Add signers with unique IDs
        const newSigners = signers.map(signer => ({
            id: uuidv4(),
            email: signer.email,
            name: signer.name,
            role: signer.role || 'signer',
            status: 'pending',
            addedAt: new Date().toISOString()
        }));
        
        document.signers = [...document.signers, ...newSigners];
        document.status = 'pending_signatures';
        
        res.json({
            message: 'Signers added successfully',
            signers: newSigners
        });
    } catch (error) {
        console.error('Add signers error:', error);
        res.status(500).json({ error: 'Failed to add signers' });
    }
});

// Save signature
app.post('/api/documents/:id/signatures', (req, res) => {
    try {
        const { signatureData, signerEmail, signatureType = 'drawn', requestId } = req.body;
        const document = documents.find(doc => doc.id === req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        if (!signatureData || !signerEmail) {
            return res.status(400).json({ error: 'Signature data and signer email are required' });
        }
        
        const signature = {
            id: uuidv4(),
            documentId: req.params.id,
            requestId: requestId || req.params.id, // Support both documentId and requestId
            signerEmail,
            signatureData,
            signatureType,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        signatures.push(signature);
        document.signatures.push(signature.id);
        
        console.log(`💾 Signature saved for request ${requestId || req.params.id} by ${signerEmail}`);
        
        // Update signer status
        const signer = document.signers.find(s => s.email === signerEmail);
        if (signer) {
            signer.status = 'signed';
            signer.signedAt = signature.timestamp;
        }
        
        // Check if all signers have signed
        const allSigned = document.signers.every(s => s.status === 'signed');
        if (allSigned) {
            document.status = 'completed';
            document.completedAt = new Date().toISOString();
            console.log(`✅ Document ${requestId || req.params.id} marked as completed`);
        }
        
        res.json({
            message: 'Signature saved successfully',
            signature: {
                id: signature.id,
                timestamp: signature.timestamp,
                documentStatus: document.status
            }
        });
    } catch (error) {
        console.error('Save signature error:', error);
        res.status(500).json({ error: 'Failed to save signature' });
    }
});

// Get document signatures
app.get('/api/documents/:id/signatures', verifyToken, (req, res) => {
    try {
        const documentSignatures = signatures.filter(sig => sig.documentId === req.params.id);
        
        const signatureDetails = documentSignatures.map(sig => ({
            id: sig.id,
            signerEmail: sig.signerEmail,
            signatureType: sig.signatureType,
            timestamp: sig.timestamp
        }));
        
        res.json({ signatures: signatureDetails });
    } catch (error) {
        console.error('Get signatures error:', error);
        res.status(500).json({ error: 'Failed to retrieve signatures' });
    }
});

// Download signed document (placeholder)
app.get('/api/documents/:id/download', verifyToken, (req, res) => {
    try {
        const document = documents.find(doc => doc.id === req.params.id);
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // In a real application, you would generate a PDF with signatures here
        res.download(document.path, `signed-${document.originalName}`);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
});

// Get user profile
app.get('/api/user/profile', verifyToken, (req, res) => {
    try {
        const user = users.find(u => u.id === req.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                plan: user.plan,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to retrieve profile' });
    }
});

// Get dashboard statistics
app.get('/api/dashboard/stats', verifyToken, (req, res) => {
    try {
        const userDocuments = documents.length;
        const completedDocuments = documents.filter(doc => doc.status === 'completed').length;
        const pendingDocuments = documents.filter(doc => doc.status === 'pending_signatures').length;
        const totalSignatures = signatures.length;
        
        res.json({
            stats: {
                totalDocuments: userDocuments,
                completedDocuments,
                pendingDocuments,
                totalSignatures,
                completionRate: userDocuments > 0 ? Math.round((completedDocuments / userDocuments) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
});

// Admin endpoints
// Get all users (admin only)
app.get('/api/admin/users', verifyToken, verifyAdmin, (req, res) => {
    try {
        const userList = users.map(user => ({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            plan: user.plan,
            createdAt: user.createdAt,
            emailVerified: user.emailVerified,
            isAdmin: user.isAdmin || false
        }));
        
        res.json({ users: userList });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to retrieve users' });
    }
});

// Get system statistics (admin only)
app.get('/api/admin/stats', verifyToken, verifyAdmin, (req, res) => {
    try {
        const stats = {
            totalUsers: users.length,
            totalDocuments: documents.length,
            totalSignatures: signatures.length,
            pendingVerifications: verificationCodes.length,
            usersByPlan: {
                free: users.filter(u => u.plan === 'free').length,
                pro: users.filter(u => u.plan === 'pro').length,
                enterprise: users.filter(u => u.plan === 'enterprise').length
            },
            documentsStatus: {
                uploaded: documents.filter(d => d.status === 'uploaded').length,
                pending: documents.filter(d => d.status === 'pending').length,
                completed: documents.filter(d => d.status === 'completed').length
            }
        };
        
        res.json({ stats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', verifyToken, verifyAdmin, (req, res) => {
    try {
        const userId = req.params.id;
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = users[userIndex];
        
        // Prevent admin from deleting themselves
        if (user.id === req.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        // Remove user
        users.splice(userIndex, 1);
        
        // Clean up user's documents and signatures
        documents = documents.filter(d => d.uploadedBy !== userId);
        signatures = signatures.filter(s => s.userId !== userId);
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Update user plan (admin only)
app.put('/api/admin/users/:id/plan', verifyToken, verifyAdmin, (req, res) => {
    try {
        const userId = req.params.id;
        const { plan } = req.body;
        
        if (!['free', 'pro', 'enterprise'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan type' });
        }
        
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.plan = plan;
        
        res.json({ 
            message: 'User plan updated successfully',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                plan: user.plan
            }
        });
    } catch (error) {
        console.error('Update user plan error:', error);
        res.status(500).json({ error: 'Failed to update user plan' });
    }
});

// Send signature request email endpoint
app.post('/api/send-signature-request', async (req, res) => {
    try {
        const { recipients, signingLink, subject, message, senderName, documentName } = req.body;
        
        console.log('📨 Send signature request endpoint called');
        console.log('Recipients received:', recipients);
        console.log('Signing link:', signingLink);
        console.log('Subject:', subject);
        console.log('Sender name:', senderName);
        
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            console.log('❌ No recipients provided');
            return res.status(400).json({ error: 'Recipients array is required' });
        }
        
        if (!signingLink) {
            console.log('❌ No signing link provided');
            return res.status(400).json({ error: 'Signing link is required' });
        }
        
        const signingRecipients = recipients.filter(r => r.role === 'Needs to Sign' || r.role === 'needs-to-sign');
        console.log(`📋 Found ${signingRecipients.length} recipients that need to sign:`, signingRecipients);
        
        const emailPromises = recipients.map(recipient => {
            if (recipient.role === 'Needs to Sign' || recipient.role === 'needs-to-sign') {
                console.log(`📧 Preparing to send email to: ${recipient.email} (${recipient.name})`);
                return sendSignatureRequestEmail(
                    recipient.email,
                    recipient.name,
                    signingLink,
                    subject || `Please DocuSign: ${documentName || 'Document'}`,
                    message,
                    senderName || 'QuickSign Pro User'
                );
            } else {
                console.log(`⏭️ Skipping recipient ${recipient.email} with role: ${recipient.role}`);
            }
            return Promise.resolve(true); // Skip non-signing recipients for now
        });
        
        console.log('⏳ Waiting for all email promises to resolve...');
        const results = await Promise.all(emailPromises);
        console.log('📊 Email sending results:', results);
        
        const failedEmails = results.filter(result => !result).length;
        console.log(`📈 Email sending summary: ${results.length - failedEmails} successful, ${failedEmails} failed`);
        
        if (failedEmails > 0) {
            console.log('❌ Some emails failed to send');
            return res.status(500).json({ 
                error: `Failed to send ${failedEmails} email(s)`,
                partialSuccess: true
            });
        }
        
        console.log('✅ All signature request emails sent successfully');
        res.json({ 
            message: 'Signature request emails sent successfully',
            emailsSent: recipients.filter(r => r.role === 'Needs to Sign' || r.role === 'needs-to-sign').length
        });
    } catch (error) {
        console.error('Send signature request error:', error);
        res.status(500).json({ error: 'Failed to send signature request emails' });
    }
});

// Send completed document notification endpoint
app.post('/api/send-completion-notification', async (req, res) => {
    try {
        const { recipients, documentName, senderName, signerEmail, signerName, documentId } = req.body;
        
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ error: 'Recipients array is required' });
        }
        
        if (!documentName) {
            return res.status(400).json({ error: 'Document name is required' });
        }
        
        const emailPromises = recipients.map(recipient => {
            const isOriginalSigner = recipient.email === signerEmail;
            return sendCompletedDocumentEmail(
                recipient.email,
                recipient.name,
                documentName,
                senderName || 'QuickSign Pro User',
                isOriginalSigner,
                isOriginalSigner ? (signerName || recipient.name) : null,
                documentId
            );
        });
        
        const results = await Promise.all(emailPromises);
        const failedEmails = results.filter(result => !result).length;
        
        if (failedEmails > 0) {
            return res.status(500).json({ 
                error: `Failed to send ${failedEmails} completion notification(s)`,
                partialSuccess: true
            });
        }
        
        res.json({ 
            message: 'Completion notifications sent successfully',
            emailsSent: recipients.length
        });
    } catch (error) {
        console.error('Send completion notification error:', error);
        res.status(500).json({ error: 'Failed to send completion notifications' });
    }
});

// API: Create new signature request with multiple signers
app.post('/api/signature-requests', verifyToken, async (req, res) => {
    try {
        const { documentId, signers, settings } = req.body;
        const requesterId = req.userId;
        
        // Validate document exists
        const document = documents.find(doc => doc.id === documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Validate signers
        if (!signers || !Array.isArray(signers) || signers.length === 0) {
            return res.status(400).json({ error: 'At least one signer is required' });
        }
        
        // Create signature request
        const signatureRequest = createSignatureRequest(documentId, requesterId, signers, settings);
        
        // Send emails to signers
        for (const signer of signatureRequest.signers) {
            if (signatureRequest.settings.requireOrder && signer.order > 1) {
                continue; // Skip sending emails to later signers if order is required
            }
            
            await sendSignatureRequestEmail(
                signer.email,
                signer.name,
                document.originalname,
                req.user.name || req.user.email,
                signatureRequest.id,
                signer.id
            );
        }
        
        res.json({ 
            success: true, 
            signatureRequest: {
                id: signatureRequest.id,
                status: signatureRequest.status,
                signers: signatureRequest.signers.map(s => ({
                    id: s.id,
                    email: s.email,
                    name: s.name,
                    status: s.status,
                    order: s.order
                }))
            }
        });
    } catch (error) {
        console.error('Error creating signature request:', error);
        res.status(500).json({ error: 'Failed to create signature request' });
    }
});

// API: Get signature request details
app.get('/api/signature-requests/:requestId', (req, res) => {
    try {
        const { requestId } = req.params;
        const request = signatureRequests.find(req => req.id === requestId);
        
        if (!request) {
            return res.status(404).json({ error: 'Signature request not found' });
        }
        
        const document = documents.find(doc => doc.id === request.documentId);
        
        res.json({
            success: true,
            request: {
                id: request.id,
                documentId: request.documentId,
                documentName: document?.originalname || 'Unknown Document',
                status: request.status,
                settings: request.settings,
                signers: request.signers.map(s => ({
                    id: s.id,
                    email: s.email,
                    name: s.name,
                    status: s.status,
                    order: s.order,
                    signedAt: s.signedAt
                })),
                createdAt: request.createdAt,
                completedAt: request.completedAt
            }
        });
    } catch (error) {
        console.error('Error fetching signature request:', error);
        res.status(500).json({ error: 'Failed to fetch signature request' });
    }
});

// API: Add signature fields to document
app.post('/api/documents/:documentId/fields', verifyToken, (req, res) => {
    try {
        const { documentId } = req.params;
        const { fields } = req.body;
        
        // Validate document exists
        const document = documents.find(doc => doc.id === documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Add fields
        const addedFields = [];
        for (const fieldData of fields) {
            const field = addSignatureField(documentId, fieldData);
            addedFields.push(field);
        }
        
        res.json({ success: true, fields: addedFields });
    } catch (error) {
        console.error('Error adding signature fields:', error);
        res.status(500).json({ error: 'Failed to add signature fields' });
    }
});

// API: Get document signature fields
app.get('/api/documents/:documentId/fields', (req, res) => {
    try {
        const { documentId } = req.params;
        const { signerEmail } = req.query;
        
        const fields = getDocumentFields(documentId, signerEmail);
        
        res.json({ success: true, fields });
    } catch (error) {
        console.error('Error fetching signature fields:', error);
        res.status(500).json({ error: 'Failed to fetch signature fields' });
    }
});

// API: Sign document field
app.post('/api/signature-requests/:requestId/sign/:signerId', async (req, res) => {
    try {
        const { requestId, signerId } = req.params;
        const { fieldId, signatureData, signerInfo } = req.body;
        
        // Find signature request
        const request = signatureRequests.find(req => req.id === requestId);
        if (!request) {
            return res.status(404).json({ error: 'Signature request not found' });
        }
        
        // Find signer
        const signer = request.signers.find(s => s.id === signerId);
        if (!signer) {
            return res.status(404).json({ error: 'Signer not found' });
        }
        
        // Check if signer can sign (order requirements)
        if (request.settings.requireOrder) {
            const nextSigner = getNextSigner(requestId);
            if (!nextSigner || nextSigner.id !== signerId) {
                return res.status(400).json({ error: 'Not your turn to sign' });
            }
        }
        
        // Update signature field
        const field = signatureFields.find(f => f.id === fieldId);
        if (field) {
            field.value = signatureData;
            field.signedAt = new Date().toISOString();
        }
        
        // Update signer status
        signer.status = 'signed';
        signer.signedAt = new Date().toISOString();
        signer.signatureData = signatureData;
        
        // Check if all signers have signed
        if (isSignatureRequestComplete(requestId)) {
            request.status = 'completed';
            request.completedAt = new Date().toISOString();
            
            // Send completion notifications
            const document = documents.find(doc => doc.id === request.documentId);
            const requester = users.find(user => user.id === request.requesterId);
            
            // Notify all signers and requester
            for (const s of request.signers) {
                await sendCompletedDocumentEmail(
                    s.email,
                    s.name,
                    document?.originalname || 'Document',
                    requester?.name || requester?.email || 'Unknown',
                    false,
                    signer.name,
                    document?.id
                );
            }
            
            // Notify requester
            if (requester) {
                await sendCompletedDocumentEmail(
                    requester.email,
                    requester.name || requester.email,
                    document?.originalname || 'Document',
                    requester.name || requester.email,
                    true,
                    signer.name,
                    document?.id
                );
            }
        } else if (request.settings.requireOrder) {
            // Send email to next signer
            const nextSigner = getNextSigner(requestId);
            if (nextSigner) {
                const document = documents.find(doc => doc.id === request.documentId);
                const requester = users.find(user => user.id === request.requesterId);
                
                await sendSignatureRequestEmail(
                    nextSigner.email,
                    nextSigner.name,
                    document?.originalname || 'Document',
                    requester?.name || requester?.email || 'Unknown',
                    requestId,
                    nextSigner.id
                );
            }
        }
        
        res.json({ 
            success: true, 
            signer: {
                id: signer.id,
                status: signer.status,
                signedAt: signer.signedAt
            },
            requestStatus: request.status
        });
    } catch (error) {
        console.error('Error signing document:', error);
        res.status(500).json({ error: 'Failed to sign document' });
    }
});

// API: Get user's signature requests
app.get('/api/my-signature-requests', verifyToken, (req, res) => {
    try {
        const userId = req.userId;
        
        // Get requests created by user
        const createdRequests = signatureRequests.filter(req => req.requesterId === userId);
        
        // Get requests where user is a signer
        const signingRequests = signatureRequests.filter(req => 
            req.signers.some(signer => signer.email === req.user.email)
        );
        
        res.json({
            success: true,
            created: createdRequests.map(req => {
                const document = documents.find(doc => doc.id === req.documentId);
                return {
                    id: req.id,
                    documentName: document?.originalname || 'Unknown Document',
                    status: req.status,
                    signersCount: req.signers.length,
                    completedSigners: req.signers.filter(s => s.status === 'signed').length,
                    createdAt: req.createdAt,
                    completedAt: req.completedAt
                };
            }),
            signing: signingRequests.map(req => {
                const document = documents.find(doc => doc.id === req.documentId);
                const mySigner = req.signers.find(s => s.email === req.user.email);
                return {
                    id: req.id,
                    documentName: document?.originalname || 'Unknown Document',
                    status: req.status,
                    myStatus: mySigner?.status || 'pending',
                    myOrder: mySigner?.order || 1,
                    canSign: req.settings.requireOrder ? 
                        getNextSigner(req.id)?.id === mySigner?.id : 
                        mySigner?.status === 'pending',
                    createdAt: req.createdAt,
                    signedAt: mySigner?.signedAt
                };
            })
        });
    } catch (error) {
        console.error('Error fetching user signature requests:', error);
        res.status(500).json({ error: 'Failed to fetch signature requests' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 QuickSign Pro server running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`🔒 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

module.exports = app;