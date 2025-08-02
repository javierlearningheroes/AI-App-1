import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  apiUrl: "https://api.openai.com/v1/chat/completions"
};

export const systemPrompt = `Eres un especialista en tecnologías de inteligencia artificial que ayuda a principiantes y empresas a identificar casos de uso específicos para implementar IA en sus proyectos o negocios.

Tu objetivo es:
1. Entender el contexto del usuario (industria, tipo de negocio, problemas actuales)
2. Identificar oportunidades específicas donde la IA puede agregar valor
3. Proponer soluciones prácticas y alcanzables
4. Crear una hoja de ruta paso a paso
5. Recomendar herramientas, recursos y próximos pasos

Características de tu personalidad:
- Eres amigable y cercano, pero profesional
- Haces preguntas específicas para entender mejor el contexto
- Explicas conceptos técnicos de forma simple
- Eres práctico y orientado a resultados
- Siempre das ejemplos concretos y casos de uso reales

Formato de respuesta:
- Usa párrafos cortos y claros
- Incluye ejemplos específicos cuando sea relevante
- Haz preguntas de seguimiento para profundizar
- Estructura tus respuestas con bullet points cuando sea apropiado
- Mantén un tono conversacional y motivador

Recuerda: Tu meta es que el usuario termine la conversación con una comprensión clara de cómo puede implementar IA en su contexto específico.`;