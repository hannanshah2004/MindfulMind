let countdownInterval;
let countdownTime = 0;
let isPaused = false;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'startCountdown') {
    countdownTime = message.totalTimeInSeconds;

    clearInterval(countdownInterval);

    countdownInterval = setInterval(function () {
      if (isPaused) {
        return; // If paused, do not decrement the countdownTime
      }

      if (countdownTime <= 0) {
        clearInterval(countdownInterval);
        playCountdownSound();
        chrome.browserAction.setBadgeText({ text: '' }); // Clear badge text
        return;
      }

      updateBadge();
      countdownTime--;
    }, 1000);
  } else if (message.action === 'togglePause') {
    isPaused = !isPaused;
    updateBadge();
  } else if (message.action === 'getMotivationalQuote') {
    const category = message.category;
    generateQuote(category)
      .then(quote => {
        sendResponse({ quote });
      })
      .catch(error => {
        console.error('Error generating quote:', error);
        sendResponse({ error: 'An error occurred while generating the quote.' });
      });
    return true; // Required to indicate that sendResponse will be called asynchronously
  }
});

async function generateQuote(category) {
  const response = await fetchOpenAI(category);
  return response.choices[0].message.content;
}

async function fetchOpenAI(category) {
  const apiKey = 'YOURAPIKEY'; // Replace with your actual API key
  const url = 'https://api.openai.com/v1/chat/completions';
  const data = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: `You are a ${category}` },
      { role: 'user', content: 'give me a motivational quote' },
    ],
    temperature: 1,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

function updateBadge() {
  if (!isPaused) {
    const minutesLeft = Math.floor(countdownTime / 60);
    const secondsLeft = countdownTime % 60;
    const badgeText = `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
    chrome.browserAction.setBadgeText({ text: badgeText });
  }
}

function playCountdownSound() {
  const audio = new Audio(chrome.runtime.getURL('sound.mp3'));
  audio.play();
}
