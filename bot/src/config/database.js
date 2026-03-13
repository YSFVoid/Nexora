const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

async function connectDatabase() {
  if (isConnected) return;

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('[DB] Connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[DB] MongoDB disconnected. Attempting reconnect...');
  });

  try {
    const dns = require('dns');
    const { promisify } = require('util');
    const resolveSrv = promisify(dns.resolveSrv);
    
    // Force Google DNS for SRV lookups if the default system DNS fails
    dns.setServers(['8.8.8.8', '1.1.1.1']);

    let finalUri = env.MONGODB_URI;

    // Only apply the custom resolution if it's an SRV record
    if (finalUri.startsWith('mongodb+srv://')) {
        try {
            // Extract the hostname part after the credentials and before any query params
            const hostMatch = finalUri.match(/@([^/?]+)/);
            if (hostMatch) {
                const srvHost = `_mongodb._tcp.${hostMatch[1]}`;
                console.log(`[DB] Attempting custom SRV resolution via Google DNS for ${srvHost}...`);
                const records = await resolveSrv(srvHost);
                
                if (records && records.length > 0) {
                    // Reconstruct into a standard mongodb:// string with IP/Hosts directly
                    const directHosts = records.map(r => `${r.name}:${r.port}`).join(',');
                    // Extract credentials and rest of the URL
                    const prefix = finalUri.match(/mongodb\+srv:\/\/(.*?)@/)[1];
                    const suffix = finalUri.includes('?') ? `?${finalUri.split('?')[1]}` : '';
                    
                    finalUri = `mongodb://${prefix}@${directHosts}/${suffix}`;
                    if (finalUri.includes('?')) {
                        finalUri += '&tls=true'; // SRV implies TLS, need to add it manually for direct string
                    } else {
                        finalUri += '?tls=true';
                    }
                    console.log('[DB] Custom DNS resolution successful. Proceeding with direct ReplicaSet connection.');
                }
            }
        } catch (dnsErr) {
             console.warn('[DB] Custom SRV resolution failed:', dnsErr.message);
             console.warn('[DB] Your network provider (ISP/Firewall) is likely completely blocking MongoDB connections. Please use a VPN.');
        }
    }

    await mongoose.connect(finalUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      family: 4,
    });
  } catch (err) {
    console.error('[DB] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

function getConnection() {
  return mongoose.connection;
}

module.exports = { connectDatabase, getConnection };
