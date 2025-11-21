import { z } from "zod";

const Step = z.object({
  explanation: z.string(),
  output: z.string(),
});

const MathReasoning = z.object({
  steps: z.array(Step),
  final_answer: z.string(),
});

// Função principal que pode ser chamada pelo seu plugin
export async function solveMathEquation(apiKey: string, equation: string) {
  try {
    // Usando fetch diretamente para evitar problemas com SDK da OpenAI no browser
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "system",
            content: "You are a helpful math tutor. Guide the user through the solution step by step. Respond in JSON format with steps array and final_answer.",
          },
          { role: "user", content: `how can I solve ${equation}` },
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return MathReasoning.parse(parsed);
    } catch (parseError) {
      // Fallback: tentar extrair estrutura do texto
      return parseMathResponse(content);
    }
    
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw new Error(`Failed to solve equation: ${error.message}`);
  }
}

// Fallback para quando o JSON não é bem formatado
function parseMathResponse(text: string) {
  const lines = text.split('\n').filter(line => line.trim());
  const steps = [];
  let finalAnswer = '';
  
  for (const line of lines) {
    if (line.includes('x =') || line.toLowerCase().includes('answer:')) {
      finalAnswer = line.trim();
    } else if (line.trim()) {
      steps.push({
        explanation: line.trim(),
        output: ''
      });
    }
  }
  
  return {
    steps,
    final_answer: finalAnswer || 'Unable to determine final answer'
  };
}