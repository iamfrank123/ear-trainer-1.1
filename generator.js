// ====================================
// Generator Module
// Generazione accordi, scale e melodie
// ====================================

class ExerciseGenerator {
    constructor() {
        // Database accordi con intervalli
        this.chordDatabase = {
            // Triadi
            triads: {
                major: { name: 'Maggiore', intervals: [0, 4, 7] },
                minor: { name: 'Minore', intervals: [0, 3, 7] },
                diminished: { name: 'Diminuito', intervals: [0, 3, 6] },
                augmented: { name: 'Aumentato', intervals: [0, 4, 8] }
            },
            // Settime
            sevenths: {
                maj7: { name: 'Maj7', intervals: [0, 4, 7, 11] },
                min7: { name: 'Min7', intervals: [0, 3, 7, 10] },
                dom7: { name: '7', intervals: [0, 4, 7, 10] },
                m7b5: { name: 'm7b5', intervals: [0, 3, 6, 10] },
                dim7: { name: 'Dim7', intervals: [0, 3, 6, 9] }
            },
            // None
            ninths: {
                maj9: { name: 'Maj9', intervals: [0, 4, 7, 11, 14] },
                min9: { name: 'Min9', intervals: [0, 3, 7, 10, 14] },
                dom9: { name: '9', intervals: [0, 4, 7, 10, 14] }
            },
            // Undicesime
            elevenths: {
                maj11: { name: 'Maj11', intervals: [0, 4, 7, 11, 14, 17] },
                min11: { name: 'Min11', intervals: [0, 3, 7, 10, 14, 17] },
                dom11: { name: '11', intervals: [0, 4, 7, 10, 14, 17] }
            },
            // Tredicesime
            thirteenths: {
                maj13: { name: 'Maj13', intervals: [0, 4, 7, 11, 14, 17, 21] },
                min13: { name: 'Min13', intervals: [0, 3, 7, 10, 14, 17, 21] },
                dom13: { name: '13', intervals: [0, 4, 7, 10, 14, 17, 21] }
            },
            // Alterati
            altered: {
                '7sharp5': { name: '7#5', intervals: [0, 4, 8, 10] },
                '7flat5': { name: '7b5', intervals: [0, 4, 6, 10] },
                '7sharp9': { name: '7#9', intervals: [0, 4, 7, 10, 15] },
                '7flat9': { name: '7b9', intervals: [0, 4, 7, 10, 13] }
            },
            // Suspended
            suspended: {
                sus2: { name: 'Sus2', intervals: [0, 2, 7] },
                sus4: { name: 'Sus4', intervals: [0, 5, 7] },
                '7sus4': { name: '7sus4', intervals: [0, 5, 7, 10] }
            }
        };

        // Note disponibili
        this.rootNotes = [
            { midi: 0, name: 'C', displayName: 'Do' },
            { midi: 1, name: 'Db', displayName: 'Reb' },
            { midi: 2, name: 'D', displayName: 'Re' },
            { midi: 3, name: 'Eb', displayName: 'Mib' },
            { midi: 4, name: 'E', displayName: 'Mi' },
            { midi: 5, name: 'F', displayName: 'Fa' },
            { midi: 6, name: 'Gb', displayName: 'Solb' },
            { midi: 7, name: 'G', displayName: 'Sol' },
            { midi: 8, name: 'Ab', displayName: 'Lab' },
            { midi: 9, name: 'A', displayName: 'La' },
            { midi: 10, name: 'Bb', displayName: 'Sib' },
            { midi: 11, name: 'B', displayName: 'Si' }
        ];

        // Scala maggiore (intervalli)
        this.majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];
    }

    // ====================================
    // CHORD GENERATION
    // ====================================

    // Genera accordo casuale dalle categorie selezionate
    generateChord(selectedCategories, keyRootName = null) {
        console.log('🎲 generateChord chiamato con:', selectedCategories, 'Key:', keyRootName);

        // Se è specificata una tonalità, calcoliamo le note della scala (Pitch Classes)
        let scalePitchClasses = null;
        let keyRootMidi = null;

        if (keyRootName) {
            const keyRoot = this.rootNotes.find(n => n.name === keyRootName);
            if (keyRoot) {
                keyRootMidi = keyRoot.midi;
                scalePitchClasses = new Set(this.majorScaleIntervals.map(i => (keyRoot.midi + i) % 12));
                console.log(`🔑 Tonalità forzata: ${keyRootName} (Pitch Classes: ${Array.from(scalePitchClasses)})`);
            }
        }

        const availableChords = [];

        // Raccogli tutti gli accordi possibili
        for (const [category, types] of Object.entries(selectedCategories)) {
            if (this.chordDatabase[category]) {
                types.forEach(type => {
                    if (this.chordDatabase[category][type]) {
                        const chordData = this.chordDatabase[category][type];

                        // Se c'è una tonalità forzata, dobbiamo trovare quali toniche (gradi) formano accordi diatonici
                        if (scalePitchClasses) {
                            // Prova ogni nota della scala come possibile radice dell'accordo
                            this.rootNotes.forEach(root => {
                                // Se la radice non è nella scala, scarta subito
                                if (!scalePitchClasses.has(root.midi)) return;

                                // Calcola le note dell'accordo partendo da questa radice
                                const chordNotes = chordData.intervals.map(i => (root.midi + i) % 12);

                                // Controlla se TUTTE le note dell'accordo sono nella scala
                                const isDiatonic = chordNotes.every(note => scalePitchClasses.has(note));

                                if (isDiatonic) {
                                    availableChords.push({
                                        category,
                                        type,
                                        data: chordData,
                                        forcedRoot: root // Salviamo la radice specifica valida
                                    });
                                    // console.log(`  ✓ Diatonico: ${root.displayName} ${chordData.name} in ${keyRootName}`);
                                }
                            });
                        } else {
                            // Nessuna tonalità forzata: aggiungi il tipo genericamente
                            availableChords.push({
                                category,
                                type,
                                data: chordData,
                                forcedRoot: null
                            });
                        }
                    }
                });
            }
        }

        console.log(`📊 Totale opzioni accordi disponibili: ${availableChords.length}`);

        if (availableChords.length === 0) {
            if (keyRootName) {
                alert(`⚠️ Nessun accordo ${Object.values(selectedCategories).flat().join(', ')} trovato nella tonalità di ${keyRootName}! Provo a ignorare la tonalità.`);
                return this.generateChord(selectedCategories, null); // Fallback
            }
            console.error('❌ Nessun accordo disponibile!');
            return null;
        }

        // Seleziona opzione casuale
        const selection = availableChords[Math.floor(Math.random() * availableChords.length)];

        let selectedRoot;
        if (selection.forcedRoot) {
            selectedRoot = selection.forcedRoot;
        } else {
            selectedRoot = this.rootNotes[Math.floor(Math.random() * this.rootNotes.length)];
        }

        console.log(`🎯 Accordo selezionato: ${selectedRoot.displayName} ${selection.data.name}`);

        // Genera le note MIDI (ottava base: 4, MIDI 60-72)
        const baseOctave = 60; // C4

        // Per evitare che accordi con note alte vadano troppo su, o bassi troppo giù, possiamo randomizzare leggermente l'ottava base se necessario, 
        // ma per ora manteniamo C4 come base.

        const notes = selection.data.intervals.map(interval => {
            return baseOctave + selectedRoot.midi + interval;
        });

        const absolutePitchClasses = selection.data.intervals.map(interval => {
            return (selectedRoot.midi + interval) % 12;
        });

        const result = {
            root: selectedRoot,
            chordType: selection.data.name,
            fullName: `${selectedRoot.displayName} ${selection.data.name}`,
            notes: notes,
            pitchClasses: absolutePitchClasses,
            intervals: selection.data.intervals,
            category: selection.category,
            type: selection.type
        };

        return result;
    }

    // ====================================
    // SCALE GENERATION
    // ====================================

    // Genera scala maggiore
    generateMajorScale(rootName) {
        const root = this.rootNotes.find(n => n.name === rootName);
        if (!root) return null;

        const baseOctave = 60; // C4
        const notes = this.majorScaleIntervals.map(interval => {
            return baseOctave + root.midi + interval;
        });

        return {
            root: root,
            scaleName: 'Scala Maggiore',
            fullName: `Scala di ${root.displayName} Maggiore`,
            notes: notes,
            pitchClasses: this.majorScaleIntervals
        };
    }

    // ====================================
    // MELODY GENERATION
    // ====================================

    // Genera melodia casuale basata su scala
    generateMelody(scaleRoot, length = 4, startWithTonic = false) {
        const scale = this.generateMajorScale(scaleRoot);
        if (!scale) return null;

        const melody = [];
        const scaleNotes = scale.notes;

        // Prima nota
        if (startWithTonic) {
            // Prima nota sempre tonica (prima nota della scala)
            melody.push(scaleNotes[0]);
        } else {
            // Prima nota casuale
            const randomNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
            melody.push(randomNote);
        }

        // Altre note casuali
        for (let i = 1; i < length; i++) {
            const randomNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
            melody.push(randomNote);
        }

        return {
            scale: scale,
            notes: melody,
            length: length,
            fullName: `Melodia in ${scale.root.displayName} Maggiore (${length} note)${startWithTonic ? ' [Inizio con Tonica]' : ''}`
        };
    }

    // ====================================
    // COMBINED EXERCISE
    // ====================================

    // Genera esercizio combinato: accordo base + melodia
    generateCombinedExercise(scaleRoot, melodyLength = 4, startWithTonic = false) {
        const scale = this.generateMajorScale(scaleRoot);
        if (!scale) return null;

        // Genera accordo di tonica (triade maggiore)
        const intervals = [0, 4, 7];
        const absolutePitchClasses = intervals.map(interval => {
            return (scale.root.midi + interval) % 12;
        });

        const baseChord = {
            root: scale.root,
            chordType: 'Maggiore',
            fullName: `${scale.root.displayName} Maggiore`,
            notes: intervals.map(interval => 60 + scale.root.midi + interval),
            pitchClasses: absolutePitchClasses
        };

        // Genera melodia (con opzione tonica se richiesta)
        const melody = this.generateMelody(scaleRoot, melodyLength, startWithTonic);

        return {
            chord: baseChord,
            melody: melody,
            fullName: `${scale.root.displayName}: Accordo + Melodia (${melodyLength} note)${startWithTonic ? ' [Inizio con Tonica]' : ''}`,
            scale: scale
        };
    }

    // ====================================
    // HELPERS
    // ====================================

    // Ottieni tutte le categorie di accordi disponibili
    getAvailableChordCategories() {
        return Object.keys(this.chordDatabase);
    }

    // Ottieni tipi di accordi per categoria
    getChordTypesForCategory(category) {
        if (!this.chordDatabase[category]) return [];
        return Object.keys(this.chordDatabase[category]);
    }

    // Ottieni info accordo
    getChordInfo(category, type) {
        if (!this.chordDatabase[category] || !this.chordDatabase[category][type]) {
            return null;
        }
        return this.chordDatabase[category][type];
    }

    // Ottieni tutte le toniche disponibili
    getAvailableRoots() {
        return this.rootNotes;
    }

    // Converti pitch classes in nomi note
    pitchClassesToNames(pitchClasses, root) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return pitchClasses.map(pc => {
            const absolutePitch = (root.midi + pc) % 12;
            return noteNames[absolutePitch];
        });
    }

    // Verifica se due insiemi di pitch classes sono uguali
    comparePitchClasses(set1, set2) {
        if (set1.length !== set2.length) return false;

        const sorted1 = [...set1].sort((a, b) => a - b);
        const sorted2 = [...set2].sort((a, b) => a - b);

        return sorted1.every((val, index) => val === sorted2[index]);
    }
}

// ====================================
// Export singleton instance
// ====================================
const exerciseGenerator = new ExerciseGenerator();
