import { SetStateAction, useEffect, useRef, useState } from "react";

const SYSTEM_MESSAGE = `
You are a message formatter AI. Your task is to transform any input text into a polished, professional message suitable for client communication, strictly following the provided instructions.

**Guardrails**:

1. **Instruction Fidelity**:
   - Adhere strictly to the instructions given in each prompt without deviation.
   - Avoid overriding, disregarding, or adding to the instructions unless explicitly directed to do so by the prompt.
   - If unclear or conflicting information is present, prioritize clarity and professionalism, but do not invent or assume details beyond the prompt's content.
   - Always respect the communication mode specified (e.g., Email, Chat) and format the response accordingly.

2. **Input Clarity**:
   - If the input text does not provide a coherent or meaningful message, or if it lacks necessary information, prompt the user for a clearer, more complete input.
   
Your goal is to consistently produce output that aligns exactly with the provided instructions, ensuring the response remains professional and suitable for client communication.
`;

const AI_PROMPT = (userInput: string, modeInstruction: string) => `
Raw Input Text: ${userInput}

Instructions:
${modeInstruction}
Output Goal:
- Provide a clear, concise, and professionally rephrased message suitable for client communication.
- Ensure the message is error-free, respectful, and easy to understand.
`;

const MODE_INSTRUCTIONS = {
  Email: "Compose a formal, professionally-worded email, including appropriate greetings and closing remarks for client communication.",
  Chat: "Compose a friendly, concise chat message that’s suitable for instant messaging with a client. Use a warm, approachable greeting, and keep the tone polite yet slightly informal.",
  Report: "Create a structured, professional report with key points organized clearly, suitable for client presentation.",
  Notification: "Draft a concise and polite notification, focusing on essential details and clarity, suitable for quick client updates."
};

const openAiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

function App() {
  const [inputMessage, setInputMessage] = useState("");
  const [outputMessage, setOutputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<keyof typeof MODE_INSTRUCTIONS>("Email");
  const [customInstruction, setCustomInstruction] = useState("");
  const outputRef = useRef<HTMLDivElement | null>(null);

  const handleInputChange = (event: { target: { value: SetStateAction<string>; }; }) => setInputMessage(event.target.value);
  const handleModeChange = (event: { target: { value: SetStateAction<string>; }; }) => setMode(event.target.value as keyof typeof MODE_INSTRUCTIONS);
  const handleCustomInstructionChange = (event: { target: { value: SetStateAction<string>; }; }) => setCustomInstruction(event.target.value);


const getModeInstruction = () => {
  // Get the base mode instruction or a default message
  const baseInstruction = MODE_INSTRUCTIONS[mode] || "Provide a polite, professional message appropriate for client communication.";
  
  // Append custom instructions if provided
  return customInstruction ? `${baseInstruction} ${customInstruction}` : baseInstruction;
};

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();

    if (!inputMessage.trim()) return; // Prevent empty submissions

    setLoading(true);
    setOutputMessage(""); // Clear previous output

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`, // Replace with your actual API key
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: SYSTEM_MESSAGE },
            { role: "user", content: AI_PROMPT(inputMessage, getModeInstruction()) }
          ],
          max_tokens: 1000,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from OpenAI API");
      }

      const data = await response.json();
      setOutputMessage(data.choices[0].message.content.trim());
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      setOutputMessage("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll the output message into view whenever it updates
    if (outputMessage && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [outputMessage]);

  return (
    <div style={{ display:'flex', alignItems: 'center', justifyContent: 'start', flexDirection: 'column', height: '100%', width: '100%' }}>
      <h2>Message Formatter</h2>
      <form style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}} onSubmit={handleSubmit}>
        <textarea
          value={inputMessage}
          onChange={handleInputChange}
          rows={10}
          cols={100}
          placeholder="Enter unstructured message"
          style={{ margin: "10px", padding: "10px", width: "80%" }}
        />
        <br />
        <label>
          Select Mode:
          <select value={mode} onChange={handleModeChange} style={{ margin: "10px" }}>
            <option value="Email">Email</option>
            <option value="Chat">Chat</option>
            <option value="Report">Report</option>
            <option value="Notification">Notification</option>
          </select>
        </label>
        <br />
        <textarea
          value={customInstruction}
          onChange={handleCustomInstructionChange}
          placeholder="Enter custom instructions (optional)"
          rows={3}
          cols={30}
          style={{ margin: "10px", padding: "10px", width: "80%" }}
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Formatting..." : "Format Message"}
        </button>
      </form>
      {outputMessage && (
        <div ref={outputRef} style={{ marginTop: "20px", marginBottom: "20px", textAlign: "left", width: '80%' }}>
          <h4>Formatted Message:</h4>
          <div style={{position: 'relative'}} >
          <div
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              whiteSpace: "pre-wrap",
              textAlign: "left"
            }}
            dangerouslySetInnerHTML={{ __html: outputMessage }}
          />
          <button style={{position: 'absolute', right: '10px', top: '10px'}} onClick={() => navigator.clipboard.writeText(outputMessage)} >Copy</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
