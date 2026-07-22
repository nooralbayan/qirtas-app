import express from 'express';
import cors from 'cors';
import { makeWASocket, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';

// New imports for Cloud Architecture
import connectDB from './db.js';
import authRoutes from './routes/auth.js';
import migrationRoutes from './routes/migration.js';
import stateRoutes from './routes/state.js';
import { useMongoDBAuthState } from './mongoAuthState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB
connectDB().then(async () => {
    // Auto-seed admin user
    try {
        const User = (await import('./models/User.js')).default;
        const bcrypt = (await import('bcrypt')).default;
        const adminUser = await User.findOne({ username: 'admin' });
        
        if (adminUser) {
            console.log('ℹ️ Admin user exists. Resetting password to "admin"...');
            // Force reset password bypassing pre-save hook
            await User.updateOne({ username: 'admin' }, { 
                password: await bcrypt.hash('admin', 10),
                role: 'admin'
            });
            console.log('✅ Admin password reset successfully to "admin"');
        } else {
            console.log('ℹ️ Creating default Admin user...');
            const hashed = await bcrypt.hash('admin', 10);
            await User.create({
                username: 'admin',
                password: hashed,
                name: 'مدير النظام',
                role: 'admin',
            });
            console.log('✅ Default Admin created (admin/admin)');
        }
    } catch (err) {
        console.error('❌ Failed to auto-seed admin:', err.message);
    }
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/state', stateRoutes);

// Serve static frontend files in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback all other routes to index.html for React Router
app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
});

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err.message));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

let sock = null;
let currentQR = '';
let isReady = false;
let hasEverConnected = false; // Track if we ever connected successfully

const SESSION_ID = 'qirtas_wa_session';

async function initBaileys() {
    const { state, saveCreds } = await useMongoDBAuthState(SESSION_ID);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        // Reduce reconnection churn
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 2000,
        // Mark as online only when needed
        markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            currentQR = qr;
            // Only show initializing if we've never connected
            if (!hasEverConnected) {
                isReady = false;
            }
            console.log('QR Code generated. Scan to authenticate.');
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log('Connection closed. Status:', statusCode, 'Reconnecting:', shouldReconnect);
            
            if (shouldReconnect) {
                // Keep isReady = true if we were previously connected (just a brief reconnect)
                // Only set to false if we've never been ready
                if (!hasEverConnected) {
                    isReady = false;
                }
                // Wait a bit before reconnecting to avoid rapid reconnection loops
                setTimeout(() => initBaileys(), 3000);
            } else {
                console.log('User logged out. Clearing auth data.');
                isReady = false;
                hasEverConnected = false;
                await mongoose.connection.db.collection('wasessions').deleteMany({ sessionId: SESSION_ID });
                currentQR = '';
                setTimeout(() => initBaileys(), 2000);
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connection opened successfully!');
            isReady = true;
            hasEverConnected = true;
            currentQR = '';
        }
    });
}

initBaileys();

app.get('/api/wa-status', async (req, res) => {
    if (isReady) {
        res.json({ status: 'ready' });
    } else if (currentQR) {
        try {
            const qrCodeDataUrl = await qrcode.toDataURL(currentQR);
            res.json({ status: 'qr', qr: qrCodeDataUrl });
        } catch (err) {
            res.status(500).json({ error: 'Failed to generate QR code image' });
        }
    } else {
        res.json({ status: 'initializing' });
    }
});

app.post('/api/wa-send', async (req, res) => {
    if (!isReady || !sock) {
        return res.status(400).json({ error: 'WhatsApp is not ready' });
    }

    const { phone, message } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
    }

    try {
        let cleanPhone = phone.replace(/\s+/g, '').replace(/\+/g, '').replace(/-/g, '');
        if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.slice(2);
        if (cleanPhone.startsWith('0')) cleanPhone = '218' + cleanPhone.slice(1);
        if (cleanPhone.startsWith('2180')) cleanPhone = '218' + cleanPhone.slice(4);
        if (!cleanPhone.startsWith('218')) cleanPhone = '218' + cleanPhone;

        const jid = `${cleanPhone}@s.whatsapp.net`;
        
        console.log(`Checking registration for ${jid}...`);
        const [result] = await sock.onWhatsApp(jid);
        if (!result || !result.exists) {
            console.log(`Number ${jid} is not registered on WhatsApp!`);
            return res.status(400).json({ error: 'الرقم غير مسجل في واتساب' });
        }

        console.log(`Sending message to ${result.jid}...`);
        await sock.sendMessage(result.jid, { text: message });
        console.log(`Message sent successfully to ${result.jid}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to send message:', err.message);
        res.status(500).json({ error: 'Failed to send message', details: err.message });
    }
});

app.post('/api/wa-send-pdf', async (req, res) => {
    if (!isReady || !sock) {
        return res.status(400).json({ error: 'WhatsApp is not ready' });
    }

    const { phone, pdfBase64, fileName, caption } = req.body;
    if (!phone || !pdfBase64) {
        return res.status(400).json({ error: 'Phone and pdfBase64 are required' });
    }

    try {
        let cleanPhone = phone.replace(/\s+/g, '').replace(/\+/g, '').replace(/-/g, '');
        if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.slice(2);
        if (cleanPhone.startsWith('0')) cleanPhone = '218' + cleanPhone.slice(1);
        if (cleanPhone.startsWith('2180')) cleanPhone = '218' + cleanPhone.slice(4);
        if (!cleanPhone.startsWith('218')) cleanPhone = '218' + cleanPhone;

        const jid = `${cleanPhone}@s.whatsapp.net`;
        
        console.log(`Checking registration for ${jid}...`);
        const [result] = await sock.onWhatsApp(jid);
        if (!result || !result.exists) {
            console.log(`Number ${jid} is not registered on WhatsApp!`);
            return res.status(400).json({ error: 'الرقم غير مسجل في واتساب' });
        }

        console.log(`Sending PDF to ${result.jid}...`);
        // Remove any data URI prefix (e.g., data:application/pdf;filename=generated.pdf;base64,)
        const base64Data = pdfBase64.replace(/^data:.*?;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        await sock.sendMessage(result.jid, { 
            document: buffer, 
            mimetype: 'application/pdf', 
            fileName: fileName || 'document.pdf',
            caption: caption || '' 
        });
        
        console.log(`PDF sent successfully to ${result.jid}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to send PDF:', err.message);
        res.status(500).json({ error: 'Failed to send PDF', details: err.message });
    }
});

app.post('/api/wa-logout', async (req, res) => {
    try {
        if (sock) {
            await sock.logout();
        }
        isReady = false;
        hasEverConnected = false;
        res.json({ success: true });
    } catch (err) {
        isReady = false;
        hasEverConnected = false;
        res.json({ success: true });
    }
});

app.post('/api/wa-reinit', async (req, res) => {
    try {
        if (sock) {
            sock.end(undefined);
        }
        await mongoose.connection.db.collection('wasessions').deleteMany({ sessionId: SESSION_ID });
        isReady = false;
        hasEverConnected = false;
        currentQR = '';
        await initBaileys();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`WhatsApp API Server running on port ${PORT} (Baileys)`));
