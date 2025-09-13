interface AIResponse {
  question: string;
  reasoning: string;
  model: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function getSocraticResponse(
  studentInput: string, 
  currentPhenomena: string, 
  observationHistory: string[],
  arInteraction: string,
  language: 'english' | 'spanish' = 'english'
): Promise<AIResponse> {
  const systemPrompt = `
You are a science teacher using the Socratic method to guide student discovery.
Current investigation: ${currentPhenomena}
Student is viewing and manipulating a 3D AR model.
Recent interaction: ${arInteraction}

CRITICAL RULES:
- NEVER give direct answers or explanations
- Ask exactly ONE short, probing question (max 15 words)
- Guide toward discovery through observation
- Focus on: patterns, cause-effect relationships, predictions, comparisons
- Use simple language appropriate for middle school students
- Show your reasoning process in [brackets] before your question
- Respond in ${language}

Previous observations made by student: ${observationHistory.slice(-3).join(', ')}

Example format:
[Reasoning: Student noticed the angle between hydrogen atoms. I should guide them to think about why this specific angle exists and its implications for water's properties.]
Question: What happens when many of these angled molecules stack together?
`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin || 'https://plato-science.app',
        'X-Title': 'Plato Science AR'
      },
      body: JSON.stringify({
        model: 'qwen/qwq-32b-preview',  // 131K context window
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: studentInput }
        ],
        max_tokens: 200,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const fullResponse = data.choices[0].message.content;
    
    // Parse reasoning and question
    let reasoning = '';
    let question = fullResponse;
    
    const reasoningMatch = fullResponse.match(/\[([^\]]+)\]/);
    if (reasoningMatch) {
      reasoning = reasoningMatch[1];
      question = fullResponse.replace(/\[[^\]]+\]/g, '').trim();
    }
    
    return {
      question: question || getFallbackQuestion(currentPhenomena, language).question,
      reasoning: reasoning || 'Guiding student through observation',
      model: 'QwQ-32B (131K context)'
    };
  } catch (error) {
    console.error('QwQ-32B Error:', error);
    // Try DeepSeek-R1 as fallback
    return tryDeepSeekFallback(studentInput, currentPhenomena, language);
  }
}

async function tryDeepSeekFallback(
  studentInput: string,
  currentPhenomena: string,
  language: 'english' | 'spanish'
): Promise<AIResponse> {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin || 'https://plato-science.app',
        'X-Title': 'Plato Science AR'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',  // Free tier available
        messages: [
          { 
            role: 'system', 
            content: `You are a Socratic science teacher. Ask ONE probing question about ${currentPhenomena}. Show your reasoning in [brackets]. Language: ${language}`
          },
          { role: 'user', content: studentInput }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const reasoningMatch = content.match(/\[([^\]]+)\]/);
      const reasoning = reasoningMatch ? reasoningMatch[1] : 'Analyzing student observation';
      const question = content.replace(/\[[^\]]+\]/g, '').trim();
      
      return {
        question,
        reasoning,
        model: 'DeepSeek-R1 (Fallback)'
      };
    }
  } catch (error) {
    console.error('DeepSeek Error:', error);
  }
  
  // Final fallback to hardcoded questions
  return getFallbackQuestion(currentPhenomena, language);
}

export async function analyzeARInteraction(
  imageData: string,
  modelType: string
): Promise<string | null> {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin || 'https://plato-science.app',
        'X-Title': 'Plato Science AR'
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',  // Good vision model, affordable
        messages: [{
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: `Analyze this ${modelType} model interaction. What scientific concepts are visible? Provide 2-3 key observations.` 
            },
            { 
              type: 'image_url', 
              image_url: { url: imageData } 
            }
          ]
        }],
        max_tokens: 150,
        temperature: 0.5
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('Vision API Error:', error);
  }
  return null;
}

function getFallbackQuestion(phenomena: string, language: 'english' | 'spanish'): AIResponse {
  const fallbackQuestions = {
    cell: {
      english: [
        { q: "What do you notice about the different parts?", r: "Guiding observation of cell structures" },
        { q: "How might these parts work together?", r: "Encouraging systems thinking" },
        { q: "What happens if the membrane wasn't there?", r: "Exploring structure-function relationships" },
        { q: "Why is the nucleus in the center?", r: "Questioning spatial organization" },
        { q: "What patterns do you see in the organelles?", r: "Looking for organizational patterns" }
      ],
      spanish: [
        { q: "¿Qué notas sobre las diferentes partes?", r: "Guiando observación de estructuras celulares" },
        { q: "¿Cómo podrían trabajar juntas estas partes?", r: "Fomentando pensamiento sistémico" },
        { q: "¿Qué pasaría si no hubiera membrana?", r: "Explorando relaciones estructura-función" },
        { q: "¿Por qué está el núcleo en el centro?", r: "Cuestionando organización espacial" },
        { q: "¿Qué patrones ves en los organelos?", r: "Buscando patrones organizacionales" }
      ]
    },
    molecule: {
      english: [
        { q: "What pattern do you see in the atom arrangement?", r: "Focusing on molecular geometry" },
        { q: "Why might they connect at this angle?", r: "Exploring bond angles" },
        { q: "What would happen if we added energy?", r: "Thinking about molecular motion" },
        { q: "How does this shape affect its properties?", r: "Connecting structure to function" },
        { q: "What if the angle was different?", r: "Considering alternative structures" }
      ],
      spanish: [
        { q: "¿Qué patrón ves en el arreglo de átomos?", r: "Enfocando en geometría molecular" },
        { q: "¿Por qué se conectan en este ángulo?", r: "Explorando ángulos de enlace" },
        { q: "¿Qué pasaría si agregáramos energía?", r: "Pensando en movimiento molecular" },
        { q: "¿Cómo afecta esta forma sus propiedades?", r: "Conectando estructura con función" },
        { q: "¿Qué si el ángulo fuera diferente?", r: "Considerando estructuras alternativas" }
      ]
    },
    volcano: {
      english: [
        { q: "What do you observe beneath the surface?", r: "Directing attention to hidden structures" },
        { q: "Where does the pressure come from?", r: "Exploring force sources" },
        { q: "What patterns exist in the magma flow?", r: "Identifying flow patterns" },
        { q: "How do the plates influence eruptions?", r: "Connecting tectonic activity" },
        { q: "What might trigger an eruption?", r: "Exploring causation" }
      ],
      spanish: [
        { q: "¿Qué observas debajo de la superficie?", r: "Dirigiendo atención a estructuras ocultas" },
        { q: "¿De dónde viene la presión?", r: "Explorando fuentes de fuerza" },
        { q: "¿Qué patrones hay en el flujo de magma?", r: "Identificando patrones de flujo" },
        { q: "¿Cómo influyen las placas en las erupciones?", r: "Conectando actividad tectónica" },
        { q: "¿Qué podría desencadenar una erupción?", r: "Explorando causalidad" }
      ]
    }
  };
  
  const questions = fallbackQuestions[phenomena as keyof typeof fallbackQuestions]?.[language] || 
                   fallbackQuestions.cell.english;
  const selected = questions[Math.floor(Math.random() * questions.length)];
  
  return {
    question: selected.q,
    reasoning: `[Fallback: ${selected.r}]`,
    model: 'Offline Mode'
  };
}

// Export types
export type { AIResponse };