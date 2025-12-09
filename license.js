// ====================================
// License Manager Module
// Gestione licenze premium
// ====================================

class LicenseManager {
    constructor() {
        this.isActivated = false;
        this.licenseCode = null;
        this.apiBaseUrl = '/api';

        // Features locked per utenti non premium
        this.premiumFeatures = {
            advancedChords: ['elevenths', 'thirteenths'],
            longMelodies: 6, // melodie oltre 6 note
            statistics: true
        };

        // Carica stato licenza da localStorage
        this.loadLicenseFromStorage();
    }

    // ====================================
    // STORAGE MANAGEMENT
    // ====================================

    // Carica licenza da localStorage
    loadLicenseFromStorage() {
        try {
            const stored = localStorage.getItem('eartraining_license');
            if (stored) {
                const data = JSON.parse(stored);
                this.licenseCode = data.code;
                this.isActivated = data.activated;

                console.log('📄 Licenza caricata da storage:', this.isActivated ? 'Premium' : 'Free');
                this.updateUI();
            }
        } catch (error) {
            console.error('Errore caricamento licenza:', error);
            this.clearLicense();
        }
    }

    // Salva licenza in localStorage
    saveLicenseToStorage() {
        try {
            const data = {
                code: this.licenseCode,
                activated: this.isActivated,
                timestamp: Date.now()
            };
            localStorage.setItem('eartraining_license', JSON.stringify(data));
            console.log('💾 Licenza salvata');
        } catch (error) {
            console.error('Errore salvataggio licenza:', error);
        }
    }

    // Cancella licenza
    clearLicense() {
        this.isActivated = false;
        this.licenseCode = null;
        localStorage.removeItem('eartraining_license');
        this.updateUI();
    }

    // ====================================
    // LICENSE ACTIVATION
    // ====================================

    // Attiva licenza
    async activateLicense(code) {
        if (!code || code.trim() === '') {
            return {
                success: false,
                message: 'Inserisci un codice licenza valido'
            };
        }

        const cleanCode = code.trim().toUpperCase();

        try {
            // Chiama API per verificare licenza
            const response = await fetch(`${this.apiBaseUrl}/checkLicense`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ license: cleanCode })
            });

            const result = await response.json();

            if (result.valid) {
                // Licenza valida - attiva
                this.licenseCode = cleanCode;
                this.isActivated = true;
                this.saveLicenseToStorage();
                this.updateUI();

                return {
                    success: true,
                    message: '✅ Licenza attivata con successo!'
                };
            } else {
                return {
                    success: false,
                    message: result.message || '❌ Codice licenza non valido'
                };
            }
        } catch (error) {
            console.error('Errore attivazione licenza:', error);

            // Fallback: se API non disponibile, usa validazione locale base
            if (this.validateLicenseOffline(cleanCode)) {
                this.licenseCode = cleanCode;
                this.isActivated = true;
                this.saveLicenseToStorage();
                this.updateUI();

                return {
                    success: true,
                    message: '✅ Licenza attivata (modalità offline)'
                };
            }

            return {
                success: false,
                message: '⚠️ Errore di connessione. Riprova più tardi.'
            };
        }
    }

    // Validazione offline (fallback)
    validateLicenseOffline(code) {
        // Codici demo per sviluppo
        const demoCodes = ['EAR-DEMO-2025', 'DEV-MASTER-KEY', 'DEV-MASTER-KEY-2025'];
        return demoCodes.includes(code);
    }

    // Disattiva licenza
    deactivateLicense() {
        this.clearLicense();
        return {
            success: true,
            message: 'Licenza disattivata'
        };
    }

    // ====================================
    // FEATURE CHECKS
    // ====================================

    // Verifica se una feature è disponibile
    hasFeature(featureName) {
        if (this.isActivated) return true;

        // Check per features specifiche
        switch (featureName) {
            case 'advancedChords':
                return false;
            case 'longMelodies':
                return false;
            case 'statistics':
                return false;
            default:
                return true; // Features base sempre disponibili
        }
    }

    // Verifica se categoria accordi è disponibile
    canUseChordCategory(category) {
        if (this.isActivated) return true;

        // Free: solo triadi
        const freeCategories = ['triads'];
        return freeCategories.includes(category);
    }

    // Verifica lunghezza melodia massima
    getMaxMelodyLength() {
        return this.isActivated ? 8 : 4;
    }

    // ====================================
    // UI UPDATES
    // ====================================

    // Aggiorna UI in base a stato licenza
    updateUI() {
        // Aggiorna footer
        const footerStatus = document.getElementById('footerLicenseStatus');
        if (footerStatus) {
            footerStatus.textContent = this.isActivated
                ? '✨ Versione Premium Attiva'
                : 'Versione Gratuita';
            footerStatus.style.color = this.isActivated ? '#10b981' : '#64748b';
        }

        // Aggiorna modale licenza
        this.updateLicenseModal();

        // Disabilita/abilita features premium
        this.updatePremiumFeatures();
    }

    // Aggiorna modale licenza
    updateLicenseModal() {
        const statusDiv = document.getElementById('licenseStatus');
        const formDiv = document.getElementById('licenseForm');

        if (!statusDiv || !formDiv) return;

        if (this.isActivated) {
            statusDiv.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">✨</div>
                    <h3 style="color: #10b981; font-size: 1.3rem; margin-bottom: 0.5rem;">
                        Versione Premium Attiva
                    </h3>
                    <p style="color: #94a3b8; margin-bottom: 1rem;">
                        Codice: ${this.maskLicenseCode(this.licenseCode)}
                    </p>
                    <button id="deactivateLicenseBtn" class="primary-btn" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                        Disattiva Licenza
                    </button>
                </div>
            `;
            formDiv.style.display = 'none';

            // Aggiungi event listener per disattivazione
            setTimeout(() => {
                const deactivateBtn = document.getElementById('deactivateLicenseBtn');
                if (deactivateBtn) {
                    deactivateBtn.onclick = () => {
                        if (confirm('Sei sicuro di voler disattivare la licenza?')) {
                            this.deactivateLicense();
                            this.showMessage('Licenza disattivata', 'success');
                        }
                    };
                }
            }, 100);
        } else {
            statusDiv.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                    <h3 style="color: #f59e0b; font-size: 1.3rem; margin-bottom: 0.5rem;">
                        Versione Gratuita
                    </h3>
                    <p style="color: #94a3b8; font-size: 0.9rem;">
                        Attiva una licenza premium per sbloccare tutte le funzionalità
                    </p>
                    <a href="https://payhip.com/b/yoOFn" target="_blank" style="display: block; margin-top: 1rem; color: #6366f1; font-weight: 600; text-decoration: none;">
                        🛒 Acquista una Licenza
                    </a>
                </div>
            `;
            formDiv.style.display = 'flex';
        }
    }

    // Aggiorna features premium (disabilita checkbox, etc.)
    updatePremiumFeatures() {
        // Disabilita categorie accordi premium se non attivato
        // [MODIFIED] Added sevenths, suspended, ninths to premium list
        const premiumCategories = ['sevenths', 'suspended', 'ninths', 'elevenths', 'thirteenths'];

        premiumCategories.forEach(category => {
            const checkboxes = document.querySelectorAll(`.chord-checkbox[data-category="${category}"]`);
            checkboxes.forEach(checkbox => {
                if (!this.isActivated) {
                    checkbox.disabled = true;
                    checkbox.parentElement.style.opacity = '0.5';
                    checkbox.parentElement.title = '🔒 Richiede licenza Premium';
                } else {
                    checkbox.disabled = false;
                    checkbox.parentElement.style.opacity = '1';
                    checkbox.parentElement.title = '';
                }
            });
        });

        // Limita lunghezza melodia
        const melodyLengthSlider = document.getElementById('melodyLength');
        if (melodyLengthSlider) {
            melodyLengthSlider.max = this.getMaxMelodyLength();
            if (parseInt(melodyLengthSlider.value) > this.getMaxMelodyLength()) {
                melodyLengthSlider.value = this.getMaxMelodyLength();
                document.getElementById('melodyLengthValue').textContent = this.getMaxMelodyLength();
            }
        }
    }

    // Mostra messaggio nella modale
    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('licenseMessage');
        if (!messageDiv) return;

        messageDiv.className = `license-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    // ====================================
    // HELPERS
    // ====================================

    // Maschera codice licenza per display
    maskLicenseCode(code) {
        if (!code || code.length < 8) return '****';
        return code.substring(0, 4) + '-****-' + code.substring(code.length - 4);
    }

    // Ottieni stato licenza
    getStatus() {
        return {
            isActivated: this.isActivated,
            code: this.licenseCode,
            features: {
                advancedChords: this.hasFeature('advancedChords'),
                longMelodies: this.hasFeature('longMelodies'),
                statistics: this.hasFeature('statistics')
            }
        };
    }
}

// ====================================
// Export singleton instance
// ====================================
const licenseManager = new LicenseManager();
