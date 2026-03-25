import { Link } from 'react-router-dom';
import { Wand2, ArrowRight, Sparkles } from 'lucide-react';
import edited4 from '@/assets/images/edited4_v2.jpg';
import Features from '../components/Features';

const HomePage = () => {
  return (
    <div className="min-h-screen  text-white selection:bg-emerald-500/30">
      {/* Hero Section - Simplified & Focused */}
     <div className="relative h-[90vh] flex flex-col items-center justify-center bg-black overflow-hidden">

  {/* Base Gradient */}
  <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black"></div>

  {/* Center Spotlight */}
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[160px] animate-pulse"></div>
  </div>

  {/* Left Glow */}
  <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] animate-pulse"></div>

  {/* Right Glow */}
  <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[140px] animate-pulse delay-1000"></div>

  {/* Moving Light Beam */}
  <div className="absolute top-0 left-1/2 w-[600px] h-full bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent blur-[120px] animate-[spin_20s_linear_infinite] opacity-30"></div>

  {/* Subtle Grid Light */}
  <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:80px_80px]"></div>

  {/* Noise Texture */}
  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>


  {/* Main Content */}
  <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">

    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tighter leading-tight drop-shadow-2xl">
      Create Visual <br />
      <span className="text-white animate-gradient-x">
        Wonders By
      </span>{" "}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 animate-gradient-x">
        AI
      </span>
    </h1>

    <p className="text-lg md:text-2xl text-gray-400 mb-16 max-w-2xl font-light leading-relaxed">
      Share your experience with your creativity and turn your imagination into reality.
    </p>

    {/* Button */}
    <Link to="/editor" className="group relative flex flex-col items-center gap-4 focus:outline-none">

      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500 rounded-full blur-[70px] opacity-20 group-hover:opacity-50 transition duration-500"></div>

      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center animate-bounce transition-transform duration-300 hover:scale-110">

        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-[0_0_60px_rgba(16,185,129,0.6)] border border-white/20 group-hover:border-white/60 transition-all duration-300"></div>

        <div className="relative z-10 text-white transform group-hover:rotate-12 transition-transform duration-300">
          <Wand2 className="w-10 h-10 md:w-12 md:h-12 drop-shadow-lg" />
        </div>

      </div>

      <div className="flex flex-col items-center gap-2 animate-pulse">
        <span className="text-emerald-400 font-bold tracking-[0.2em] text-sm uppercase drop-shadow-md">
          Start Creating
        </span>
        <div className="flex items-center gap-2 text-white/50 text-xs">
          <span>Click the magic wand</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>

    </Link>

  </div>
</div>

      {/* Video Section */}
      {/* <div className="py-24 bg-white relative">
         <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
               <h2 className="text-3xl md:text-5xl font-black tracking-tight text-black mb-6">
                 Make Bangladesh More Beautiful <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">By Creating Images With AI</span>
               </h2>
            </div>
            
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] border border-white/10 group">
               <iframe 
                 className="w-full h-full"
                 src="https://www.youtube.com/embed/yVYQeDhAQWk?si=uE4AyVCiFhz4jxP_" 
                 title="Make Bangladesh More Beautiful" 
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                 referrerPolicy="strict-origin-when-cross-origin" 
                 allowFullScreen
               ></iframe>
               
               <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
               <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            </div>
         </div>
      </div> */}

      <Features />

 
           <div className="flex flex-col my-20 max-w-7xl mx-auto md:flex-row items-center gap-16 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-950 to-black p-8 md:p-12 border border-white/10 shadow-2xl">
              <div className="md:w-1/2 z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md">
                       <Sparkles className="w-6 h-6 text-emerald-400" />
                    </div>
                    <span className="text-emerald-400 font-bold tracking-widest text-sm uppercase">Feedback & Experience</span>
                 </div>
                 <h3 className="text-4xl md:text-5xl font-black mb-6 text-white">
                    Share Your AI <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Journey With Us.</span>
                 </h3>
                 <p className="text-gray-300 text-lg leading-relaxed mb-8 font-light">
                   Your insights shape the future of our AI. Share your feedback on the website experience and showcase how our tools have transformed your creative workflow.
                 </p>
                 <a href="#footer" className="inline-flex items-center px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] group">
                 <span>
                    Share Feedback
                 </span>
                 <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 </a>
              </div>
              <div className="md:w-1/2 w-full relative z-10">
                 <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-emerald-500/20 group transform hover:scale-[1.02] transition-all duration-500">
                    <img src={edited4} alt="AI Experience" className="w-full h-full object-cover aspect-video opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent mix-blend-overlay"></div>
                 </div>
              </div>
              
              {/* Decorative background blur */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
           </div>
    </div>
  );
};

export default HomePage;
