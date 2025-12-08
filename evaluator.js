// ====================================
// Evaluator Module
// Valutazione risposte utente
// ====================================

class ExerciseEvaluator {
    constructor() {
        this.currentExercise = null;
        this.userNotes = [];
        this.startTime = null;
        this.evaluationMode = null; // 'chord', 'scale', 'melody', 'combined'
        this.expectedNoteCount = 0;
        this.onComplete = null;
        this.melodyIndex = 0; // Per melodie sequenziali
        this.isEvaluating = false;
    }

    // ====================================
    // EXERCISE SETUP
    // ====================================

    // Inizia nuovo esercizio
    startExercise(exercise, mode) {
        this.currentExercise = exercise;
        this.evaluationMode = mode;
        this.userNotes = [];
        this.startTime = Date.now();
        this.melodyIndex = 0;
        this.isEvaluating = true;

        // Determina numero note attese
        if (mode === 'chord') {
            this.expectedNoteCount = exercise.notes.length;
        } else if (mode === 'melody') {
            this.expectedNoteCount = exercise.notes.length;
        } else if (mode === 'scale') {
            this.expectedNoteCount = exercise.notes.length;
        } else if (mode === 'combined') {
            // Accordo + melodia
            this.expectedNoteCount = exercise.chord.notes.length + exercise.melody.notes.length;
        }

        console.log(`🎯 Esercizio iniziato: ${mode}`, exercise);
    }

    // Ferma valutazione
    stopEvaluation() {
        this.isEvaluating = false;
        this.userNotes = [];
        this.melodyIndex = 0;
    }

    // ====================================
    // NOTE INPUT HANDLING
    // ====================================

    // Aggiungi nota suonata dall'utente
    addNote(midiNote) {
        if (!this.isEvaluating) return;

        const pitchClass = midiNote % 12;
        const noteName = this.midiNoteToPitchName(midiNote);

        this.userNotes.push({
            midi: midiNote,
            pitchClass: pitchClass,
            name: noteName,
            timestamp: Date.now()
        });

        console.log(`🎹 Nota suonata: ${noteName} (MIDI: ${midiNote}, PC: ${pitchClass})`);

        // Check se abbastanza note per valutazione
        this.checkCompletion();
    }

    // Rimuovi nota (per correzioni input via virtual keyboard)
    removeNote(midiNote) {
        if (!this.isEvaluating) return;

        // Trova indice dell'ultima occorrenza di questa nota
        // (Utile per Chord Mode dove l'ordine non è rigido, ma rimuoviamo l'istanza specifica)
        const index = this.userNotes.map(n => n.midi).lastIndexOf(midiNote);

        if (index !== -1) {
            const removed = this.userNotes.splice(index, 1)[0];
            console.log(`🎹 Nota rimossa: ${removed.name} (MIDI: ${removed.midi})`);
        }
    }

    // Reset solo note utente (es. tasto Clear)
    resetUserNotes() {
        if (!this.isEvaluating) return;
        this.userNotes = [];
        console.log('🧹 Note utente resettate');
    }

    // Verifica singola nota in tempo reale (per feedback visivo)
    checkNote(midiNote) {
        if (!this.isEvaluating || !this.currentExercise) return 'neutral';

        const pitchClass = midiNote % 12;

        if (this.evaluationMode === 'chord' || this.evaluationMode === 'scale') {
            const expectedPitchClasses = this.currentExercise.pitchClasses;
            return expectedPitchClasses.includes(pitchClass) ? 'correct' : 'incorrect';
        }

        if (this.evaluationMode === 'melody') {
            // Per melodie è più complesso: controlliamo se la nota è nella scala/melodia in generale
            // O se vogliamo essere rigidi, controlliamo la specifica posizione (ma l'utente può sbagliare e correggere)
            // Per ora controlliamo solo se la nota fa parte delle note attese
            const expectedNotes = this.currentExercise.notes;
            const expectedPitchClasses = expectedNotes.map(n => n % 12);
            return expectedPitchClasses.includes(pitchClass) ? 'correct' : 'incorrect';
        }

        return 'neutral';
    }

    // ====================================
    // EVALUATION LOGIC
    // ====================================

    // Verifica se esercizio completato
    checkCompletion() {
        if (!this.isEvaluating || !this.currentExercise) return;

        let isComplete = false;
        let result = null;

        if (this.evaluationMode === 'chord') {
            isComplete = this.userNotes.length >= this.expectedNoteCount;
            if (isComplete) {
                result = this.evaluateChord();
            }
        } else if (this.evaluationMode === 'melody') {
            isComplete = this.userNotes.length >= this.expectedNoteCount;
            if (isComplete) {
                result = this.evaluateMelody();
            }
        } else if (this.evaluationMode === 'scale') {
            isComplete = this.userNotes.length >= this.expectedNoteCount;
            if (isComplete) {
                result = this.evaluateScale();
            }
        }

        if (isComplete && result && this.onComplete) {
            this.isEvaluating = false;
            this.onComplete(result);
        }
    }

    // Valuta accordo
    evaluateChord() {
        const expectedPitchClasses = this.currentExercise.pitchClasses;
        const userPitchClasses = [...new Set(this.userNotes.map(n => n.pitchClass))];

        // Ordina entrambi
        const sortedExpected = [...expectedPitchClasses].sort((a, b) => a - b);
        const sortedUser = [...userPitchClasses].sort((a, b) => a - b);

        // Confronta
        const isCorrect = this.arraysEqual(sortedExpected, sortedUser);

        const timeTaken = Date.now() - this.startTime;

        return {
            isCorrect: isCorrect,
            exercise: this.currentExercise,
            userAnswer: this.userNotes,
            userPitchClasses: userPitchClasses,
            expectedPitchClasses: expectedPitchClasses,
            timeTaken: timeTaken,
            mode: 'chord'
        };
    }

    // Valuta melodia
    evaluateMelody() {
        const expectedNotes = this.currentExercise.notes;
        const userNotes = this.userNotes.map(n => n.midi);

        // Per melodie: ordine conta!
        const isCorrect = this.arraysEqual(expectedNotes, userNotes);

        const timeTaken = Date.now() - this.startTime;

        return {
            isCorrect: isCorrect,
            exercise: this.currentExercise,
            userAnswer: this.userNotes,
            expectedNotes: expectedNotes,
            timeTaken: timeTaken,
            mode: 'melody'
        };
    }

    // Check se la nota corrente è quella attesa nella sequenza
    checkSequentialNote(midiNote) {
        if (!this.isEvaluating || this.evaluationMode !== 'melody') return false;

        const expectedNotes = this.currentExercise.notes;
        if (this.melodyIndex >= expectedNotes.length) return false;

        return expectedNotes[this.melodyIndex] === midiNote;
    }

    // Avanza l'indice della melodia se la nota è corretta
    advanceMelodyIndex() {
        if (this.evaluationMode === 'melody') {
            this.melodyIndex++;
        }
    }

    // Verifica se la melodia è completata
    isMelodyComplete() {
        if (this.evaluationMode !== 'melody') return false;
        return this.melodyIndex >= this.currentExercise.notes.length;
    }


    // Valuta scala
    evaluateScale() {
        // Per scale possiamo essere flessibili sull'ordine
        const expectedPitchClasses = this.currentExercise.pitchClasses;
        const userPitchClasses = [...new Set(this.userNotes.map(n => n.pitchClass))];

        const sortedExpected = [...expectedPitchClasses].sort((a, b) => a - b);
        const sortedUser = [...userPitchClasses].sort((a, b) => a - b);

        const isCorrect = this.arraysEqual(sortedExpected, sortedUser);

        const timeTaken = Date.now() - this.startTime;

        return {
            isCorrect: isCorrect,
            exercise: this.currentExercise,
            userAnswer: this.userNotes,
            userPitchClasses: userPitchClasses,
            expectedPitchClasses: expectedPitchClasses,
            timeTaken: timeTaken,
            mode: 'scale'
        };
    }

    // ====================================
    // RESET & STATE
    // ====================================

    // Reset valutatore
    reset() {
        this.currentExercise = null;
        this.userNotes = [];
        this.startTime = null;
        this.evaluationMode = null;
        this.expectedNoteCount = 0;
        this.melodyIndex = 0;
        this.isEvaluating = false;
    }

    // Ottieni stato corrente
    getState() {
        return {
            isActive: this.isEvaluating,
            mode: this.evaluationMode,
            notesReceived: this.userNotes.length,
            notesExpected: this.expectedNoteCount,
            progress: this.expectedNoteCount > 0
                ? (this.userNotes.length / this.expectedNoteCount) * 100
                : 0
        };
    }

    // ====================================
    // HELPER METHODS
    // ====================================

    // Converti MIDI note a pitch name
    midiNoteToPitchName(midiNote) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const pitchClass = midiNote % 12;
        const octave = Math.floor(midiNote / 12) - 1;
        return `${noteNames[pitchClass]}${octave}`;
    }

    // Compara array
    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((val, index) => val === arr2[index]);
    }

    // Calcola accuracy
    calculateAccuracy(expected, received) {
        if (expected.length === 0) return 0;

        let correct = 0;
        expected.forEach(note => {
            if (received.includes(note)) correct++;
        });

        return (correct / expected.length) * 100;
    }

    // Formatta tempo trascorso
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const ms = milliseconds % 1000;
        return `${seconds}.${Math.floor(ms / 100)}s`;
    }

    // Genera feedback testuale
    generateFeedback(result) {
        if (result.isCorrect) {
            const timeStr = this.formatTime(result.timeTaken);
            return {
                title: '✅ Corretto', // Removed '!' as per simpler style, but kept emoji
                message: `Ottimo lavoro! Tempo: ${timeStr}`,
                type: 'success'
            };
        } else {
            let details = '';

            if (result.mode === 'chord' || result.mode === 'scale') {
                const expectedNames = result.expectedPitchClasses.map(pc => {
                    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    return noteNames[pc];
                }).join(', ');

                details = `Note attese: ${expectedNames}`;
            } else if (result.mode === 'melody') {
                details = `Nota sbagliata! Riprova con la sequenza corretta.`;
            }

            return {
                title: 'Sbagliato', // Changed from '❌ Non corretto'
                message: details || 'Riprova!',
                type: 'error'
            };
        }
    }
}

// ====================================
// Export singleton instance
// ====================================
const exerciseEvaluator = new ExerciseEvaluator();
