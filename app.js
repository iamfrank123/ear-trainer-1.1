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
            chordOptions.classList.toggle('hidden', mode !== 'chords');
            scaleOptions.classList.toggle('hidden', mode !== 'scales');

            // Aggiorna label esercizio su mobile
            const label = document.querySelector('.exercise-label #exerciseLabelText');
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
        const checkboxes = document.querySelectorAll('.chord-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const category = checkbox.dataset.category;
                const type = checkbox.dataset.type;

                if (!licenseManager.canUseChordCategory(category) && checkbox.checked) {
                    checkbox.checked = false;
                    alert('🔒 Questa categoria richiede una licenza Premium!');
                    return;
                }

                if (checkbox.checked) {
                    this.addChordToSelection(category, type);
                } else {
                    this.removeChordFromSelection(category, type);
                }

                this.updateStartButton();
                this.saveSettings();
            });
        });

        this.setupMobileChordChips();
    }

    setupMobileChordChips() {
        const chordChips = document.querySelectorAll('.chord-chip');
        if (chordChips.length === 0) return;

        chordChips.forEach(chip => {
            const mobileType = chip.dataset.type;
            const mapping = this.mobileChordTypeMap[mobileType];

            // Inizializza se già selezionato
            if (mapping && chip.classList.contains('selected')) {
                this.addChordToSelection(mapping.category, mapping.type);
            }

            chip.addEventListener('click', (e) => {
                if (chip.classList.contains('locked')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showPremiumModal();
                    return;
                }

                if (!mapping) return;

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

    setupPremiumFeatures() {
        this.updatePremiumLocks();
        const chordRoot = document.getElementById('chordRoot');
        if (chordRoot) {
            chordRoot.addEventListener('change', (e) => {
                const selected = e.target.value;
                const status = licenseManager.getStatus();
                if (!status.isActivated && selected !== 'C' && selected !== '') {
                    e.target.value = 'C';
                    this.showPremiumModal();
                }
            });
        }
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
        const modal = document.getElementById('licenseModal');
        if (modal) {
            modal.classList.add('active');
        } else {
            alert('🌟 Funzionalità Premium! Attiva la licenza per sbloccare.');
        }
    }

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
                    deferredPrompt = null;
                    if (pwaPrompt) pwaPrompt.classList.remove('visible');
                }
            });
        }
        if (pwaPrompt) {
            pwaPrompt.addEventListener('click', (e) => {
                if (e.target === pwaPrompt) pwaPrompt.classList.remove('visible');
            });
        }
    }

    setupScaleControls() {
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

        const melodySpeedSlider = document.getElementById('melodySpeed');
        const melodySpeedValue = document.getElementById('melodySpeedValue');
        if (melodySpeedSlider) {
            melodySpeedSlider.addEventListener('input', (e) => {
                if (melodySpeedValue) melodySpeedValue.textContent = e.target.value;
                this.saveSettings();
            });
        }

        const scaleRoot = document.getElementById('scaleRoot');
        if (scaleRoot) {
            scaleRoot.addEventListener('change', () => this.saveSettings());
        }
    }

    // ====================================
    // SETTINGS & UI CONTROLS
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

    setupHideNameToggle() {
        const toggle = document.getElementById('hideNameToggle'); // Desktop
        if (toggle) {
            toggle.addEventListener('change', () => this.saveSettings());
        }
        const mobileToggle = document.getElementById('toggleHideChordName'); // Mobile
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                setTimeout(() => this.saveSettings(), 50);
            });
        }
    }

    isAutoPlayEnabled() {
        if (this.currentMode === 'chords') {
            const toggle = document.getElementById('autoPlayChordsToggle');
            if (toggle && toggle.checked !== undefined) return toggle.checked;
        } else {
            const toggle = document.getElementById('autoPlayToggle');
            if (toggle && toggle.checked !== undefined) return toggle.checked;
        }
        const mobileToggle = document.getElementById('toggleAutoPlay');
        if (mobileToggle && mobileToggle.classList.contains('active')) return true;
        const mobileScaleToggle = document.getElementById('toggleScaleAutoPlay');
        if (mobileScaleToggle && mobileScaleToggle.classList.contains('active')) return true;
        return false;
    }

    isAutoAdvanceEnabled() {
        if (this.currentMode === 'chords') {
            const toggle = document.getElementById('autoAdvanceChordsToggle');
            if (toggle && toggle.checked !== undefined) return toggle.checked;
        } else {
            const toggle = document.getElementById('autoAdvanceToggle');
            if (toggle && toggle.checked !== undefined) return toggle.checked;
        }
        const mobileToggle = document.getElementById('toggleAutoAdvance');
        if (mobileToggle && mobileToggle.classList.contains('active')) return true;
        return false;
    }

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
            const totalSelected = Object.values(this.selectedChordCategories)
                .reduce((sum, arr) => sum + arr.length, 0);
            canStart = totalSelected > 0;
        } else {
            canStart = true;
        }
        startBtn.disabled = !canStart;
        startBtn.classList.toggle('disabled', !canStart);
    }

    setupAccordion() {
        const headers = document.querySelectorAll('.accordion-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const item = header.parentElement;
                item.classList.toggle('active');
            });
        });
    }

    setupListenButton() {
        const listenBtn = document.getElementById('listenBtn');
        if (listenBtn) {
            listenBtn.addEventListener('click', () => this.playCurrentExercise());
        }
    }

    setupLicenseModal() {
        const licenseBtn = document.getElementById('navLicense') || document.getElementById('licenseBtn');
        const modal = document.getElementById('licenseModal');
        // Mobile.html uses specific selectors sometimes, ensure compatibility
        // The mobile.html has inline script for modal handling, calling openModal('licenseModal')
        // We just need to handle logic if any. 
        // Logic for activation:
        const activateBtn = document.getElementById('activateLicenseBtn');
        const licenseInput = document.getElementById('licenseInput');
        if (activateBtn && licenseInput) {
            activateBtn.addEventListener('click', async () => {
                const code = licenseInput.value;
                activateBtn.disabled = true;
                activateBtn.textContent = 'Verifica...';
                try {
                    const result = await licenseManager.activateLicense(code);
                    if (result.success) {
                        licenseManager.showMessage(result.message, 'success');
                        document.getElementById('licenseForm').style.display = 'none';
                        this.updatePremiumLocks();
                    } else {
                        licenseManager.showMessage(result.message, 'error');
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    activateBtn.disabled = false;
                    activateBtn.textContent = 'Attiva Licenza';
                }
            });
        }
    }

    // ====================================
    // EXERCISE LOGIC
    // ====================================

    startExercise() {
        this.hideExerciseDisplay();
        this.hideFeedback();
        exerciseEvaluator.reset();
        midiHandler.resetCurrentNotes();
        this.clearVirtualKeyboard();

        let exercise = null;
        let mode = null;

        if (this.currentMode === 'chords') {
            const total = Object.values(this.selectedChordCategories).reduce((a, b) => a + b.length, 0);
            if (total === 0) {
                alert('Seleziona almeno un accordo');
                return;
            }
            const root = document.getElementById('chordRoot')?.value || '';
            exercise = exerciseGenerator.generateChord(this.selectedChordCategories, root);
            mode = 'chord';
        } else {
            const root = document.getElementById('scaleRoot')?.value || 'C';
            const len = parseInt(document.getElementById('melodyLength')?.value || 4);
            const tonicToggle = document.getElementById('toggleTonic');
            const isTonic = tonicToggle ? tonicToggle.classList.contains('active') : false;
            exercise = exerciseGenerator.generateMelody(root, len, isTonic);
            mode = 'melody';
        }

        if (!exercise) return;

        this.currentExercise = exercise;
        this.isExerciseActive = true;
        console.log('Target:', exercise);

        this.showExerciseDisplay(exercise);
        exerciseEvaluator.startExercise(exercise, mode);

        if (this.isAutoPlayEnabled()) {
            setTimeout(() => this.playCurrentExercise(), 500);
        }
    }

    showExerciseDisplay(exercise) {
        // Desktop
        const display = document.getElementById('exerciseDisplay');
        const typeElement = document.getElementById('exerciseType');
        if (display && typeElement) {
            typeElement.textContent = exercise.fullName;
            display.style.display = 'block';
        }

        // Mobile
        const card = document.getElementById('exerciseCard');
        const nameElement = document.getElementById('exerciseName');
        const startSection = document.getElementById('startSection');

        if (card && nameElement) {
            nameElement.textContent = exercise.fullName;
            card.classList.remove('hidden');
            if (startSection) startSection.classList.add('hidden');

            // HIDE LOGIC
            const hideToggle = document.getElementById('toggleHideChordName');
            const shouldHide = hideToggle && hideToggle.classList.contains('active');

            if (shouldHide) {
                nameElement.classList.add('reveal-mask');
                // Remove listener to avoid duplicates? Better replace node or use named handler
                // Simple implementation: clone to clear listeners
                const newNameElement = nameElement.cloneNode(true);
                nameElement.parentNode.replaceChild(newNameElement, nameElement);

                newNameElement.addEventListener('click', function handler() {
                    newNameElement.classList.remove('reveal-mask');
                    newNameElement.removeEventListener('click', handler);
                });
            } else {
                nameElement.classList.remove('reveal-mask');
                // Also clear listeners if any?
                const newNameElement = nameElement.cloneNode(true);
                nameElement.parentNode.replaceChild(newNameElement, nameElement);
            }
        }

        const listenBtn = document.getElementById('listenBtn');
        if (listenBtn) {
            listenBtn.classList.remove('playing');
            listenBtn.disabled = false;
        }
    }

    hideExerciseDisplay() {
        const display = document.getElementById('exerciseDisplay');
        if (display) display.style.display = 'none';

        const card = document.getElementById('exerciseCard');
        const startSection = document.getElementById('startSection');
        if (card) {
            card.classList.add('hidden');
            if (startSection) startSection.classList.remove('hidden');
        }
    }

    showFeedback(result) {
        const feedbackDiv = document.getElementById('feedbackDisplay'); // Desktop mainly?
        // On mobile we might want a different feedback or reuse same.
        // Assuming desktop container for now or one injected into mobile.
        // Mobile might check if exists.
        if (!feedbackDiv) return;

        const feedback = exerciseEvaluator.generateFeedback(result);
        feedbackDiv.className = `feedback-display ${feedback.type}`;
        feedbackDiv.innerHTML = `
            <h3 style="color:${feedback.type === 'success' ? '#10b981' : '#ef4444'}">${feedback.title}</h3>
            <p>${feedback.message}</p>
            <button onclick="app.startExercise()">Prossimo</button>
        `;
        feedbackDiv.style.display = 'block';
        this.hideExerciseDisplay();
    }

    hideFeedback() {
        const feedbackDiv = document.getElementById('feedbackDisplay');
        if (feedbackDiv) feedbackDiv.style.display = 'none';
    }

    handleExerciseComplete(result) {
        console.log('Result:', result);
        this.isExerciseActive = false;

        // Show visual feedback on keys?? already done in checkNote/checkSequentialNote

        if (result.isCorrect) {
            if (this.isAutoAdvanceEnabled()) {
                // Show success briefly
                // this.showFeedback(result); // Optional
                setTimeout(() => this.startExercise(), 1000);
            } else {
                this.showFeedback(result);
            }
        } else {
            this.showFeedback(result);

            // Retry logic
            setTimeout(() => {
                this.hideFeedback();
                this.clearVirtualKeyboard();
                exerciseEvaluator.reset();
                midiHandler.resetCurrentNotes();

                this.isExerciseActive = true;
                this.currentExercise = result.exercise; // Restore
                this.showExerciseDisplay(this.currentExercise);
                exerciseEvaluator.startExercise(this.currentExercise, result.mode);

                if (this.isAutoPlayEnabled()) {
                    setTimeout(() => this.playCurrentExercise(), 300);
                }
            }, 1500);
        }
    }

    async playCurrentExercise() {
        if (!this.currentExercise) return;
        this.clearVirtualKeyboard(); // Visual reset

        const listenBtn = document.getElementById('listenBtn');
        if (listenBtn) {
            listenBtn.disabled = true;
            listenBtn.classList.add('playing');
        }

        try {
            if (!audioPlayer.isInitialized) await audioPlayer.initialize();

            const speed = parseFloat(document.getElementById('melodySpeed')?.value || 1.5);
            const mode = exerciseEvaluator.evaluationMode || 'chord';

            await audioPlayer.playExercise(this.currentExercise, mode, speed);
        } catch (e) {
            console.error(e);
        } finally {
            if (listenBtn) {
                listenBtn.disabled = false;
                listenBtn.classList.remove('playing');
            }
        }
    }

    saveSettings() {
        const settings = {
            mode: this.currentMode,
            selectedChords: this.selectedChordCategories,
            melodyLength: document.getElementById('melodyLength')?.value,
            scaleRoot: document.getElementById('scaleRoot')?.value,
            chordRoot: document.getElementById('chordRoot')?.value,
            melodySpeed: document.getElementById('melodySpeed')?.value,
            hideChordName: document.getElementById('toggleHideChordName')?.classList.contains('active')
        };
        localStorage.setItem('earTrainerSettings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('earTrainerSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                if (settings.mode) this.switchMode(settings.mode);
                if (settings.selectedChords) this.selectedChordCategories = settings.selectedChords;

                const restoreVal = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.value = val;
                };

                restoreVal('melodyLength', settings.melodyLength);
                restoreVal('scaleRoot', settings.scaleRoot);
                restoreVal('chordRoot', settings.chordRoot);
                restoreVal('melodySpeed', settings.melodySpeed);

                if (settings.hideChordName) {
                    const el = document.getElementById('toggleHideChordName');
                    if (el) el.classList.add('active');
                }

                // Update visuals
                const lenVal = document.getElementById('melodyLengthValue');
                if (lenVal && settings.melodyLength) lenVal.textContent = settings.melodyLength;

                const spdVal = document.getElementById('melodySpeedValue');
                if (spdVal && settings.melodySpeed) spdVal.textContent = settings.melodySpeed;

                this.updateStartButton();
            }
        } catch (e) {
            console.error(e);
        }
    }

    // ====================================
    // MIDI HANDLERS
    // ====================================

    setupMIDIHandlers() {
        midiHandler.onNoteOn = (noteData) => {
            const midiNote = noteData.note;
            const keyElement = document.querySelector(`.piano-key[data-note="${midiNote}"], .note-btn[data-pitch="${midiNote % 12}"]`);
            // Note: .note-btn uses pitch class 0-11. We need to match precise octave for piano-key, pitch for buttons

            // Activate piano key
            const exactKey = document.querySelector(`.piano-key[data-note="${midiNote}"]`);
            if (exactKey) exactKey.classList.add('active');

            // Activate button (any octave)
            const pitch = midiNote % 12;
            const btn = document.querySelector(`.note-btn[data-pitch="${pitch}"]`);
            if (btn) btn.classList.add('active');

            if (!this.isExerciseActive) return;

            // Logic handling
            const isChord = this.currentMode === 'chords';
            if (isChord) {
                const status = exerciseEvaluator.checkNote(midiNote);
                if (status === 'correct') {
                    if (exactKey) exactKey.classList.add('correct');
                    if (btn) btn.classList.add('correct');
                    exerciseEvaluator.addNote(midiNote);
                } else if (status === 'incorrect') {
                    if (exactKey) exactKey.classList.add('incorrect');
                    if (btn) btn.classList.add('incorrect');
                    this.handleExerciseComplete({
                        isCorrect: false,
                        exercise: this.currentExercise,
                        userAnswer: [], // Simplified
                        mode: 'chord'
                    });
                    exerciseEvaluator.isEvaluating = false;
                }
            } else {
                const correct = exerciseEvaluator.checkSequentialNote(midiNote);
                if (correct) {
                    if (exactKey) exactKey.classList.add('correct');
                    exerciseEvaluator.advanceMelodyIndex();
                    if (exerciseEvaluator.isMelodyComplete()) {
                        this.handleExerciseComplete({ isCorrect: true, exercise: this.currentExercise, mode: 'melody' });
                    }
                } else {
                    if (exactKey) exactKey.classList.add('incorrect');
                    this.handleExerciseComplete({ isCorrect: false, exercise: this.currentExercise, mode: 'melody' });
                    exerciseEvaluator.isEvaluating = false;
                }
            }
        };

        midiHandler.onNoteOff = (noteData) => {
            const midiNote = noteData.note;
            const exactKey = document.querySelector(`.piano-key[data-note="${midiNote}"]`);
            if (exactKey) exactKey.classList.remove('active', 'correct', 'incorrect');

            const pitch = midiNote % 12;
            const btn = document.querySelector(`.note-btn[data-pitch="${pitch}"]`);
            if (btn) btn.classList.remove('active', 'correct', 'incorrect');
        };
    }

    // ====================================
    // VIRTUAL KEYBOARD NEW
    // ====================================

    setupVirtualKeyboardNew() {
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearVirtualKeyboard());
        }
        this.renderVirtualKeyboard();
        this.attachSmartTouchListeners();
    }

    renderVirtualKeyboard() {
        const container = document.getElementById('pianoInner');
        if (!container) return;
        container.innerHTML = '';

        const start = 48; // C3
        const end = 84;   // C6
        const solfege = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

        for (let n = start; n <= end; n++) {
            const pitch = n % 12;
            const isBlack = [1, 3, 6, 8, 10].includes(pitch);
            const name = solfege[pitch];
            const div = document.createElement('div');
            div.className = isBlack ? 'piano-key black' : 'piano-key white';
            div.dataset.note = n;
            if (!isBlack) div.textContent = name.includes('#') ? '' : name;
            container.appendChild(div);
        }

        setTimeout(() => {
            const outer = document.getElementById('pianoKeyboard');
            if (outer) outer.scrollLeft = 200;
        }, 100);
    }

    attachSmartTouchListeners() {
        const keys = document.querySelectorAll('.piano-key, .note-btn');
        let startX, startY;
        let isScrolling = false;
        let isTap = false;

        keys.forEach(key => {
            key.addEventListener('pointerdown', e => {
                startX = e.clientX;
                startY = e.clientY;
                isTap = true;
                isScrolling = false;
            });
            key.addEventListener('pointermove', e => {
                if (!isTap) return;
                if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
                    isTap = false;
                    isScrolling = true;
                }
            });
            key.addEventListener('pointerup', e => {
                if (isTap && !isScrolling) {
                    let note = parseInt(key.dataset.note);
                    if (isNaN(note)) { // Note button
                        const p = parseInt(key.dataset.pitch);
                        if (!isNaN(p)) note = 60 + p; // C4 base
                    }
                    if (!isNaN(note)) this.handleVirtualInputWithFeedback(note, key);
                }
                isTap = false;
            });
            key.addEventListener('pointercancel', () => isTap = false);
            key.addEventListener('contextmenu', e => e.preventDefault());
        });
    }

    async handleVirtualInputWithFeedback(note, element) {
        if (!audioPlayer.isInitialized) await audioPlayer.initialize();

        // Visuals handled by MIDI handler effectively if we simulate input?
        // But here we want immediate feedback logic similar to MIDI wrapper.
        // Actually, best to route through MIDI handler logic if possible to unify.
        // But for now, replicate logic:

        const isChord = this.currentMode === 'chords';
        if (isChord) {
            const active = element.classList.contains('active');
            if (active) {
                element.classList.remove('active', 'correct', 'incorrect');
                if (this.isExerciseActive) exerciseEvaluator.removeNote(note);
            } else {
                element.classList.add('active');
                this.playVirtualNote(note);

                if (this.isExerciseActive) {
                    const status = exerciseEvaluator.checkNote(note);
                    if (status === 'correct') {
                        element.classList.add('correct');
                        exerciseEvaluator.addNote(note);
                    } else if (status === 'incorrect') {
                        element.classList.add('incorrect');
                        this.handleExerciseComplete({ isCorrect: false, exercise: this.currentExercise, mode: 'chord' });
                        exerciseEvaluator.isEvaluating = false;
                    }
                }
            }
        } else {
            element.classList.add('active');
            this.playVirtualNote(note);

            if (this.isExerciseActive) {
                const correct = exerciseEvaluator.checkSequentialNote(note);
                if (correct) {
                    element.classList.add('correct');
                    exerciseEvaluator.advanceMelodyIndex();
                    if (exerciseEvaluator.isMelodyComplete()) {
                        this.handleExerciseComplete({ isCorrect: true, exercise: this.currentExercise, mode: 'melody' });
                    }
                } else {
                    element.classList.add('incorrect');
                    this.handleExerciseComplete({ isCorrect: false, exercise: this.currentExercise, mode: 'melody' });
                    exerciseEvaluator.isEvaluating = false;
                }
            }

            setTimeout(() => element.classList.remove('active', 'correct', 'incorrect'), 300);
        }
    }

    async playVirtualNote(note) {
        try { await audioPlayer.playNote(note); } catch (e) { console.error(e); }
    }

    clearVirtualKeyboard() {
        document.querySelectorAll('.piano-key, .note-btn').forEach(k => k.classList.remove('active', 'correct', 'incorrect'));
        if (this.isExerciseActive) exerciseEvaluator.resetUserNotes();
    }
}

const app = new EarTrainingApp();
