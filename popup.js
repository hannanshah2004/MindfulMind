document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('startButton');
  const minutesInput = document.getElementById('minutes');
  const secondsInput = document.getElementById('seconds');
  const timerDisplay = document.getElementById('timerDisplay');
  const motivationOptions = document.getElementById('motivationOptions');
  const generateQuoteButton = document.getElementById('generateQuote');
  const pauseResumeButton = document.getElementById('pauseResumeButton');

  let countdownTime = 0;
  let isPaused = false;

  startButton.addEventListener('click', function () {
    const minutes = parseInt(minutesInput.value);
    const seconds = parseInt(secondsInput.value);

    if (isNaN(minutes) || isNaN(seconds)) {
      alert('Please enter valid minutes and seconds.');
      return;
    }

    countdownTime = minutes * 60 + seconds;

    if (!isPaused) {
      chrome.runtime.sendMessage({
        action: 'startCountdown',
        totalTimeInSeconds: countdownTime,
      });
    }
  });

  generateQuoteButton.addEventListener('click', function () {
    const selectedOption = motivationOptions.value;
    getMotivationalQuote(selectedOption);
  });

  async function getMotivationalQuote(category) {
    chrome.runtime.sendMessage({
      action: 'getMotivationalQuote',
      category: category,
    }, async function (response) {
      if (response.error) {
        console.error(response.error);
        return;
      }
  
      const selectedOption = motivationOptions.value;
      const quote = await generateQuote(selectedOption);
      timerDisplay.textContent = quote;
    });
  }
  
  async function generateQuote(category) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'getMotivationalQuote',
        category: category,
      }, function (response) {
        if (response.error) {
          reject(response.error);
          return;
        }
  
        resolve(response.quote);
      });
    });
  }
  

  pauseResumeButton.addEventListener('click', function () {
    isPaused = !isPaused; // Toggle the pause state first
    pauseResumeButton.textContent = isPaused ? 'Resume' : 'Pause'; // Update button text based on new state
    chrome.runtime.sendMessage({ action: 'togglePause' }); // Send message to background script
  });  
  

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'updateTimerDisplay' && !isPaused) {
      countdownTime = message.currentTime;

      if (countdownTime <= 0) {
        clearInterval(countdownInterval);
        timerDisplay.textContent = 'Time\'s up!';
        const countdownSound = new Audio('sound.mp3');
        countdownSound.play(); // Play the sound
      } else {
        const minutesLeft = Math.floor(countdownTime / 60);
        const secondsLeft = countdownTime % 60;
        timerDisplay.textContent = `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
      }
    }
  });

  function startCountdown() {
    chrome.runtime.sendMessage({
      action: 'startCountdown',
      totalTimeInSeconds: countdownTime,
    });
  }
});
