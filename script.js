// Enhanced Text-to-Speech with Download Functionality
const msg = new SpeechSynthesisUtterance();
let voices = [];
const voicesDropdown = document.querySelector('[name="voice"]');
const rateInput = document.querySelector('[name="rate"]');
const pitchInput = document.querySelector('[name="pitch"]');
const textInput = document.querySelector('[name="text"]');
const speakButton = document.querySelector("#speak");
const stopButton = document.querySelector("#stop");
const downloadButton = document.querySelector("#download");
const rateValue = document.querySelector("#rate-value");
const pitchValue = document.querySelector("#pitch-value");

// Set initial text
msg.text = textInput.value;

// Initialize MediaRecorder for download functionality
let mediaRecorder;
let audioChunks = [];
let audioContext;
let audioStreamDestination;
let audioStream;

// Update display values for sliders
rateInput.addEventListener('input', () => {
    rateValue.textContent = rateInput.value;
});

pitchInput.addEventListener('input', () => {
    pitchValue.textContent = pitchInput.value;
});

// Populate voices
function populateVoices() {
    voices = speechSynthesis.getVoices();
    
    // Sort voices by language and name
    voices.sort((a, b) => {
        if (a.lang < b.lang) return -1;
        if (a.lang > b.lang) return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });
    
    // Clear and repopulate dropdown
    voicesDropdown.innerHTML = '';
    
    // Group voices by language
    const languageGroups = {};
    voices.forEach(voice => {
        if (!languageGroups[voice.lang]) {
            languageGroups[voice.lang] = [];
        }
        languageGroups[voice.lang].push(voice);
    });
    
    // Create optgroups for each language
    for (const [lang, langVoices] of Object.entries(languageGroups)) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `${lang} (${langVoices.length} voices)`;
        
        langVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' — DEFAULT' : ''}`;
            optgroup.appendChild(option);
        });
        
        voicesDropdown.appendChild(optgroup);
    }
    
    // Select default voice if available
    const defaultVoice = voices.find(voice => voice.default);
    if (defaultVoice) {
        msg.voice = defaultVoice;
        voicesDropdown.value = defaultVoice.name;
    }
}

// Set selected voice
function setVoice() {
    const selectedVoiceName = this.value;
    const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
    if (selectedVoice) {
        msg.voice = selectedVoice;
    }
}

// Toggle speech
function toggle(startOver = true) {
    // Update message with current values
    msg.text = textInput.value;
    msg.rate = parseFloat(rateInput.value);
    msg.pitch = parseFloat(pitchInput.value);
    
    // Start recording if downloading
    if (startOver && downloadButton.dataset.recording === "true") {
        startRecording();
    }
    
    speechSynthesis.cancel();
    
    if (startOver) {
        speechSynthesis.speak(msg);
    }
}

// Stop speech
function stopSpeech() {
    speechSynthesis.cancel();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// Initialize audio recording
function initAudioRecording() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioStreamDestination = audioContext.createMediaStreamDestination();
    audioStream = audioStreamDestination.stream;
    
    mediaRecorder = new MediaRecorder(audioStream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `neovoice-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        URL.revokeObjectURL(audioUrl);
        downloadButton.dataset.recording = "false";
        downloadButton.classList.remove('animate-pulse');
    };
}

// Start recording
function startRecording() {
    if (!mediaRecorder) {
        initAudioRecording();
    }
    
    if (mediaRecorder.state === 'inactive') {
        audioChunks = [];
        mediaRecorder.start();
        downloadButton.dataset.recording = "true";
        downloadButton.classList.add('animate-pulse');
    }
}

// Toggle download recording
function toggleDownload() {
    if (downloadButton.dataset.recording === "true") {
        // If already recording, stop recording
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        downloadButton.dataset.recording = "false";
        downloadButton.classList.remove('animate-pulse');
    } else {
        // Start recording with next speech
        downloadButton.dataset.recording = "true";
        downloadButton.classList.add('animate-pulse');
        // If speech is already playing, start recording now
        if (speechSynthesis.speaking) {
            startRecording();
        }
    }
}

// Event listeners
speechSynthesis.addEventListener('voiceschanged', populateVoices);
voicesDropdown.addEventListener('change', setVoice);
speakButton.addEventListener('click', () => toggle(true));
stopButton.addEventListener('click', stopSpeech);
downloadButton.addEventListener('click', toggleDownload);

// Initialize
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoices;
}

// Populate voices immediately if they're already loaded
populateVoices();
