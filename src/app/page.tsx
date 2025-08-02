import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-900">
            Learning Heroes
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
              Inicio
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
              Sobre Nosotros
            </Link>
            <Link href="/programs" className="text-gray-600 hover:text-blue-600 transition-colors">
              Programas
            </Link>
            <Link href="/founders" className="text-gray-600 hover:text-blue-600 transition-colors">
              Fundadores
            </Link>
            <Link href="/ai-companion" className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent font-semibold hover:scale-105 transition-transform">
              AI Companion 🤖
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8">
            Domina las tecnologías
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent block">
              del futuro
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto">
            Formación disruptiva en Inteligencia Artificial, Blockchain y Programación. 
            De cero a héroe en 12 meses.
          </p>
          <div className="space-y-4 md:space-y-0 md:space-x-6 md:flex md:justify-center">
            <Link 
              href="/programs"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg"
            >
              Explorar Programas
            </Link>
            <Link 
              href="/ai-companion"
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:scale-105 transition-all shadow-lg"
            >
              Probar AI Companion 🤖
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/programs/ai" className="group">
              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-2 border border-gray-100">
                <div className="text-5xl mb-6">🤖</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Inteligencia Artificial</h3>
                <p className="text-gray-600">Aprende a construir el futuro con IA. Desde machine learning hasta deep learning.</p>
              </div>
            </Link>
            
            <Link href="/programs/blockchain" className="group">
              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-2 border border-gray-100">
                <div className="text-5xl mb-6">⛓️</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Blockchain</h3>
                <p className="text-gray-600">Domina las finanzas descentralizadas y la tecnología blockchain desde cero.</p>
              </div>
            </Link>
            
            <Link href="/programs/programming" className="group">
              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-2 border border-gray-100">
                <div className="text-5xl mb-6">💻</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Programación</h3>
                <p className="text-gray-600">Desarrolla las habilidades técnicas fundamentales para el mundo digital.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8">
            Una nueva forma de aprender
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            En Learning Heroes creemos que cada día más personas deben comprender 
            las tecnologías disruptivas. Nuestros programas te harán ver y entender 
            el mundo de otra manera.
          </p>
          <Link 
            href="/about"
            className="inline-block border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-600 hover:text-white transition-all"
          >
            Conoce más
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            &copy; 2024 Learning Heroes. Formando los héroes del futuro.
          </p>
        </div>
      </footer>
    </div>
  );
}
