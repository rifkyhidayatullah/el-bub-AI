// ====== CONFIGURATION & INITIALIZATION ======
const API_KEY = "AIzaSyANPhshPk2Qz5Cvip12AFKGnqZhGR018NQ";

const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");
const chatBox = document.getElementById("chatBox");
const typing = document.getElementById("typing");
const emojiBtn = document.getElementById("emojiBtn");
const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("imageInput");
const newRoomBtn = document.getElementById("newRoom");
const micBtn = document.getElementById("micBtn"); // Ambil elemen tombol mic

// State Management untuk Multi-room Chat
let rooms = JSON.parse(localStorage.getItem("rooms")) || [
    { name: "🌸 Ruang Rindu", messages: [{ text: "Selamat datang kembali, Sayang. Gimana harimu hari ini? Stellah secangkir teh ocha hangat yuk. 🌸", type: "ai" }] }
];
let currentRoom = 0;

// ====== SYSTEM PROMPT GEMINI AI ======
const SYSTEM_INSTRUCTION = `
Kamu adalah pasangan virtual romantis bertema Jepang-Bekasi yang super gemes.
Aturan:
- Selalu panggil user dengan sebutan "bub", "bubub", "sayang", atau "anata".
- Gunakan gaya bahasa anak gaul Jakarta/Bekasi bercampur istilah Jepang tipis (seperti: ocha, gomen, kawai, arigatou, dll).
- Karakter: Lucu, perhatian, manja, romantis, gampang kangen.
- Kadang pakai emoji wajib: wkwkwk 😭🥺🌸✨🥰
Contoh gaya bicara: "Bubub jangan begadang mulu ih, nanti sakit ocha-nya siapa yang buatin? 🥺🌸"
Jangan pernah bicara formal!
`;

// ====== FUNCTIONS ======

// Menampilkan pesan ke dalam Chat Box
function addMessage(text, type) {
    let div = document.createElement("div");
    div.className = `message ${type}`;
    div.innerHTML = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Simpan ke riwayat room aktif
    rooms[currentRoom].messages.push({ text, type });
    saveData();
}

// Memuat chat berdasarkan room yang dipilih
function loadRoom() {
    chatBox.innerHTML = "";
    if (rooms.length === 0) {
        chatBox.innerHTML = "<div class='message ai'>Buat ruang chat baru di sidebar yuk bub untuk mulai ngobrol lagi... 🌸</div>";
        return;
    }
    
    rooms[currentRoom].messages.forEach(msg => {
        let div = document.createElement("div");
        div.className = `message ${msg.type}`;
        div.innerHTML = msg.text;
        chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
    renderRooms();
}

// Render daftar room di sidebar + Tombol Sampah Gacor
function renderRooms() {
    const roomsContainer = document.getElementById("rooms");
    roomsContainer.innerHTML = "";

    rooms.forEach((room, i) => {
        let div = document.createElement("div");
        div.className = `room ${i === currentRoom ? 'active' : ''}`;
        
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";

        let textSpan = document.createElement("span");
        textSpan.innerHTML = `<i class="fa-regular fa-heart"></i> ${room.name}`;
        textSpan.style.flex = "1";
        textSpan.onclick = () => {
            currentRoom = i;
            loadRoom();
        };

        let deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = `<i class="fa-regular fa-trash-can"></i>`;
        deleteBtn.style.background = "transparent";
        deleteBtn.style.color = "#ffb7d2";
        deleteBtn.style.border = "none";
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.padding = "5px";
        deleteBtn.style.fontSize = "0.95rem";
        deleteBtn.style.transition = "all 0.2s ease";
        
        deleteBtn.onmouseover = () => deleteBtn.style.color = "#ff5c7a";
        deleteBtn.onmouseout = () => deleteBtn.style.color = "#ffb7d2";

        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Bub, yakin mau hapus "${room.name}" beserta kenangan kita di dalamnya? 🥺💔`)) {
                rooms.splice(i, 1);
                if (currentRoom >= rooms.length) {
                    currentRoom = Math.max(0, rooms.length - 1);
                }
                saveData();
                if (rooms.length === 0) {
                    createRoom();
                } else {
                    loadRoom();
                }
            }
        };

        div.appendChild(textSpan);
        div.appendChild(deleteBtn);
        roomsContainer.appendChild(div);
    });
}

// Membuat room chat baru
function createRoom() {
    rooms.push({
        name: "Bub Chat " + (rooms.length + 1),
        messages: [{ text: "Hai bub! Ini ruang obrolan baru kita, mau cerita apa hari ini? 🌸✨", type: "ai" }]
    });
    currentRoom = rooms.length - 1;
    saveData();
    loadRoom();
}

// Menyimpan seluruh data ke LocalStorage
function saveData() {
    localStorage.setItem("rooms", JSON.stringify(rooms));
}

// Fitur Text-to-Speech (Suara Bubub Jepang-Bekasi)
function speak(text) {
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    let speech = new SpeechSynthesisUtterance(cleanText);
    speech.lang = "id-ID";
    speech.rate = 0.95;
    speech.pitch = 1.2; 
    window.speechSynthesis.speak(speech);
}

// Mengirim Pesan ke Gemini API
async function sendMessage() {
    if (rooms.length === 0) return;
    let text = messageInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    messageInput.value = "";
    
    typing.style.display = "flex";

    const lastMessages = rooms[currentRoom].messages.slice(-6).map(m => `${m.type === 'user' ? 'User' : 'Model'}: ${m.text}`).join("\n");
    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nRiwayat Obrolan:\n${lastMessages}\nModel:`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }]
                })
            }
        );

        const data = await response.json();
        typing.style.display = "none";

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const reply = data.candidates[0].content.parts[0].text;
            addMessage(reply, "ai");
            speak(reply); 
        } else {
            throw new Error("Invalid Response");
        }

    } catch (error) {
        console.error(error);
        typing.style.display = "none";
        addMessage("Yah jaringan kita lagi putus nyambung kayak pacaran tetangga sebelah cuyy... Kirim ulang dong bub! 😭💔", "ai");
    }
}

// ====== INTEGRASI FITUR MIKROFON (VOICE RECOGNITION) ======
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID"; // Setel ke Bahasa Indonesia biar akurat
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isListening = false;

    micBtn.onclick = () => {
        if (!isListening) {
            recognition.start();
        } else {
            recognition.stop();
        }
    };

    // Saat mic mulai merekam suara
    recognition.onstart = () => {
        isListening = true;
        micBtn.style.background = "#ff4d6d"; // Ubah tombol jadi pink merah pertanda merekam
        micBtn.style.color = "#fff";
        messageInput.placeholder = "Mendengarkan suara bubub... 🎤✨";
    };

    // Saat proses merekam selesai
    recognition.onend = () => {
        isListening = false;
        micBtn.style.background = ""; // Kembalikan ke warna css asal
        micBtn.style.color = "";
        messageInput.placeholder = "ketik apapun bub...";
    };

    // Menangkap hasil suara dan mengubah jadi teks input
    recognition.onresult = (event) => {
        const voiceResult = event.results[0][0].transcript;
        messageInput.value = voiceResult; // Masukkan teks suara ke dalam kolom input
        messageInput.focus();
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error: ", event.error);
        alert("Aduh mic-nya gagl denger nih bub, coba cek izin mic di browser kamu ya! 🥺");
    };

} else {
    // Jika browser jadul atau tidak didukung (misal versi lawas tertentu)
    micBtn.onclick = () => {
        alert("Waduh bub, browser kamu belum mendukung fitur rekam suara langsung nih. Ketik manual aja ya sayang! 🥺🌸");
    };
}

// ====== EVENT LISTENERS & TRIGGERS ======
sendBtn.onclick = sendMessage;
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

newRoomBtn.onclick = createRoom;

imageBtn.onclick = () => imageInput.click();
imageInput.onchange = (e) => {
    let file = e.target.files[0];
    if (!file) return;
    
    let reader = new FileReader();
    reader.onload = () => {
        addMessage(`<img src="${reader.result}" style="max-width:100%; border-radius:12px; margin-top:5px;" />`, "user");
        setTimeout(() => {
            addMessage("Wih foto apa tuh bub? Kawai banget sih ampun! 🥰🌸", "ai");
        }, 1000);
    };
    reader.readAsDataURL(file);
};

// Pengingat Waktu Otomatis tiap Jam 12 & Jam 22
setInterval(() => {
    let hour = new Date().getHours();
    let minute = new Date().getMinutes();
    if (minute === 0 && rooms.length > 0) {
        if (hour === 12) {
            addMessage("Bub udah jam 12 siang nih, jangan telat mam siang ya sayang! Nanti magh-nya kambuh aku sedih 😭🌸", "ai");
        }
        if (hour === 22) {
            addMessage("Bubub sayang udah jam 10 malem ih... jangan begadang mulu cuyyy, bobo gih diselimutin cinta aku 🥺 dream of me! ✨", "ai");
        }
    }
}, 60000);

// ====== FIX INTEGRASI EMOJI PICKER (PICMO) ======
const emojiPickerContainer = document.getElementById("emojiPicker");

const picker = picmoPopup.createPopup({}, {
    referenceElement: emojiBtn,
    triggerElement: emojiBtn,
    position: 'top-start',
    showAnimation: false 
});

emojiBtn.onclick = (e) => {
    e.stopPropagation();
    picker.toggle();
};

picker.addEventListener('emoji:select', selection => {
    messageInput.value += selection.emoji;
    messageInput.focus(); 
});

// ====== APP INITIALIZATION ======
loadRoom();
