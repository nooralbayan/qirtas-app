import { proto, initAuthCreds, BufferJSON } from '@whiskeysockets/baileys';
import mongoose from 'mongoose';

const WaSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    key: { type: String, required: true },
    data: { type: String, required: true }
});

const WaSession = mongoose.model('WaSession', WaSessionSchema);

export async function useMongoDBAuthState(sessionId) {
    const writeData = async (data, key) => {
        const dataString = JSON.stringify(data, BufferJSON.replacer);
        await WaSession.updateOne({ sessionId, key }, { data: dataString }, { upsert: true });
    };

    const readData = async (key) => {
        const record = await WaSession.findOne({ sessionId, key });
        if (record) {
            return JSON.parse(record.data, BufferJSON.reviver);
        }
        return null;
    };

    const removeData = async (key) => {
        await WaSession.deleteOne({ sessionId, key });
    };

    const creds = await readData('creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async id => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(value, key));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => {
            return writeData(creds, 'creds');
        }
    };
}
