// ====================================
// Audio Synthesis Module
// Riproduzione sonora con Tone.js Piano Sampler
// ====================================

class AudioPlayer {
    constructor() {
        this.piano = null;
        this.isInitialized = false;
        this.isLoading = false;
        this.activeNotes = [];

        // Configurazione
        this.config = {
            volume: -10, // dB
            noteDuration: 1.5, // secondi per accordi
            release: 2 // tempo di rilascio
        };
    }

    // ====================================
    // INITIALIZATION
    // ====================================

    // Inizializza Tone.js e carica piano samples
    async initialize() {
        if (this.isInitialized) return true;
        if (this.isLoading) {
            // Aspetta che il caricamento in corso finisca
            await new Promise(resolve => {
                const checkLoaded = setInterval(() => {
                    if (this.isInitialized || !this.isLoading) {
                        clearInterval(checkLoaded);
                        resolve();
                    }
                }, 100);
            });
            return this.isInitialized;
        }

        this.isLoading = true;

        try {
            // Verifica che Tone.js sia caricato
            if (typeof Tone === 'undefined') {
                throw new Error('Tone.js non caricato. Assicurati che lo script sia incluso nell\'HTML.');
            }

            console.log('🎹 Inizializzazione piano sampler...');

            // Crea Sampler con samples di pianoforte
            // Useremo un set base di note campionate
            this.piano = new Tone.Sampler({
                urls: {
                    A0: "A0.mp3",
                    C1: "C1.mp3",
                    "D#1": "Ds1.mp3",
                    "F#1": "Fs1.mp3",
                    A1: "A1.mp3",
                    C2: "C2.mp3",
                    "D#2": "Ds2.mp3",
                    "F#2": "Fs2.mp3",
                    A2: "A2.mp3",
                    C3: "C3.mp3",
                    "D#3": "Ds3.mp3",
                    "F#3": "Fs3.mp3",
                    A3: "A3.mp3",
                    C4: "C4.mp3",
                    "D#4": "Ds4.mp3",
                    "F#4": "Fs4.mp3",
                    A4: "A4.mp3",
                    C5: "C5.mp3",
                    "D#5": "Ds5.mp3",
                    "F#5": "Fs5.mp3",
                    A5: "A5.mp3",
                    C6: "C6.mp3",
                    "D#6": "Ds6.mp3",
                    "F#6": "Fs6.mp3",
                    A6: "A6.mp3",
                    C7: "C7.mp3",
                    "D#7": "Ds7.mp3",
                    "F#7": "Fs7.mp3",
                    A7: "A7.mp3",
                    C8: "C8.mp3"
                },
                release: this.config.release,
                baseUrl: "https://tonejs.github.io/audio/salamander/"
            }).toDestination();

            // Imposta volume
            this.piano.volume.value = this.config.volume;

            // Aspetta che i samples siano caricati
            await Tone.loaded();

            this.isInitialized = true;
            this.isLoading = false;
            console.log('✅ Piano sampler caricato con successo');
            return true;

        } catch (error) {
            console.error('❌ Errore inizializzazione piano:', error);
            this.isLoading = false;
            this.isInitialized = false;
            return false;
        }
    }

    // ====================================
    // NOTE PLAYBACK
    // ====================================

    // Converti numero MIDI in nome nota Tone.js
    midiToNoteName(midiNote) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteName = noteNames[midiNote % 12];
        return `${noteName}${octave} `;
    }

    // Riproduci singola nota
    async playNote(midiNote, duration = 1.5, startTime = 0) {
        if (!this.isInitialized) {
            console.warn('⚠️ Piano non inizializzato');
            return;
        }

        // Avvia contesto audio (richiesto da browser)
        await Tone.start();

        const noteName = this.midiToNoteName(midiNote);
        const now = Tone.now();
        const actualStartTime = now + startTime;

        // Trigger nota
        this.piano.triggerAttackRelease(noteName, duration, actualStartTime);

        console.log(`🎹 Nota: ${noteName} (MIDI: ${midiNote})`);
    }

    // ====================================
    // CHORD PLAYBACK
    // ====================================

    // Riproduci accordo (tutte le note simultaneamente)
    async playChord(midiNotes, duration = null) {
        if (!this.isInitialized) {
            console.warn('⚠️ Piano non inizializzato');
            return;
        }

        await Tone.start();

        const actualDuration = duration || this.config.noteDuration;
        const noteNames = midiNotes.map(midi => this.midiToNoteName(midi));

        console.log(`🎵 Riproduco accordo: `, noteNames);

        // Riproduci tutte le note insieme
        const now = Tone.now();
        noteNames.forEach(note => {
            this.piano.triggerAttackRelease(note, actualDuration, now);
        });

        // Aspetta che l'accordo finisca
        const totalDuration = (actualDuration + this.config.release) * 1000;
        return new Promise(resolve => setTimeout(resolve, totalDuration));
    }

    // ====================================
    // MELODY PLAYBACK
    // ====================================

    // Riproduci melodia (nota dopo nota in sequenza)
    async playMelody(midiNotes, speed = 2) {
        if (!this.isInitialized) {
            console.warn('⚠️ Piano non inizializzato');
            return;
        }

        await Tone.start();

        const noteDuration = 0.5;           // Durata singola nota
        const noteInterval = 1 / speed;     // Intervallo tra note (speed = note/sec)

        console.log(`🎵 Riproduco melodia: `, midiNotes.map(m => this.midiToNoteName(m)), `Speed: ${speed} note / sec`);

        const now = Tone.now();

        // Riproduci note in sequenza
        midiNotes.forEach((midiNote, index) => {
            const noteName = this.midiToNoteName(midiNote);
            const startTime = now + (index * noteInterval);
            this.piano.triggerAttackRelease(noteName, noteDuration, startTime);
        });

        // Calcola tempo totale melodia
        const totalDuration = ((midiNotes.length * noteInterval) + noteDuration + this.config.release) * 1000;

        // Ritorna promise
        return new Promise(resolve => setTimeout(resolve, totalDuration));
    }

    // ====================================
    // SCALE PLAYBACK
    // ====================================

    // Riproduci scala (note in sequenza come melodia)
    async playScale(midiNotes, speed = 2) {
        return this.playMelody(midiNotes, speed);
    }

    // ====================================
    // COMBINED EXERCISE PLAYBACK
    // ====================================

    // Riproduci esercizio combinato (accordo + melodia)
    async playCombinedExercise(chordNotes, melodyNotes, melodySpeed = 2) {
        if (!this.isInitialized) {
            console.warn('⚠️ Piano non inizializzato');
            return;
        }

        await Tone.start();

        console.log(`🎵 Riproduco esercizio combinato`);

        // 1. Suona accordo
        await this.playChord(chordNotes, 2.0);

        // 2. Pausa breve
        await this.wait(0.5);

        // 3. Suona melodia
        await this.playMelody(melodyNotes, melodySpeed);
    }

    // ====================================
    // EXERCISE PLAYBACK (Universal)
    // ====================================

    // Riproduci qualsiasi tipo di esercizio
    async playExercise(exercise, mode, speed = 2) {
        // Inizializza se necessario
        if (!this.isInitialized) {
            const success = await this.initialize();
            if (!success) {
                alert('⚠️ Impossibile caricare il piano. Verifica la connessione internet.');
                return;
            }
        }

        await Tone.start();

        if (mode === 'chord') {
            return this.playChord(exercise.notes);
        }
        else if (mode === 'melody') {
            return this.playMelody(exercise.notes, speed);
        }
        else if (mode === 'scale') {
            return this.playScale(exercise.notes, speed);
        }
        else if (mode === 'combined') {
            return this.playCombinedExercise(
                exercise.chord.notes,
                exercise.melody.notes,
                speed
            );
        }
        else {
            console.error('❌ Modalità non riconosciuta:', mode);
        }
    }

    // ====================================
    // CONTROL METHODS
    // ====================================

    // Ferma tutti i suoni attivi
    stopAll() {
        if (this.piano) {
            this.piano.releaseAll();
        }
    }

    // Helper: attendi X secondi
    wait(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    // ====================================
    // CONFIGURATION
    // ====================================

    // Imposta volume
    setVolume(volumeDb) {
        if (this.piano) {
            this.piano.volume.value = volumeDb;
            this.config.volume = volumeDb;
            console.log(`🔊 Volume: ${volumeDb} dB`);
        }
    }

    // Ottieni info
    getInfo() {
        return {
            isInitialized: this.isInitialized,
            isLoading: this.isLoading,
            library: 'Tone.js',
            sampler: 'Salamander Piano',
            config: this.config
        };
    }
}

// ====================================
// Export singleton instance
// ====================================
const audioPlayer = new AudioPlayer();
