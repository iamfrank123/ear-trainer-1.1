// ====================================
// Main Application Logic
// Coordination tra tutti i moduli
// ====================================

class EarTrainingApp {
    constructor() {
        this.currentMode = 'chords'; // 'chords' o 'scales'
        this.selectedChordCategories = {};
        this.currentExercise = null;
        this.isExerciseActive = false;

        // Inizializza quando DOM è pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    // ====================================
    // INITIALIZATION
    // ====================================

    initialize() {
        console.log('🚀 Inizializzazione Ear Training App...');

        // Setup event listeners
        this.setupModeSelection();
        this.setupChordSelection();
        this.setupScaleControls();
        this.setupStartButton();
        this.setupLicenseModal();
        this.setupAccordion();
        this.setupListenButton();
        this.setupHideNameToggle();
        this.setupVirtualKeyboardNew();

        // Setup auto-play and auto-advance toggles
        this.setupAutoPlayToggle();
        this.setupAutoAdvanceToggle();

        // Connetti MIDI handler
        this.setupMIDIHandlers();

        // Setup evaluator callback
        exerciseEvaluator.onComplete = (result) => this.handleExerciseComplete(result);

        // Carica impostazioni salvate
        this.loadSettings();

        // Aggiorna UI licenza
        licenseManager.updateUI();

        // [NEW] Setup Premium Locks & PWA
        this.setupPremiumFeatures();
        this.setupPWAPrompt();

        console.log('✅ App inizializzata correttamente');
    }

    // ====================================
    // MODE SELECTION
    // ====================================

    setupModeSelection() {
        const modeTabs = document.querySelectorAll('.mode-tab');

        modeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                this.switchMode(mode);
            });
        });
    }

    switchMode(mode) {
        this.currentMode = mode;

        // Aggiorna UI tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Mostra/nascondi pannelli (Desktop IDs)
        const chordsPanel = document.getElementById('chordsPanel');
        const scalesPanel = document.getElementById('scalesPanel');

        if (chordsPanel && scalesPanel) {
            if (mode === 'chords') {
                chordsPanel.style.display = 'block';
                scalesPanel.style.display = 'none';
            } else {
                chordsPanel.style.display = 'none';
                scalesPanel.style.display = 'block';
            }
        }

        // Mostra/nascondi pannelli (Mobile IDs)
        const chordOptions = document.getElementById('chordOptions');
        const scaleOptions = document.getElementById('scaleOptions');

        if (chordOptions && scaleOptions) {
            // Su mobile usiamo classes (gestite anche da script inline, ma sincronizziamo qui)
            chordOptions.classList.toggle('hidden', mode !== 'chords');
            scaleOptions.classList.toggle('hidden', mode !== 'scales');

            // Aggiorna label esercizio su mobile
            const label = document.querySelector('.exercise-label');
            if (label) {
                label.textContent = mode === 'chords' ? 'Accordo corrente' : 'Melodia corrente';
            }
        }

        // Aggiorna stato bottone START
        this.updateStartButton();

        console.log(`📍 Modalità cambiata: ${mode}`);
    }

    // ====================================
    // CHORD SELECTION
    // ====================================

    // Mappatura tipi mobile verso categoria/tipo del generator
    mobileChordTypeMap = {
        'major': { category: 'triads', type: 'major' },
        'minor': { category: 'triads', type: 'minor' },
        'dim': { category: 'triads', type: 'diminished' },
        'aug': { category: 'triads', type: 'augmented' },
        'maj7': { category: 'sevenths', type: 'maj7' },
        'min7': { category: 'sevenths', type: 'min7' },
        'dom7': { category: 'sevenths', type: 'dom7' },
        'sus2': { category: 'suspended', type: 'sus2' },
        'sus4': { category: 'suspended', type: 'sus4' },
        // Premium Types
        'maj9': { category: 'ninths', type: 'maj9' },
        'min9': { category: 'ninths', type: 'min9' },
        'dom9': { category: 'ninths', type: 'dom9' },
        'maj11': { category: 'elevenths', type: 'maj11' },
        'min11': { category: 'elevenths', type: 'min11' },
        'maj13': { category: 'thirteenths', type: 'maj13' },
        'min13': { category: 'thirteenths', type: 'min13' }
    };

    setupChordSelection() {
        // Desktop checkboxes
        const checkboxes = document.querySelectorAll('.chord-checkbox');

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const category = checkbox.dataset.category;
                const type = checkbox.dataset.type;

                // Verifica se categoria premium è accessibile
                if (!licenseManager.canUseChordCategory(category) && checkbox.checked) {
                    checkbox.checked = false;
                    alert('🔒 Questa categoria richiede una licenza Premium!');
                    return;
                }

                // Aggiorna selezione
                if (checkbox.checked) {
                    this.addChordToSelection(category, type);
                } else {
                    this.removeChordFromSelection(category, type);
                }

                this.updateStartButton();
                this.saveSettings();
            });
        });

        // Mobile chord chips
        this.setupMobileChordChips();
    }

    setupMobileChordChips() {
        const chordChips = document.querySelectorAll('.chord-chip');

        if (chordChips.length === 0) return;

        console.log('📱 Setup mobile chord chips...');

        chordChips.forEach(chip => {
            const mobileType = chip.dataset.type;
            const mapping = this.mobileChordTypeMap[mobileType];

            // Inizializza se già selezionato (classe 'selected' presente)
            if (mapping && chip.classList.contains('selected')) {
                this.addChordToSelection(mapping.category, mapping.type);
            }

            chip.addEventListener('click', (e) => {
                // PREMIUM LOCK CHECK
                if (chip.classList.contains('locked')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showPremiumModal();
                    return;
                }

                if (!mapping) return;

                // Simple visual toggle logic is handled by mobile.html script usually,
                // BUT we need to sync state. 
                // Let's assume the click DOES toggle the class 'selected' due to other scripts or default behavior.
                // We just update logic.

                setTimeout(() => {
                    const isSelected = chip.classList.contains('selected');
                    if (isSelected) {
                        this.addChordToSelection(mapping.category, mapping.type);
                    } else {
                        this.removeChordFromSelection(mapping.category, mapping.type);
                    }
                    this.updateStartButton();
                    this.saveSettings();
                }, 10);
            });
        });
    }

    addChordToSelection(category, type) {
        if (!this.selectedChordCategories[category]) {
            this.selectedChordCategories[category] = [];
        }
        if (!this.selectedChordCategories[category].includes(type)) {
            this.selectedChordCategories[category].push(type);
        }
    }

    removeChordFromSelection(category, type) {
        if (this.selectedChordCategories[category]) {
            this.selectedChordCategories[category] =
                this.selectedChordCategories[category].filter(t => t !== type);

            if (this.selectedChordCategories[category].length === 0) {
                delete this.selectedChordCategories[category];
            }
        }
    }

    // ====================================
    // PREMIUM FEATURES LOGIC
    // ====================================
    setupPremiumFeatures() {
        // 1. CHORD CHIPS LOCKING
        this.updatePremiumLocks();

        // 2. TONALITY LOCKING
        const chordRoot = document.getElementById('chordRoot');
        if (chordRoot) {
            chordRoot.addEventListener('change', (e) => {
                const selected = e.target.value;
                const status = licenseManager.getStatus();

                if (!status.isActivated && selected !== 'C' && selected !== '') {
                    // Force Reset to C
                    e.target.value = 'C';
                    this.showPremiumModal();
                }
            });
        }
        // Listen for License Updates
        // LicenseManager should ideally emit events or we just update on UI update.
        // We can hook into updateUI?
        // Or simply checking status on interaction is enough, plus initial update.
    }

    updatePremiumLocks() {
        const status = licenseManager.getStatus();
        const chips = document.querySelectorAll('.chord-chip');

        chips.forEach(chip => {
            const isPremium = chip.classList.contains('premium-chip');
            if (isPremium && !status.isActivated) {
                chip.classList.add('locked');
            } else {
                chip.classList.remove('locked');
            }
        });
    }

    showPremiumModal() {
        // Trigger generic modal open if possible
        const licenseDiv = document.getElementById('licenseStatus');
        if (licenseDiv) {
            // Simulate click? Or open modal directly.
            // Mobile.html: <div class="modal-overlay" id="licenseModal">
            const modal = document.getElementById('licenseModal');
            if (modal) {
                modal.classList.add('active');
            } else {
                // Fallback to alert if modal not found
                alert('🌟 Funzionalità Premium! Attiva la licenza per sbloccare.');
            }
        }
    }

    // ====================================
    // PWA INSTALL PROMPT
    // ====================================
    setupPWAPrompt() {
        let deferredPrompt;
        const pwaPrompt = document.getElementById('pwaPrompt');
        const installBtn = document.getElementById('pwaInstallBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (pwaPrompt) pwaPrompt.classList.add('visible');
        });

        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response to the install prompt: ${outcome}`);
                    deferredPrompt = null;
                    if (pwaPrompt) pwaPrompt.classList.remove('visible');
                }
            });
        }

        // Dismiss logic? (Optional, maybe add a close X later)
        if (pwaPrompt) {
            pwaPrompt.addEventListener('click', (e) => {
                if (e.target === pwaPrompt) pwaPrompt.classList.remove('visible');
            });
        }
    }

    // ====================================
    // SCALE CONTROLS
    // ====================================

    setupScaleControls() {
        // Melody length slider
        const melodyLengthSlider = document.getElementById('melodyLength');
        const melodyLengthValue = document.getElementById('melodyLengthValue');

        if (melodyLengthSlider) {
            melodyLengthSlider.addEventListener('input', (e) => {
                const maxLength = licenseManager.getMaxMelodyLength();
                let value = parseInt(e.target.value);

                if (value > maxLength) {
                    value = maxLength;
                    e.target.value = maxLength;
                    alert(`🔒 Melodie oltre ${maxLength} note richiedono licenza Premium!`);
                }

                if (melodyLengthValue) melodyLengthValue.textContent = value;
                this.saveSettings();
            });
        }

        // Melody speed slider
        const melodySpeedSlider = document.getElementById('melodySpeed');
        const melodySpeedValue = document.getElementById('melodySpeedValue');

        if (melodySpeedSlider) {
            melodySpeedSlider.addEventListener('input', (e) => {
                if (melodySpeedValue) melodySpeedValue.textContent = e.target.value;
                this.saveSettings();
            });
        }

        // Scale root select
        const scaleRoot = document.getElementById('scaleRoot');
        if (scaleRoot) {
            scaleRoot.addEventListener('change', () => this.saveSettings());
        }

        // Include chord checkbox
        const includeChord = document.getElementById('includeChord');
        if (includeChord) {
            includeChord.addEventListener('change', () => this.saveSettings());
        }
    }

    // ====================================
    // AUTO PLAY & AUTO ADVANCE TOGGLES
    // ====================================

    setupAutoPlayToggle() {
        const autoPlayToggle = document.getElementById('autoPlayToggle');
        if (autoPlayToggle) {
            autoPlayToggle.addEventListener('change', () => this.saveSettings());
        }

        const autoPlayChordsToggle = document.getElementById('autoPlayChordsToggle');
        if (autoPlayChordsToggle) {
            autoPlayChordsToggle.addEventListener('change', () => this.saveSettings());
        }
    }

    setupAutoAdvanceToggle() {
        const autoAdvanceToggle = document.getElementById('autoAdvanceToggle');
        if (autoAdvanceToggle) {
            autoAdvanceToggle.addEventListener('change', () => this.saveSettings());
        }

        const autoAdvanceChordsToggle = document.getElementById('autoAdvanceChordsToggle');
        if (autoAdvanceChordsToggle) {
            autoAdvanceChordsToggle.addEventListener('change', () => this.saveSettings());
        }
    }

    isAutoPlayEnabled() {
        // Desktop checkboxes
        if (this.currentMode === 'chords') {
            const toggle = document.getElementById('autoPlayChordsToggle');
            if (toggle && toggle.checked !== undefined) return toggle.checked;
        } else {
            const toggle = document.getElementById('autoPlayToggle');
            if (toggle && toggle.checked !== undefined) return toggle.checked;
        }

        // Mobile toggle switches (use class 'active')
        const mobileToggle = document.getElementById('toggleAutoPlay');
        if (mobileToggle) {
            return mobileToggle.classList.contains('active');
        }

        // Scale mode mobile toggle
        const mobileScaleToggle = document.getElementById('toggleScaleAutoPlay');
        if (mobileScaleToggle) {
            return mobileScaleToggle.classList.contains('active');
        }

        return false;
    }

    isAutoAdvanceEnabled() {
        // Desktop checkboxes
        if (this.currentMode === 'chords') {
            const toggle = document.getElementById('autoAdvanceChordsToggle');
            if (toggle && toggle.checked !== undefined) return toggle.checked;
        } else {
            const toggle = document.getElementById('autoAdvanceToggle');
            if (toggle && toggle.checked !== undefined) return toggle.checked;
        }

        // Mobile toggle switches (use class 'active')
        const mobileToggle = document.getElementById('toggleAutoAdvance');
        if (mobileToggle) {
            return mobileToggle.classList.contains('active');
        }

        return false;
    }

    // ====================================
    // START BUTTON
    // ====================================

    setupStartButton() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startExercise());
        }
    }

    updateStartButton() {
        const startBtn = document.getElementById('startBtn');
        if (!startBtn) return;

        let canStart = false;

        if (this.currentMode === 'chords') {
            // Check se almeno un accordo è selezionato
            const totalSelected = Object.values(this.selectedChordCategories)
                .reduce((sum, arr) => sum + arr.length, 0);
            canStart = totalSelected > 0;
        } else {
            // Scale mode: sempre pronto
            canStart = true;
        }

        startBtn.disabled = !canStart;
    }

    // ====================================
    // EXERCISE GENERATION & EXECUTION
    // ====================================

    startExercise() {
        // Reset stato precedente
        this.hideExerciseDisplay();
        this.hideFeedback();
        exerciseEvaluator.reset();
        midiHandler.resetCurrentNotes();
        this.clearVirtualKeyboard();

        // Genera esercizio in base alla modalità
        let exercise = null;
        let mode = null;

        if (this.currentMode === 'chords') {
            // Log delle categorie selezionate per debugging
            console.log('📋 Categorie selezionate:', this.selectedChordCategories);

            const totalSelected = Object.values(this.selectedChordCategories)
                .reduce((sum, arr) => sum + arr.length, 0);

            console.log(`📊 Totale accordi selezionati: ${totalSelected}`);

            if (totalSelected === 0) {
                alert('⚠️ Seleziona almeno un tipo di accordo prima di iniziare!');
                return;
            }

            // [NEW] Leggi tonality opzionale
            const chordRootElem = document.getElementById('chordRoot');
            const chordRootKey = chordRootElem ? chordRootElem.value : null;

            exercise = exerciseGenerator.generateChord(this.selectedChordCategories, chordRootKey);
            mode = 'chord';
        } else {
            const scaleRoot = document.getElementById('scaleRoot').value;
            const melodyLength = parseInt(document.getElementById('melodyLength').value);

            // Parametri opzionali (safe navigation)
            const includeChordElem = document.getElementById('includeChord');
            const includeChord = includeChordElem ? includeChordElem.checked : false;

            // Gestione mista desktop/mobile per Tonica
            const startWithTonicElem = document.getElementById('startWithTonic');
            const toggleTonicElem = document.getElementById('toggleTonic');

            let startWithTonic = false;
            if (startWithTonicElem) {
                startWithTonic = startWithTonicElem.checked;
            } else if (toggleTonicElem) {
                startWithTonic = toggleTonicElem.classList.contains('active');
            }

            if (includeChord) {
                exercise = exerciseGenerator.generateCombinedExercise(scaleRoot, melodyLength, startWithTonic);
                mode = 'combined';
            } else {
                exercise = exerciseGenerator.generateMelody(scaleRoot, melodyLength, startWithTonic);
                mode = 'melody';
            }
        }

        if (!exercise) {
            alert('❌ Errore nella generazione dell\'esercizio');
            return;
        }

        this.currentExercise = exercise;
        this.isExerciseActive = true;

        console.log('🎯 Esercizio generato:', exercise);

        // Mostra esercizio
        this.showExerciseDisplay(exercise);

        // Inizia valutazione
        exerciseEvaluator.startExercise(exercise, mode);

        console.log('▶️ Esercizio avviato. In attesa di input MIDI...');

        // Auto-play se abilitato
        if (this.isAutoPlayEnabled()) {
            setTimeout(() => {
                this.playCurrentExercise();
            }, 500);
        }
    }

    // ====================================
    // EXERCISE DISPLAY
    // ====================================

    showExerciseDisplay(exercise) {
        // Desktop elements
        const display = document.getElementById('exerciseDisplay');
        const typeElement = document.getElementById('exerciseType');

        if (display && typeElement) {
            typeElement.textContent = exercise.fullName;
            display.style.display = 'block';
        }

        // Mobile elements
        const card = document.getElementById('exerciseCard');
        const nameElement = document.getElementById('exerciseName');
        const startSection = document.getElementById('startSection');

        if (card && nameElement) {
            nameElement.textContent = exercise.fullName;
            card.classList.remove('hidden');
            // Manteniamo visibile il bottone Start per permettere il riavvio con nuove impostazioni
            // if (startSection) startSection.classList.add('hidden'); 
        }

        // Reset listen button (common)
        const listenBtn = document.getElementById('listenBtn');
        if (listenBtn) {
            listenBtn.classList.remove('playing');
            listenBtn.disabled = false;
        }
    }

    hideExerciseDisplay() {
        // Desktop
        const display = document.getElementById('exerciseDisplay');
        if (display) {
            display.style.display = 'none';
        }

        // Mobile
        const card = document.getElementById('exerciseCard');
        const startSection = document.getElementById('startSection');
        if (card) {
            card.classList.add('hidden');
            if (startSection) startSection.classList.remove('hidden');
        }
    }

    // ====================================
    // FEEDBACK DISPLAY
    // ====================================

    showFeedback(result) {
        const feedbackDiv = document.getElementById('feedbackDisplay');
        if (!feedbackDiv) return;

        const feedback = exerciseEvaluator.generateFeedback(result);

        feedbackDiv.className = `feedback-display ${feedback.type}`;
        feedbackDiv.innerHTML = `
            <h3 class="feedback-title" style="color: ${feedback.type === 'success' ? '#10b981' : '#ef4444'}">
                ${feedback.title}
            </h3>
            <p class="feedback-message">${feedback.message}</p>
            <button class="primary-btn" onclick="app.startExercise()" style="margin-top: 1rem;">
                Prossimo Esercizio
            </button>
        `;
        feedbackDiv.style.display = 'block';

        // Nascondi exercise display
        this.hideExerciseDisplay();
    }

    hideFeedback() {
        const feedbackDiv = document.getElementById('feedbackDisplay');
        if (feedbackDiv) {
            feedbackDiv.style.display = 'none';
        }
    }

    // ====================================
    // EXERCISE COMPLETION
    // ====================================

    handleExerciseComplete(result) {
        console.log('🏁 Esercizio completato:', result);

        this.isExerciseActive = false;

        if (result.isCorrect) {
            // ✅ SUCCESSO - Vai al prossimo se auto-advance è attivo
            if (this.isAutoAdvanceEnabled()) {
                // Mostra brevemente il successo
                this.showFeedback(result);

                // Avanza automaticamente dopo 1 secondo
                setTimeout(() => {
                    this.startExercise();
                }, 1000);
            } else {
                // Mostra feedback normale
                this.showFeedback(result);
            }
        } else {
            // ❌ ERRORE - Mostra feedback e RIPROVA LA STESSA MELODIA
            this.showFeedback(result);

            // Riprova automaticamente la stessa melodia dopo 1.5 secondi
            setTimeout(() => {
                // Reset UI
                this.hideFeedback();
                this.clearVirtualKeyboard();
                exerciseEvaluator.reset();
                midiHandler.resetCurrentNotes();

                // Riavvia lo STESSO esercizio
                this.isExerciseActive = true;
                this.showExerciseDisplay(this.currentExercise);
                exerciseEvaluator.startExercise(this.currentExercise, exerciseEvaluator.evaluationMode || this.getExerciseMode());

                // Auto-play se abilitato
                if (this.isAutoPlayEnabled()) {
                    setTimeout(() => {
                        this.playCurrentExercise();
                    }, 300);
                }

                console.log('🔄 Riprova lo stesso esercizio...');
            }, 1500);
        }
    }

    // ====================================
    // MIDI HANDLERS
    // ====================================

    setupMIDIHandlers() {
        // Quando nota viene suonata
        midiHandler.onNoteOn = (noteData) => {
            console.log('🎹 Note ON:', noteData);

            // Visual Feedback anche se esercizio non è attivo
            const midiNote = noteData.note;
            const keyElement = document.querySelector(`.piano-key[data-note="${midiNote}"]`);
            if (keyElement) keyElement.classList.add('active');

            // Se esercizio non è attivo, stop qui
            if (!this.isExerciseActive) return;

            const isChordMode = this.currentMode === 'chords' || this.currentMode === 'combined';

            if (isChordMode) {
                // CHORD MODE
                const status = exerciseEvaluator.checkNote(midiNote);

                if (status === 'correct') {
                    // ✅ Nota corretta
                    if (keyElement) keyElement.classList.add('correct');
                    exerciseEvaluator.addNote(midiNote);
                    // checkCompletion è chiamato dentro addNote
                } else if (status === 'incorrect') {
                    // ❌ Nota sbagliata - STOP IMMEDIATO
                    if (keyElement) keyElement.classList.add('incorrect');

                    const result = {
                        isCorrect: false,
                        exercise: this.currentExercise,
                        userAnswer: [],
                        expectedPitchClasses: this.currentExercise.pitchClasses,
                        timeTaken: Date.now() - exerciseEvaluator.startTime,
                        mode: 'chord'
                    };

                    exerciseEvaluator.isEvaluating = false;
                    this.handleExerciseComplete(result);
                }
            } else {
                // MELODY MODE
                const isCorrectSequential = exerciseEvaluator.checkSequentialNote(midiNote);

                if (isCorrectSequential) {
                    // ✅ Nota corretta nella sequenza
                    if (keyElement) keyElement.classList.add('correct');
                    exerciseEvaluator.advanceMelodyIndex();
                    exerciseEvaluator.addNote(midiNote);
                } else {
                    // ❌ Nota fuori sequenza o sbagliata - STOP IMMEDIATO
                    if (keyElement) keyElement.classList.add('incorrect');

                    const result = {
                        isCorrect: false,
                        exercise: this.currentExercise,
                        userAnswer: [],
                        expectedNotes: this.currentExercise.notes,
                        timeTaken: Date.now() - exerciseEvaluator.startTime,
                        mode: 'melody'
                    };

                    exerciseEvaluator.isEvaluating = false;
                    this.handleExerciseComplete(result);
                }
            }
        };

        // Quando nota viene rilasciata
        midiHandler.onNoteOff = (noteData) => {
            console.log('🎹 Note OFF:', noteData);
            const keyElement = document.querySelector(`.piano-key[data-note="${noteData.note}"]`);
            if (keyElement) {
                keyElement.classList.remove('active', 'correct', 'incorrect');
            }
        };
    }

    // ====================================
    // LICENSE MODAL
    // ====================================

    setupLicenseModal() {
        const licenseBtn = document.getElementById('licenseBtn');
        const modal = document.getElementById('licenseModal');
        const closeBtn = document.getElementById('closeLicenseModal');
        const overlay = modal?.querySelector('.modal-overlay');

        if (licenseBtn && modal) {
            licenseBtn.addEventListener('click', () => {
                modal.classList.add('active');
                licenseManager.updateUI();
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        if (overlay && modal) {
            overlay.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        // [NEW] Activate License Logic
        const activateBtn = document.getElementById('activateLicenseBtn');
        const licenseInput = document.getElementById('licenseInput');

        if (activateBtn && licenseInput) {
            activateBtn.addEventListener('click', async () => {
                const code = licenseInput.value;
                activateBtn.disabled = true;
                activateBtn.textContent = 'Verifica in corso...';

                try {
                    const result = await licenseManager.activateLicense(code);
                    if (result.success) {
                        licenseManager.showMessage(result.message, 'success');
                        document.getElementById('licenseForm').style.display = 'none'; // Hide immediately on success

                        // [FIX] Update mobile chips and locks immediately
                        this.updatePremiumLocks();
                        this.setupPremiumFeatures(); // Re-bind any changed elements if needed
                    } else {
                        licenseManager.showMessage(result.message, 'error');
                    }
                } catch (e) {
                    console.error(e);
                    licenseManager.showMessage('Errore imprevisto', 'error');
                } finally {
                    activateBtn.disabled = false;
                    activateBtn.textContent = 'Attiva Licenza';
                }
            });
        }
    }

    setupAccordion() {
        const headers = document.querySelectorAll('.accordion-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const item = header.parentElement;
                const isActive = item.classList.contains('active');
                if (!isActive) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        });
    }

    setupListenButton() {
        const listenBtn = document.getElementById('listenBtn');
        if (listenBtn) {
            listenBtn.addEventListener('click', () => this.playCurrentExercise());
        }
    }

    setupHideNameToggle() {
        const toggle = document.getElementById('hideNameToggle');
        if (toggle) {
            toggle.addEventListener('change', () => {
                const exerciseName = document.getElementById('exerciseName');
                if (exerciseName) {
                    exerciseName.classList.toggle('blurred', toggle.checked);
                }
                const typeElement = document.getElementById('exerciseType');
                if (typeElement) {
                    typeElement.classList.toggle('blurred', toggle.checked);
                }
            });
        }
    }

    async playCurrentExercise() {
        if (!this.currentExercise) return;

        // Reset tastiera
        this.clearVirtualKeyboard();

        const listenBtn = document.getElementById('listenBtn');
        if (!listenBtn) return;

        // Inizializza audio player (richiede user interaction)
        await audioPlayer.initialize();

        // Disabilita pulsante e mostra stato playing
        listenBtn.disabled = true;
        listenBtn.classList.add('playing');

        try {
            // Ottieni speed per melodie
            const speed = parseFloat(document.getElementById('melodySpeed')?.value || 2);

            // Riproduci esercizio
            const mode = exerciseEvaluator.evaluationMode || 'chord';
            await audioPlayer.playExercise(this.currentExercise, mode, speed);

            console.log('✅ Riproduzione completata');
        } catch (error) {
            console.error('❌ Errore riproduzione audio:', error);
        } finally {
            // Riabilita pulsante
            listenBtn.disabled = false;
            listenBtn.classList.remove('playing');
        }
    }

    getExerciseMode() {
        // Fallback simple helper
        return this.currentMode === 'chords' ? 'chord' : 'melody';
    }

    saveSettings() {
        const settings = {
            mode: this.currentMode,
            selectedChords: this.selectedChordCategories,
            autoPlay: this.isAutoPlayEnabled(),
            autoAdvance: this.isAutoAdvanceEnabled(),
            // Salva altri setting relevant
            melodyLength: document.getElementById('melodyLength')?.value,
            scaleRoot: document.getElementById('scaleRoot')?.value,
            // [NEW] Nuovi settings
            chordRoot: document.getElementById('chordRoot')?.value,
            melodySpeed: document.getElementById('melodySpeed')?.value
        };
        localStorage.setItem('earTrainerSettings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('earTrainerSettings');
            if (saved) {
                const settings = JSON.parse(saved);

                // Restore mode
                if (settings.mode) {
                    this.switchMode(settings.mode);
                }

                // Restore selected chords
                if (settings.selectedChords) {
                    this.selectedChordCategories = settings.selectedChords;
                }

                // Restore other settings
                if (settings.melodyLength) {
                    const el = document.getElementById('melodyLength');
                    if (el) el.value = settings.melodyLength;
                    const val = document.getElementById('melodyLengthValue');
                    if (val) val.textContent = settings.melodyLength;
                }

                if (settings.scaleRoot) {
                    const el = document.getElementById('scaleRoot');
                    if (el) el.value = settings.scaleRoot;
                }

                if (settings.chordRoot) {
                    const el = document.getElementById('chordRoot');
                    if (el) el.value = settings.chordRoot;
                }

                if (settings.melodySpeed) {
                    const el = document.getElementById('melodySpeed');
                    if (el) el.value = settings.melodySpeed;
                    const val = document.getElementById('melodySpeedValue');
                    if (val) val.textContent = settings.melodySpeed;
                }

                this.updateStartButton();
                console.log('✅ Impostazioni caricate:', settings);
            }
        } catch (e) {
            console.error('Error loading settings', e);
        }
    }

    // ====================================
    // VIRTUAL KEYBOARD LOGIC
    // ====================================

    setupVirtualKeyboardNew() {
        // Clear Button (Desktop e Mobile)
        const clearBtn = document.getElementById('clearKeyboardBtn') || document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearVirtualKeyboard();
            });
        }

        // GENERAZIONE DINAMICA TASTIERA (Mobile)
        this.renderVirtualKeyboard();

        // ATTACH LISTENERS (Unified for Mobile & Desktop)
        // Crucial for Desktop: attach listeners to static .piano-key elements
        this.attachSmartTouchListeners();

        console.log('🎹 Tastiera virtuale inizializzata (Unified)');
    }

    renderVirtualKeyboard() {
        const container = document.getElementById('pianoInner');
        if (!container) return;

        container.innerHTML = ''; // Clear existing

        const startNote = 48; // C3
        const endNote = 84;   // C6
        const solfege = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

        for (let note = startNote; note <= endNote; note++) {
            const pitchClass = note % 12;
            const isBlack = [1, 3, 6, 8, 10].includes(pitchClass);
            const noteName = solfege[pitchClass];

            if (isBlack) {
                const blackKey = document.createElement('div');
                blackKey.className = 'piano-key black';
                blackKey.dataset.note = note;
                container.appendChild(blackKey);
            } else {
                const whiteKey = document.createElement('div');
                whiteKey.className = 'piano-key white';
                whiteKey.dataset.note = note;
                whiteKey.textContent = noteName.includes('#') ? '' : noteName;
                container.appendChild(whiteKey);
            }
        }

        // SCROLL INITIAL POSITION
        setTimeout(() => {
            const pianoOuter = document.getElementById('pianoKeyboard');
            if (pianoOuter) {
                pianoOuter.scrollLeft = 200;
            }
        }, 100);
    }

    attachSmartTouchListeners() {
        // [MODIFIED] Selector now targets BOTH Mobile and Desktop keys, plus buttons.
        const keys = document.querySelectorAll('.piano-key, .note-btn');

        let startX = 0;
        let startY = 0;
        let isScrolling = false;
        let isPotentialTap = false;
        const TAP_THRESHOLD = 10;

        keys.forEach(key => {
            key.addEventListener('pointerdown', (e) => {
                startX = e.clientX;
                startY = e.clientY;
                isPotentialTap = true;
                isScrolling = false;
            });

            key.addEventListener('pointermove', (e) => {
                if (!isPotentialTap) return;

                const diffX = Math.abs(e.clientX - startX);
                const diffY = Math.abs(e.clientY - startY);

                if (diffX > TAP_THRESHOLD || diffY > TAP_THRESHOLD) {
                    isPotentialTap = false;
                    isScrolling = true;
                }
            });

            key.addEventListener('pointerup', (e) => {
                if (isPotentialTap && !isScrolling) {
                    // Tap / Click verified
                    let note = parseInt(key.dataset.note);

                    // Handle .note-btn which uses data-pitch (0-11)
                    if (isNaN(note)) {
                        const pitch = parseInt(key.dataset.pitch);
                        if (!isNaN(pitch)) {
                            note = 60 + pitch; // Default to C4 octave
                        }
                    }

                    if (!isNaN(note)) {
                        this.handleVirtualInputWithFeedback(note, key);
                    }
                }
                // Reset
                isPotentialTap = false;
                isScrolling = false;
            });

            key.addEventListener('pointercancel', (e) => {
                isPotentialTap = false;
                isScrolling = false;
            });

            key.addEventListener('contextmenu', e => e.preventDefault());
        });
    }

    async handleVirtualInputWithFeedback(midiNote, element) {
        if (!audioPlayer.isInitialized) {
            await audioPlayer.initialize();
        }

        const isChordMode = this.currentMode === 'chords' || this.currentMode === 'combined';
        const isActive = element.classList.contains('active');

        // Reset classi feedback precedenti
        element.classList.remove('correct', 'incorrect');

        if (isChordMode) {
            // TOGGLE MODE
            if (isActive) {
                element.classList.remove('active', 'correct', 'incorrect');
                if (this.isExerciseActive) {
                    exerciseEvaluator.removeNote(midiNote);
                }
            } else {
                element.classList.add('active');
                await this.playVirtualNote(midiNote);

                if (this.isExerciseActive) {
                    const status = exerciseEvaluator.checkNote(midiNote);

                    if (status === 'correct') {
                        element.classList.add('correct');
                        exerciseEvaluator.addNote(midiNote);
                        exerciseEvaluator.checkCompletion();

                    } else if (status === 'incorrect') {
                        element.classList.add('incorrect');
                        const result = {
                            isCorrect: false,
                            exercise: this.currentExercise,
                            userAnswer: [],
                            expectedPitchClasses: this.currentExercise.pitchClasses,
                            timeTaken: Date.now() - exerciseEvaluator.startTime,
                            mode: 'chord'
                        };
                        exerciseEvaluator.isEvaluating = false;
                        this.handleExerciseComplete(result);
                    }
                }
            }
        } else {
            // MELODY MODE
            element.classList.add('active');

            if (this.isExerciseActive) {
                const isCorrectSequential = exerciseEvaluator.checkSequentialNote(midiNote);

                if (isCorrectSequential) {
                    element.classList.add('correct');
                    exerciseEvaluator.advanceMelodyIndex();

                    if (exerciseEvaluator.isMelodyComplete()) {
                        const result = {
                            isCorrect: true,
                            exercise: this.currentExercise,
                            userAnswer: [],
                            expectedNotes: this.currentExercise.notes,
                            timeTaken: Date.now() - exerciseEvaluator.startTime,
                            mode: 'melody'
                        };
                        exerciseEvaluator.isEvaluating = false;
                        this.handleExerciseComplete(result);
                    }
                } else {
                    element.classList.add('incorrect');
                    const result = {
                        isCorrect: false,
                        exercise: this.currentExercise,
                        userAnswer: [],
                        expectedNotes: this.currentExercise.notes,
                        timeTaken: Date.now() - exerciseEvaluator.startTime,
                        mode: 'melody'
                    };
                    exerciseEvaluator.isEvaluating = false;
                    this.handleExerciseComplete(result);
                }
            }

            await this.playVirtualNote(midiNote);

            setTimeout(() => {
                element.classList.remove('active', 'correct', 'incorrect');
            }, 300);
        }
    }

    async playVirtualNote(midiNote) {
        try {
            await audioPlayer.playNote(midiNote);
        } catch (err) {
            console.error('Audio err:', err);
        }
    }

    clearVirtualKeyboard() {
        const allKeys = document.querySelectorAll('.piano-key, .note-btn');
        allKeys.forEach(el => {
            el.classList.remove('active', 'correct', 'incorrect');
        });

        if (this.isExerciseActive) {
            exerciseEvaluator.resetUserNotes();
        }
    }
}

// ====================================
// Initialize App
// ====================================
const app = new EarTrainingApp();
