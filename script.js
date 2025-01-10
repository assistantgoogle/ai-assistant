const apps = {
  whatsapp: 'https://web.whatsapp.com',
  chrome: 'https://www.google.com',
  spotify: 'https://open.spotify.com',
  gmail: 'https://mail.google.com',
  youtube: 'https://www.youtube.com',
  maps: 'https://www.google.com/maps',
};

let isListening = false;
let recognition = null;

function initializeVoiceRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    updateStatus('Speech recognition is not supported in this browser. Please use Chrome.');
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = function () {
    console.log('Voice recognition started');
    updateStatus('Listening for "Hey Assistant"...');
  };

  recognition.onresult = function (event) {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript.toLowerCase();
    console.log('Heard:', transcript);

    if (transcript.includes('hey assistant')) {
      startListeningForCommand();
    } else if (isListening) {
      handleVoiceCommand(transcript);
    }
  };

  recognition.onend = function () {
    console.log('Voice recognition ended');
    if (!isListening) {
      setTimeout(() => {
        if (recognition) {
          try {
            recognition.start();
          } catch (error) {
            console.error('Error restarting recognition:', error);
          }
        }
      }, 1000);
    }
  };

  recognition.onerror = function (event) {
    console.error('Recognition error:', event.error);
    updateStatus('Voice recognition error. Restarting...');
    setTimeout(() => {
      if (recognition) {
        try {
          recognition.start();
        } catch (error) {
          console.error('Error restarting after error:', error);
        }
      }
    }, 1000);
  };

  try {
    recognition.start();
    console.log('Voice recognition initialized');
  } catch (error) {
    console.error('Error starting recognition:', error);
    updateStatus('Failed to initialize voice recognition. Please refresh the page.');
  }
}

function startListeningForCommand() {
  isListening = true;
  updateStatus('Listening for command...');

  if (recognition) {
    recognition.stop();
  }

  setTimeout(() => {
    if (recognition) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting command recognition:', error);
      }
    }
  }, 100);

  setTimeout(() => {
    isListening = false;
    updateStatus('Listening for "Hey Assistant"...');
  }, 5000);
}

function handleVoiceCommand(command) {
  console.log('Processing command:', command);
  isListening = false;

  const commandWords = command.split(' ');
  const appToOpen = commandWords.find(word => apps[word.toLowerCase()]);

  if (appToOpen && command.includes('open')) {
    console.log(`Detected command to open: ${appToOpen}`);
    openApp(appToOpen.toLowerCase());
    addMessage(`Opening ${appToOpen}...`, 'assistant');
    updateStatus(`Opening ${appToOpen}...`);
    setTimeout(() => updateStatus('Listening for "Hey Assistant"...'), 2000);
    return;
  }

  processMessage(command);
}

function updateStatus(message) {
  const statusElement = document.getElementById('voiceStatus');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

async function processMessage(message) {
  const lowercaseMsg = message.toLowerCase();

  addMessage("Thinking...", 'assistant');

  try {
    for (const [app, url] of Object.entries(apps)) {
      if (lowercaseMsg.includes(app) && lowercaseMsg.includes('open')) {
        const response = openApp(app);
        if (response) {
          updateLastMessage(response);
          return;
        }
      }
    }

    if (message.trim().length < 2) {
      updateLastMessage("Please ask me a proper question or give me a command.");
      return;
    }

    updateLastMessage("I can help you open various applications. Try saying 'open' followed by an app name (e.g., 'open chrome'). Available apps are: WhatsApp, Chrome, Spotify, Gmail, YouTube, and Maps.");
  } catch (error) {
    console.error('Error processing message:', error);
    updateLastMessage("I encountered an error while processing your request. Please try again.");
  }
}

function openApp(app) {
  if (apps[app]) {
    window.open(apps[app], '_blank');
    return `Opening ${app.charAt(0).toUpperCase() + app.slice(1)}...`;
  }
  return null;
}

function addMessage(text, sender) {
  const messagesDiv = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateLastMessage(text) {
  const chatMessages = document.getElementById('chatMessages');
  const lastMessage = chatMessages.lastElementChild;
  if (lastMessage) {
    lastMessage.textContent = text;
  }
}

async function sendMessage() {
  const input = document.getElementById('userInput');
  const message = input.value.trim();

  if (message) {
    addMessage(message, 'user');
    input.value = '';
    await processMessage(message);
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

document.getElementById('startListeningBtn').addEventListener('click', () => {
  console.log('Initializing voice recognition...');
  initializeVoiceRecognition();
});

// Initialize voice recognition when the page loads
window.addEventListener('load', () => {
  initializeVoiceRecognition();
});

