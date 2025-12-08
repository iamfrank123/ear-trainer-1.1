// ====================================
// Vercel Serverless Function
// Check License API Endpoint
// ====================================

// Lista codici licenza validi (hardcoded per semplicità iniziale)
// In produzione, usare database (Vercel KV, PostgreSQL, etc.)
const VALID_LICENSES = [
    'EAR-DEMO-2025',
    'DEV-MASTER-KEY',
    'EAR-PRO-2024',
    'EAR-PREMIUM-001',
    'EAR-PREMIUM-002',
    'EAR-PREMIUM-003'
];

/**
 * Endpoint: POST /api/checkLicense
 * Body: { license: "CODICE-LICENZA" }
 * Response: { valid: true/false, message: "..." }
 */
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Solo POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            valid: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { license } = req.body;

        // Validazione input
        if (!license || typeof license !== 'string') {
            return res.status(400).json({
                valid: false,
                message: 'Codice licenza mancante o non valido'
            });
        }

        // Normalizza codice
        const cleanLicense = license.trim().toUpperCase();

        // Verifica se licenza è valida
        const isValid = VALID_LICENSES.includes(cleanLicense);

        if (isValid) {
            console.log(`✅ Licenza valida verificata: ${cleanLicense.substring(0, 8)}...`);

            return res.status(200).json({
                valid: true,
                message: 'Licenza valida',
                features: {
                    advancedChords: true,
                    longMelodies: true,
                    statistics: true
                }
            });
        } else {
            console.log(`❌ Licenza non valida: ${cleanLicense.substring(0, 8)}...`);

            return res.status(200).json({
                valid: false,
                message: 'Codice licenza non riconosciuto'
            });
        }
    } catch (error) {
        console.error('Errore verifica licenza:', error);

        return res.status(500).json({
            valid: false,
            message: 'Errore interno del server'
        });
    }
}
