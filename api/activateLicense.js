// ====================================
// Vercel Serverless Function
// Activate License API Endpoint
// ====================================

// Lista codici licenza validi (identica a checkLicense)
// In produzione: usare database condiviso
const VALID_LICENSES = [
    'EAR-DEMO-2025',
    'DEV-MASTER-KEY',
    'EAR-PRO-2024',
    'EAR-PREMIUM-001',
    'EAR-PREMIUM-002',
    'EAR-PREMIUM-003'
];

/**
 * Endpoint: POST /api/activateLicense
 * Body: { license: "CODICE-LICENZA" }
 * Response: { success: true/false, message: "..." }
 * 
 * Nota: Per semplicità, questo endpoint è identico a checkLicense.
 * In futuro, può essere esteso per:
 * - Registrare attivazione in database
 * - Limitare numero attivazioni per licenza
 * - Tracciare utilizzo
 * - Inviare email di conferma
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
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { license } = req.body;

        // Validazione input
        if (!license || typeof license !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Codice licenza mancante o non valido'
            });
        }

        // Normalizza codice
        const cleanLicense = license.trim().toUpperCase();

        // Verifica se licenza è valida
        const isValid = VALID_LICENSES.includes(cleanLicense);

        if (isValid) {
            console.log(`✅ Licenza attivata: ${cleanLicense.substring(0, 8)}...`);

            // TODO: Salva attivazione in database
            // await db.activations.create({
            //     license: cleanLicense,
            //     timestamp: new Date(),
            //     ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
            // });

            return res.status(200).json({
                success: true,
                message: 'Licenza attivata con successo',
                license: cleanLicense,
                activatedAt: new Date().toISOString()
            });
        } else {
            console.log(`❌ Tentativo attivazione licenza non valida: ${cleanLicense.substring(0, 8)}...`);

            return res.status(200).json({
                success: false,
                message: 'Codice licenza non riconosciuto'
            });
        }
    } catch (error) {
        console.error('Errore attivazione licenza:', error);

        return res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
}
