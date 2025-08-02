'use client';

import { useState, useEffect } from 'react';
import { auth, db, googleProvider, openaiConfig, systemPrompt } from '@/lib/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

export default function AICompanion() {
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "¡Hola! Soy tu AI Companion, especialista en tecnologías de inteligencia artificial. Estoy aquí para ayudarte a identificar cómo la IA puede transformar tu negocio o proyecto.\n\nCuéntame, ¿en qué área trabajas o qué tipo de problema te gustaría resolver?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([
    { role: 'system', content: systemPrompt }
  ]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await setupUserData(currentUser);
        await loadConversationHistory(currentUser);
        await updateMessageCountDisplay(currentUser);
      } else {
        setUser(null);
        setMessageCount(0);
      }
    });

    return () => unsubscribe();
  }, []);  // loadConversationHistory is called inside the effect

  // Setup user data in Firestore
  const setupUserData = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        dailyMessageCount: 0,
        lastMessageDate: new Date().toISOString().split('T')[0]
      });
    } else {
      const userData = userSnap.data();
      const today = new Date().toISOString().split('T')[0];
      const updateData: Record<string, unknown> = {
        lastLogin: serverTimestamp()
      };
      
      if (userData.lastMessageDate !== today) {
        updateData.dailyMessageCount = 0;
        updateData.lastMessageDate = today;
      }
      
      await updateDoc(userRef, updateData);
    }
  };

  // Load conversation history
  const loadConversationHistory = async (user: User) => {
    try {
      const conversationRef = doc(db, 'conversations', user.uid);
      const conversationSnap = await getDoc(conversationRef);
      
      if (conversationSnap.exists()) {
        const data = conversationSnap.data();
        const history = data.messages || [];
        setConversationHistory(history);
        
        // Render messages (skip system and first AI greeting)
        const chatMessages = history.filter((msg: { role: string }, index: number) => 
          msg.role !== 'system' && index > 0
        ).map((msg: { role: string; content: string }, index: number) => ({
          id: index + 2,
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date()
        }));
        
        if (chatMessages.length > 0) {
          setMessages([messages[0], ...chatMessages]);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Update message count display
  const updateMessageCountDisplay = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const today = new Date().toISOString().split('T')[0];
        
        if (userData.lastMessageDate !== today) {
          await updateDoc(userRef, {
            dailyMessageCount: 0,
            lastMessageDate: today
          });
          setMessageCount(0);
        } else {
          setMessageCount(userData.dailyMessageCount || 0);
        }
      }
    } catch (error) {
      console.error('Error updating message count:', error);
    }
  };

  // Authentication functions
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowModal(false);
    } catch (error) {
      console.error('Google login error:', error);
      alert('Error al iniciar sesión con Google');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      if (isRegister) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(result.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Email auth error:', error);
      alert('Error de autenticación');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Chat functions
  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !user) return;

    // Check daily limit
    if (messageCount >= 50) {
      alert('Has alcanzado el límite diario de 50 mensajes');
      return;
    }

    const userMessage = {
      id: messages.length + 1,
      content: inputMessage,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Update conversation history
    const newHistory = [...conversationHistory, { role: 'user', content: inputMessage }];
    setConversationHistory(newHistory);

    try {
      // Get AI response
      const response = await fetch(openaiConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: newHistory,
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      const aiMessage = {
        id: messages.length + 2,
        content: aiResponse,
        sender: 'ai' as const,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update conversation history with AI response
      const finalHistory = [...newHistory, { role: 'assistant', content: aiResponse }];
      setConversationHistory(finalHistory);

      // Save conversation and increment message count
      await saveConversation(user, finalHistory);
      await incrementMessageCount(user);

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: messages.length + 2,
        content: 'Lo siento, ha ocurrido un error. Por favor intenta de nuevo.',
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Save conversation to Firestore
  const saveConversation = async (user: User, history: { role: string; content: string }[]) => {
    try {
      const conversationRef = doc(db, 'conversations', user.uid);
      await setDoc(conversationRef, {
        userId: user.uid,
        messages: history,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  // Increment message count
  const incrementMessageCount = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const newCount = messageCount + 1;
      await updateDoc(userRef, {
        dailyMessageCount: newCount,
        lastMessageDate: new Date().toISOString().split('T')[0]
      });
      setMessageCount(newCount);
    } catch (error) {
      console.error('Error incrementing message count:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-emerald-500">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-white/10 backdrop-blur-md z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="text-xl font-semibold text-white">Learning Heroes</div>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full transition-all"
            >
              Iniciar Sesión
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="pt-32 pb-20 px-6 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-8xl mb-8 animate-bounce">🤖</div>
            <h1 className="text-6xl md:text-8xl font-bold mb-8">AI Companion</h1>
            <p className="text-2xl md:text-3xl mb-8 opacity-90">
              Tu asistente personal especializado en Inteligencia Artificial
            </p>
            <p className="text-xl mb-12 opacity-80 max-w-3xl mx-auto">
              Descubre cómo la IA puede transformar tu negocio, identifica casos de uso específicos 
              para tu industria y obtén una hoja de ruta personalizada para implementar soluciones 
              de inteligencia artificial.
            </p>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-white text-purple-600 px-12 py-4 rounded-full text-xl font-semibold hover:scale-105 transition-all shadow-lg"
            >
              Comenzar conversación
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-white text-center mb-16">¿Qué puedo hacer por ti?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: '🎯', title: 'Identificar casos de uso', desc: 'Te ayudo a encontrar oportunidades específicas de IA en tu sector' },
                { icon: '🛣️', title: 'Crear hoja de ruta', desc: 'Desarrollo un plan paso a paso para implementar IA en tu proyecto' },
                { icon: '📚', title: 'Recomendar recursos', desc: 'Sugiero herramientas, cursos y tecnologías específicas para tu caso' },
                { icon: '💡', title: 'Resolver dudas', desc: 'Respondo todas tus preguntas sobre IA de forma clara y práctica' }
              ].map((feature, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl text-white text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="opacity-80">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Login Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Accede a AI Companion
              </h2>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-blue-300 p-3 rounded-lg transition-all mb-4"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>

              <div className="text-center text-gray-500 mb-4">o</div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isRegister && (
                  <input
                    name="name"
                    type="text"
                    placeholder="Tu nombre"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                )}
                <input
                  name="email"
                  type="email"
                  placeholder="Tu email"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Tu contraseña"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </button>
              </form>

              <p className="text-center text-gray-600 mt-4">
                {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-blue-600 hover:underline"
                >
                  {isRegister ? 'Inicia sesión' : 'Regístrate'}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-900">Learning Heroes</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div 
                style={{
                  backgroundImage: `url(${user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || '')}&background=007aff&color=fff`})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-gray-700">{user.displayName || user.email}</span>
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Container */}
      <div className="pt-16 h-screen flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Companion</h1>
              <p className="text-gray-600">Especialista en IA para principiantes</p>
              <p className="text-sm text-blue-600">{messageCount}/50 mensajes hoy</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  message.sender === 'ai' 
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {message.sender === 'ai' ? '🤖' : (user.displayName?.[0] || 'U')}
                </div>
                <div className={`max-w-2xl ${message.sender === 'user' ? 'text-right' : ''}`}>
                  <div className={`p-4 rounded-2xl ${
                    message.sender === 'ai'
                      ? 'bg-white border border-gray-200 rounded-tl-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-lg text-white">
                  🤖
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            {messageCount >= 50 ? (
              <div className="text-center text-red-600 py-4">
                ⚠️ Has alcanzado el límite diario de mensajes (50). Vuelve mañana.
              </div>
            ) : (
              <div className="flex gap-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 p-3 border border-gray-200 rounded-full focus:border-blue-500 focus:outline-none"
                  disabled={isTyping}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping || messageCount >= 50}
                  className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}