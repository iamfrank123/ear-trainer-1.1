// ====================================
// MIDI Handler Module
// Gestione Web MIDI API e rilevamento dispositivi
// ====================================

class MIDIHandler {
    constructor() {
        this.midiAccess = null;
        this.activeInputs = [];
        this.onNoteOn = null;
        this.onNoteOff = null;
        this.isConnected = false;
        this.currentNotes = new Set();
    }

    // Inizializza MIDI
    async initialize() {
        try {
            if (!navigator.requestMIDIAccess) {
                throw new Error('Web MIDI API non supportata in questo browser');
            }

            this.midiAccess = await navigator.requestMIDIAccess();
            this.setupInputs();
            this.setupDeviceMonitoring();

            console.log('✅ MIDI inizializzato con successo');
            return true;
        } catch (error) {
            console.error('❌ Errore inizializzazione MIDI:', error);
            this.showMIDIError(error.message);
            return false;
        }
    }

    // Setup dispositivi MIDI input
    setupInputs() {
        this.activeInputs = [];

        for (let input of this.midiAccess.inputs.values()) {
            this.activeInputs.push(input);
            input.onmidimessage = this.handleMIDIMessage.bind(this);
            console.log(`🎹 Dispositivo MIDI connesso: ${input.name}`);
        }

        this.updateConnectionStatus();
    }

    // Monitora connessione/disconnessione dispositivi
    setupDeviceMonitoring() {
        this.midiAccess.onstatechange = (event) => {
            console.log(`🔄 Cambio stato MIDI: ${event.port.name} - ${event.port.state}`);
            this.setupInputs();
        };
    }

    // Gestisce messaggi MIDI in arrivo
    handleMIDIMessage(message) {
        const [status, note, velocity] = message.data;
        const command = status >> 4;
        const channel = status & 0xf;

        // Note On (command = 9)
        if (command === 9 && velocity > 0) {
            this.currentNotes.add(note);
            if (this.onNoteOn) {
                this.onNoteOn({
                    note: note,
                    velocity: velocity,
                    channel: channel,
                    noteName: this.midiNoteToName(note),
                    timestamp: Date.now()
                });
            }
        }
        // Note Off (command = 8 o Note On con velocity = 0)
        else if (command === 8 || (command === 9 && velocity === 0)) {
            this.currentNotes.delete(note);
            if (this.onNoteOff) {
                this.onNoteOff({
                    note: note,
                    channel: channel,
                    noteName: this.midiNoteToName(note),
                    timestamp: Date.now()
                });
            }
        }
    }

    // Converti numero MIDI in nome nota
    midiNoteToName(midiNote) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteName = noteNames[midiNote % 12];
        return `${noteName}${octave}`;
    }

    // Converti nome nota in numero MIDI
    nameToMIDINote(noteName) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        };

        // Estrai nome nota e ottava
        const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
        if (!match) return null;

        const [, note, octave] = match;
        return (parseInt(octave) + 1) * 12 + noteMap[note];
    }

    // Ottieni solo la classe di altezza (pitch class) senza ottava
    getPitchClass(midiNote) {
        return midiNote % 12;
    }

    // Ottieni nome nota senza ottava
    getPitchClassName(midiNote) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return noteNames[midiNote % 12];
    }

    // Aggiorna stato connessione UI
    updateConnectionStatus() {
        this.isConnected = this.activeInputs.length > 0;

        const statusElement = document.getElementById('midiStatus');
        if (statusElement) {
            if (this.isConnected) {
                statusElement.className = 'status-badge status-connected';
                statusElement.innerHTML = `
                    <span class="status-dot"></span>
                    <span class="status-text">MIDI Connesso (${this.activeInputs.length})</span>
                `;
            } else {
                statusElement.className = 'status-badge status-disconnected';
                statusElement.innerHTML = `
                    <span class="status-dot"></span>
                    <span class="status-text">MIDI Non Connesso</span>
                `;
            }
        }
    }

    // Mostra errori MIDI
    showMIDIError(message) {
        const statusElement = document.getElementById('midiStatus');
        if (statusElement) {
            statusElement.className = 'status-badge status-disconnected';
            statusElement.innerHTML = `
                <span class="status-dot"></span>
                <span class="status-text">Errore MIDI</span>
            `;
            statusElement.title = message;
        }

        // Log to console for debugging
        console.error('MIDI Error:', message);
    }

    // Ottieni note attualmente premute
    getCurrentNotes() {
        return Array.from(this.currentNotes);
    }

    // Reset note correnti
    resetCurrentNotes() {
        this.currentNotes.clear();
    }

    // Verifica se dispositivo è connesso
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            deviceCount: this.activeInputs.length,
            devices: this.activeInputs.map(input => ({
                name: input.name,
                manufacturer: input.manufacturer,
                id: input.id
            }))
        };
    }
}

// ====================================
// Export singleton instance
// ====================================
const midiHandler = new MIDIHandler();

// Auto-inizializza quando DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        midiHandler.initialize();
    });
} else {
    midiHandler.initialize();
}
