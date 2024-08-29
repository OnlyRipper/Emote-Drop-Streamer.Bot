const ADDRESS = "127.0.0.1"; // IP of SB instance
const PORT = "8080"; // Port of SB instance
const ENDPOINT = "/"; // Endpoint of SB instance
const WEBSOCKET_URI = `ws://${ADDRESS}:${PORT}${ENDPOINT}`;
const EVENT_LISTENER_NAMEID = "Emote Rain"; // Custom event listener ID
const ws = new WebSocket(WEBSOCKET_URI);

let count, userName, args, response, subAction, userId, defaultEmote, emoteUrl, color, animationFrameId;
let actionName = "{GAMES} Parachute Start"
let parentName = "{Websocket} Main Trigger"
const replayAction = "{GAMES} Parachute Receive"

const gameContainer = document.getElementById('game-container');
const pingu = document.getElementById('pingu');
const pinguParachute = document.getElementById('pingu-parachute');
const target = document.getElementById('target');
const refreshButton = document.getElementById('refresh-button');

const containerWidth = 1920; 
const containerHeight = 1080; 
const pinguWidth = 100;      
const pinguHeight = 100;     
const parachuteOffset = -140; 
const parachuteOffsetX = -40; 
const targetWidth = 400; 
const targetHeight = 60;   

let pinguX = Math.random() * (containerWidth - pinguWidth);
let pinguY = 0;
let pinguVX = Math.random() * 4 - 1;

const fallSpeedMultiplier = 1; 

let pinguVY = (Math.random() * 2 + 1) * fallSpeedMultiplier; 
const gravity = 0.1 * fallSpeedMultiplier; 

let targetX = Math.random() * (containerWidth - targetWidth); 
let score = 0;
let dropSpeed = 0;

let missedTarget = false; 
let isAnimationRunning = false; 
let _isAnimationRunning = false; 

function setupWebSocket() {
  console.log("Attempting to connect to Streamer.bot...");

  ws.addEventListener("open", (event) => {
    console.log("Connected to Streamer.bot");

    ws.send(
      JSON.stringify({
        request: "Subscribe",
        id: EVENT_LISTENER_NAMEID,
        events: {
          Raw: ["Action", "SubAction"], 
        },
      })
    );
  });

  ws.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.addEventListener("close", (event) => {
    console.log("WebSocket connection closed:", event);
  });
}
function handleWebSocketMessages() {
  ws.addEventListener("message", (event) => {
    if (!event.data) return;

    const jsonData = JSON.parse(event.data);

    if (jsonData.id === EVENT_LISTENER_NAMEID) return;
    if (jsonData.id === "DoAction") return;

    const argumentsData = jsonData.data.arguments;
    args = jsonData.data.arguments;
    
    if (argumentsData && jsonData.data.parentName === parentName && "defaultEmote" in args) {
      console.log("JSON passed: ", jsonData);

      subAction = jsonData.data.name; // Execute Code

      chatEmote = argumentsData.input0;
      userName = argumentsData.user;
      userId = argumentsData.userId;
      command = argumentsData.commandName;
      dropSpeed = argumentsData.dropSpeed;
      const colorParachute = argumentsData.colorParachute;
      const colorTarget = argumentsData.colorTarget;

      console.log("UserName:", userName);

      if("defaultEmote" in args && jsonData.data.parentName === parentName && jsonData.data.name)
        {
        defaultEmote = argumentsData.defaultEmote;
        console.log("parent name: ", jsonData.data.parentName);
        }
      else{
        console.log("Json Error: ", jsonData);
        console.log("parent name: ", jsonData.data.parentName);
        return;
      }

      if (!_isAnimationRunning)   //Set the outcome
      {
        // Set rew color:
        if ("colorParachute" in args){
          const colorParachuteNew = document.getElementById('pingu-parachute');
          colorParachuteNew.style.filter = `hue-rotate(${colorParachute}deg) saturate(100%) brightness(100%)`;
          console.log("New color set P: ", colorParachute);

        }
        if ("colorTarget" in args)
        {
          const colorTargetNew = document.getElementById('target');
          colorTargetNew.style.filter = `hue-rotate(${colorTarget}deg) saturate(120%) brightness(100%)`;
          console.log("New color set T: ", colorTarget);
        }
        
        
        emoteName = chatEmote;
        _isAnimationRunning = true;
        fetchEmotes(emoteName, defaultEmote, score, userName, userId);
        console.log(emoteName, defaultEmote, score, userName, userId);
      }
      else if (_isAnimationRunning)
      {
        console.log("Animation is still running");
      }
    }

  });

      async function fetchEmotes(emoteName, defaultEmote, score, userName, userId) {
        try {

        const emoteSetResponse = await fetch(`https://7tv.io/v3/users/twitch/${userId}`);
        const emoteSetData = await emoteSetResponse.json();
        console.log('Emote Set Data:', emoteSetData);

        const emoteSetId = emoteSetData.emote_set.id;
        console.log('Emote Set ID:', emoteSetId);

        const response = await fetch(`https://7tv.io/v3/emote-sets/${emoteSetId}`);
        const data = await response.json();
        console.log('User Emote Set API Response:', data);

        let emote = data.emotes.find(e => e.name === emoteName);
        if (emote) {
            console.log('Found Emote in User Set:', emote);

            const emoteUrl = `https://cdn.7tv.app/emote/${emote.id}/4x.webp`;
            pingu.src = emoteUrl; // Update pingu's source to the emote's URL
            console.log('Emote URL:', emoteUrl);

            pinguParachute.style.display = 'block';
            }
          else if(!emote)
            {
              console.log(`Emote '${emoteName}' not found in user emote set, searching globally...`);
  
              const globalResponse = await fetch(`https://7tv.io/v3/emote-sets/global`);
              const globalData = await globalResponse.json();
  
              console.log('Global Emote Set API Response:', globalData);
              emote = globalData.emotes.find(e => e.name === emoteName);
  
                  if (emote) 
                  {
                  console.log('Found Emote in Global Set:', emote);
  
                  const emoteUrl = `https://cdn.7tv.app/emote/${emote.id}/4x.webp`;
                  pingu.src = emoteUrl;
                  console.log('Global Emote URL:', emoteUrl);
  
                  pinguParachute.style.display = 'block';
                  }
                  else if (emoteName !== defaultEmote) 
                  {
                    emote = data.emotes.find(e => e.name === defaultEmote); 
                    const emoteUrl = `https://cdn.7tv.app/emote/${emote.id}/4x.webp`;
                    pingu.src = emoteUrl;
                    console.log('Default emote set:', defaultEmote);
                  }
          else 
              {
                  console.log('Emote not found globally or invalid response:', emoteName);
                  const emoteUrl = 'https://cdn.7tv.app/emote/60ae9c2eac03cad607893b3d/4x.webp'; // Fallback emote
                  pingu.src = emoteUrl;
              }
            }
          }
         catch (error) {
        console.error('Error fetching emote:', error);
        pinguParachute.style.display = 'none';
    }
    update(score, userName, userId);
  }
  //emtoes end ~~~

  function update() {
    const gameContainer = document.getElementById('game-container');
    gameContainer.style.display = 'block'; // Ensure the container is visible

    pinguX += pinguVX;
    pinguY += pinguVY + dropSpeed;

    if (pinguX <= 0 || pinguX + pinguWidth >= containerWidth) {
        pinguVX *= -1; // Reverse direction on bounce
    }

    const pinguRect = pingu.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const visualTargetHeight = targetHeight * 0.5; // Adjust as needed

    if (pinguRect.bottom >= targetRect.top + visualTargetHeight && pinguRect.top <= targetRect.bottom) {
        const pinguCenterX = pinguRect.left + pinguRect.width / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const distance = Math.abs(pinguCenterX - targetCenterX);
        const maxDistance = targetRect.width / 2;

        if (distance <= maxDistance) {
            score = Math.max(1, Math.round(100 * (1 - (distance / maxDistance) ** 2)));
            console.log('Score:', score);

            cancelAnimationFrame(animationFrameId);

            setTimeout(() => {
                _isAnimationRunning = false; // Set to false immediately
                console.log('Animation ended after hitting the target');
                gameContainer.style.display = 'none';
                resetPingu(); // Ensure reset is called after hiding
                back(score, userName, userId);
            }, 3000);

            return; // Exit the update loop
        }
    } else if (pinguY >= containerHeight) {
        if (pinguY < containerHeight + pinguHeight + 69) { // Check if Pingu is still partially visible
            pinguY += pinguVY; // Keep falling
            pingu.style.top = `${pinguY}px`; // Ensure the position is updated
        } else {
            cancelAnimationFrame(animationFrameId);
            _isAnimationRunning = false; // Set to false immediately
            console.log('Pingu completely off-screen');
            
            setTimeout(() => {
                console.log('Starting reset process');
                gameContainer.style.display = 'none';
                resetPingu(); // Ensure reset is called after hiding
                console.log('resetPingu called');
            }, 3000);

            return; // Exit the update loop
        }
    }

    // Update positions and continue animation
    pingu.style.left = `${pinguX}px`;
    pingu.style.top = `${pinguY}px`;
    pinguParachute.style.left = `${pinguX + parachuteOffsetX}px`; 
    pinguParachute.style.top = `${pinguY + parachuteOffset}px`; 
    target.style.left = `${targetX}px`; 

    animationFrameId = requestAnimationFrame(update);
}

function resetPingu() {
    console.log('Resetting Pingu...');
    // Ensure all variables are reset correctly
    pinguX = Math.random() * (containerWidth - pinguWidth);

    pinguY = -pinguHeight; // Start above the container to fall in view

    pinguVX = Math.random() * 4 - 2;
    console.log('Pingu position reset to', pinguX, pinguY);
    targetX = Math.random() * (containerWidth - targetWidth); // Re-randomize the target's X position

    // Ensure all styles are reset
    pingu.style.left = `${pinguX}px`;
    pingu.style.top = `${pinguY}px`;
    pinguParachute.style.left = `${pinguX + parachuteOffsetX}px`; // Apply X offset to parachute
    pinguParachute.style.top = `${pinguY + parachuteOffset}px`; // Apply Y offset to parachute
    target.style.left = `${targetX}px`;

    // Log for debugging
    console.log('Pingu position reset to', pinguX, pinguY);
}

//Send Back to Streamer.Bot:
  
function back(score, userName, userId) {
  ws.send(JSON.stringify({
    request: 'DoAction',
    id: 'DoAction',
    action: {
        name: replayAction,
    },
    args: {
      score: score,
      userId: userId,
      user: userName,
    },
  }));
}

}

setupWebSocket();
handleWebSocketMessages();