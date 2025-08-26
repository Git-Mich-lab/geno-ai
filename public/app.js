const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// unique session for each user
const sessionId = crypto.randomUUID();

// Render message
function addMessage(content, sender = "bot") {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = content;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message to backend
async function sendMessage(text) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: text,
      }),
    });

    const data = await res.json();
    if (data.reply) {
      return data.reply;
    } else {
      throw new Error(data.error || "No reply");
    }
  } catch (err) {
    console.error("Chat error:", err);
    return "❌ Error talking to Geno.";
  }
}

// Handle button click
sendBtn.addEventListener("click", async () => {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  // Typing indicator
  const thinkingMsg = document.createElement("div");
  thinkingMsg.classList.add("message", "bot");
  thinkingMsg.textContent = "Geno is thinking...";
  chatBox.appendChild(thinkingMsg);

  const reply = await sendMessage(text);

  chatBox.removeChild(thinkingMsg);
  addMessage(reply, "bot");
});

// Handle Enter key (but not Shift+Enter for multiline)
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const welcomeScreen = document.getElementById("welcome-screen");
  const welcomeMessage = document.querySelector(".welcome-message");
  const chatApp = document.querySelector(".chat-app");

  // Decide greeting by time of day
  const hour = new Date().getHours();
  let greeting = "Welcome to Geno!";
  if (hour < 12) greeting = "Good morning 🌅, welcome to Geno.";
  else if (hour < 16) greeting = "Good afternoon 🌞, welcome to Geno.";
  else greeting = "Good evening 🌙, welcome to Geno.";

  welcomeMessage.textContent = greeting;

  // Show greeting then fade out after 2.5s
  setTimeout(() => {
    welcomeScreen.classList.add("fade-out");
    setTimeout(() => {
      welcomeScreen.style.display = "none";
      chatApp.classList.remove("hidden");
    }, 1000); // wait for fade animation
  }, 2500);
});
