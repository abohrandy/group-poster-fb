interface CaptionVariation {
  tone: string;
  caption: string;
}

export async function generateCaptionVariations(
  text: string,
  count = 3
): Promise<CaptionVariation[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // 1. Try Gemini API directly
  if (geminiKey) {
    try {
      console.log(`Querying Gemini API for caption variations...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `You are an AI assistant helping a community manager rewrite Facebook group posts. 
Generate ${count} unique variations that convey the same message but bypass copy-paste duplicate text detectors.
Vary the vocabulary, sentence order, and formatting (e.g. emojis or line breaks).
Your response MUST be a valid JSON object matching this schema:
{
  "variations": [
    { "tone": "Professional", "caption": "..." },
    { "tone": "Casual", "caption": "..." },
    { "tone": "Enthusiastic", "caption": "..." }
  ]
}

Do not include any explanation or markdown formatting in your response. The response must start with { and end with }.

Here is the text to rewrite:
"${text}"`
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (contentText) {
          const cleanJsonText = contentText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJsonText);
          if (parsed.variations && Array.isArray(parsed.variations)) {
            return parsed.variations;
          }
        }
      } else {
        console.warn(`Gemini API error status: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.warn('Gemini API request failed, trying OpenRouter fallback:', err);
    }
  }

  // 2. Try OpenRouter Fallback
  if (openRouterKey) {
    try {
      console.log(`Querying OpenRouter API for caption variations...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'SocialDiscovery Control Panel',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant helping a community manager rewrite Facebook group posts. 
Generate unique variations that convey the same message but bypass copy-paste duplicate text detectors.
Vary the vocabulary, sentence order, and formatting (e.g. emojis or line breaks).
Your response MUST be a valid JSON object. Do not include markdown code block formatting.
Format:
{
  "variations": [
    { "tone": "Professional", "caption": "..." },
    { "tone": "Casual", "caption": "..." },
    { "tone": "Enthusiastic", "caption": "..." }
  ]
}`
            },
            {
              role: 'user',
              content: `Generate ${count} variations of this text: "${text}"`
            }
          ],
          response_format: { type: 'json_object' }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const contentText = data.choices?.[0]?.message?.content;
        
        if (contentText) {
          const cleanJsonText = contentText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJsonText);
          if (parsed.variations && Array.isArray(parsed.variations)) {
            return parsed.variations;
          }
        }
      }
    } catch (err) {
      console.warn('OpenRouter API request failed, falling back to local template rewriter:', err);
    }
  }

  // Local Template Fallback Generator (Anti-Duplicate System)
  console.log('Generating variations using local spin-tax templates...');
  
  const casualPrefixes = [
    'Hey folks! Just wanted to share: ',
    'Quick heads-up here... ',
    'Just sharing this with the group: ',
    'Hey everyone, check this out: '
  ];
  
  const professionalPrefixes = [
    'Important update for the community: ',
    'Please take note of the following update: ',
    'Official announcement: ',
    'For your information: '
  ];

  const enthusiasticPrefixes = [
    'Super excited to announce! 🚀 ',
    'Don\'t miss this! 🎉 ',
    'Fantastic news for everyone here: 💫 ',
    'Big news! Check this out: 🔥 '
  ];

  const randomPick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const cleanedText = text.trim();

  return [
    {
      tone: 'Casual',
      caption: `${randomPick(casualPrefixes)}${cleanedText}`,
    },
    {
      tone: 'Professional',
      caption: `${randomPick(professionalPrefixes)}${cleanedText}`,
    },
    {
      tone: 'Enthusiastic',
      caption: `${randomPick(enthusiasticPrefixes)}${cleanedText}`,
    },
  ];
}
