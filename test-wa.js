import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, 'server', '.wwebjs_auth') }),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process']
    }
});

client.on('ready', async () => {
    console.log('Client is ready! Testing numbers...');
    
    const nums = ['218914216122', '218927733007'];
    
    for (const num of nums) {
        console.log(`\n--- Testing ${num} ---`);
        try {
            const numberId = await client.getNumberId(num);
            console.log('getNumberId result:', numberId);
            
            const contact = await client.getContactById(`${num}@c.us`);
            console.log('Contact name:', contact.name, 'pushname:', contact.pushname, 'isBusiness:', contact.isBusiness);
            
            const chat = await client.getChatById(`${num}@c.us`);
            console.log('Chat ID:', chat.id._serialized);
            
            // Try sending a ping message
            console.log('Sending message...');
            const msg = await chat.sendMessage('رسالة اختبار من النظام');
            console.log('Message sent! ID:', msg.id.id, 'ack:', msg.ack);
        } catch (e) {
            console.error('Error for', num, e.message);
        }
    }
    
    console.log('\nFinished testing. Exiting in 5 seconds...');
    setTimeout(() => process.exit(0), 5000);
});

client.initialize();
