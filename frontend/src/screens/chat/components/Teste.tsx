'use client';

import { useState } from 'react';
import axios from 'axios';

export default function ChatGPTFront() {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const sendPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Você é um assistente prestativo.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
        }
      );
      setReply(res.data.choices[0].message.content.trim());
    } catch (err) {
      console.error(err);
      setReply('Ocorreu um erro ao chamar a API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <textarea
        className="w-full p-2 border rounded mb-2"
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Digite sua pergunta para o ChatGPT..."
      />
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={sendPrompt}
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Enviar'}
      </button>

      {reply && (
        <div className="mt-4 p-3 bg-gray-100 rounded whitespace-pre-wrap">
          {reply}
        </div>
      )}
    </div>
  );
}
