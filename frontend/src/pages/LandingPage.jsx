import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ChartBarIcon, 
  ShieldCheckIcon, 
  ArrowPathIcon,
  CloudArrowDownIcon,
  PlayIcon,
  PresentationChartBarIcon,
  GlobeAltIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import LoginModal from '@/components/Auth/LoginModal';
import SignUpModal from '@/components/Auth/SignUpModal';
import ForgotPasswordModal from '@/components/Auth/ForgotPasswordModal';
import heroLogo from '@/assets/images/hero-logo.png';
import featureimg from '@/assets/images/feature-landing.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 via-white to-accent-50 py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* App Name and Logo */}
          <div className="flex items-center justify-center gap-10 mb-16">
            {/* Logo - Clean, No Fill */}
            <div className="relative">
              <img 
                src={heroLogo} 
                alt="Engagium Logo" 
                className="h-28 w-auto drop-shadow-xl"
              />
            </div>
            
            <h1 className="text-8xl font-bold text-accent-500 tracking-tight">engagium</h1>
          </div>

          {/* Description Text - Horizontal Layout */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="text-gray-700 text-lg leading-relaxed space-y-6 font-light text-center">
              <p>
                <span className="font-semibold text-gray-900">Class Participation Tracker for Online Learning</span>, a system 
                designed by students and professors of St. Clare College of Caloocan for 
                monitoring and evaluating student participation during online learning sessions.
              </p>
              <p>
                The system provides a fair, consistent, and partially automated way of tracking various forms 
                of student engagement — such as speaking turns, chat messages, and 
                reaction activity — during synchronous online classes.
              </p>
            </div>
          </div>
          
          {/* Auth Buttons - Left Aligned */}
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="px-8 py-3 bg-white border-2 border-accent-500 text-accent-600 rounded-lg font-semibold hover:bg-accent-50 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Log In
            </button>
            <button 
              onClick={() => setIsSignUpOpen(true)}
              className="px-8 py-3 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Sign Up
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="inline-block bg-gradient-to-r from-accent-600 to-accent-700 text-white px-16 py-4 rounded-full text-4xl font-bold shadow-lg">
              Benefits
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* Left Column: Feature Image */}
            <div className="bg-gradient-to-br from-accent-100 to-accent-200 rounded-3xl h-full min-h-96 flex items-center justify-center shadow-2xl border border-accent-200">
              <img 
                src={featureimg} 
                alt="Engagium Features" 
                className="max-h-24 w-auto"
              />
            </div>

            {/* Right Column: Benefits List */}
            <div className="space-y-10">
              <div className="flex items-start space-x-6 group">
                <div className="flex-shrink-0 w-14 h-14 bg-accent-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <BoltIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">AUTOMATED TRACKING</h3>
                  <p className="text-gray-600 text-base leading-relaxed font-light">
                    No need to manually check who is 
                    speaking or chatting — the system 
                    monitors everything automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6 group">
                <div className="flex-shrink-0 w-14 h-14 bg-accent-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <CheckCircleIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">FAIR & CONSISTENT GRADING</h3>
                  <p className="text-gray-600 text-base leading-relaxed font-light">
                    Participation reports are data-driven, 
                    reducing bias and subjectivity.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6 group">
                <div className="flex-shrink-0 w-14 h-14 bg-accent-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <ClockIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">TIME-SAVING FOR PROFESSORS</h3>
                  <p className="text-gray-600 text-base leading-relaxed font-light">
                    Session logs, analytics, and participation 
                    summaries are generated automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6 group">
                <div className="flex-shrink-0 w-14 h-14 bg-accent-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <ArrowPathIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">INTEGRATES WITH GOOGLE MEET & ZOOM</h3>
                  <p className="text-gray-600 text-base leading-relaxed font-light">
                    The browser extension captures participation in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6 group">
                <div className="flex-shrink-0 w-14 h-14 bg-accent-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">PRIVACY-FRIENDLY</h3>
                  <p className="text-gray-600 text-base leading-relaxed font-light">
                    ENGAGIUM records only text-based events, not audio 
                    or video.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-accent-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="inline-block bg-gradient-to-r from-gray-700 to-gray-800 text-white px-16 py-4 rounded-full text-4xl font-bold shadow-lg">
              How It Works?
            </h2>
          </div>

          {/* Connection Line with Numbered Badges */}
          <div className="relative mb-24">
            <div className="grid grid-cols-3 gap-12 max-w-4xl mx-auto">
              {/* Badge 1 */}
              <div className="flex justify-center relative">
                <div className="bg-gradient-to-br from-accent-500 to-accent-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg z-10">
                  1
                </div>
              </div>
              
              {/* Badge 2 */}
              <div className="flex justify-center relative">
                <div className="bg-gradient-to-br from-accent-500 to-accent-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg z-10">
                  2
                </div>
              </div>
              
              {/* Badge 3 */}
              <div className="flex justify-center relative">
                <div className="bg-gradient-to-br from-accent-500 to-accent-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg z-10">
                  3
                </div>
              </div>
            </div>
            
            {/* Connecting Line */}
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-3/4 max-w-3xl h-1 bg-accent-300 hidden md:block" style={{zIndex: 0}}></div>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300 min-h-80 flex flex-col items-center justify-center border border-gray-100">
                <CloudArrowDownIcon className="w-20 h-20 text-accent-600 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
                  INSTALL THE<br/>
                  BROWSER<br/>
                  EXTENSION
                </h3>
                <p className="text-gray-600 leading-relaxed font-light">
                  Capture real-time<br/>
                  participation from<br/>
                  your online classes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300 min-h-80 flex flex-col items-center justify-center border border-gray-100">
                <PlayIcon className="w-20 h-20 text-accent-600 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
                  START<br/>
                  YOUR ONLINE<br/>
                  CLASS
                </h3>
                <p className="text-gray-600 leading-relaxed font-light">
                  The extension<br/>
                  tracks chat<br/>
                  messages, mic<br/>
                  activity, and reactions<br/>
                  automatically.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300 min-h-80 flex flex-col items-center justify-center border border-gray-100">
                <PresentationChartBarIcon className="w-20 h-20 text-accent-600 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
                  VIEW REPORTS<br/>
                  ON THE<br/>
                  DASHBOARD
                </h3>
                <p className="text-gray-600 leading-relaxed font-light">
                  See graph<br/>
                  participation<br/>
                  scores, and<br/>
                  session summaries<br/>
                  on the web platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before You Sign Up Section */}
      <section className="bg-gradient-to-br from-gray-50 to-accent-50 py-20 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="inline-block bg-gradient-to-r from-gray-700 to-gray-800 text-white px-16 py-4 rounded-full text-4xl font-bold shadow-lg">
              Before you Sign Up
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex items-start space-x-4 bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-accent-100">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md">
                1
              </div>
              <div className="flex-1">
                <p className="text-gray-800 text-base leading-relaxed">
                  <span className="font-bold text-gray-900">You must use your institutional email</span><br/>
                  <span className="text-gray-500 text-sm font-light">e.g. professor.SCC@gmail.com</span><br/>
                  <span className="text-gray-500 text-sm font-light">e.g. professorstclare.scc@gmail.com</span>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-accent-100">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md">
                2
              </div>
              <div className="flex-1">
                <p className="text-gray-800 text-base leading-relaxed">
                  <span className="font-bold text-gray-900">ENGAGIUM works best with Google Chrome</span>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-accent-100">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md">
                3
              </div>
              <div className="flex-1">
                <p className="text-gray-900 text-base leading-relaxed font-bold">
                  Online classes must be on Google Meet or Zoom.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-accent-100">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md">
                4
              </div>
              <div className="flex-1">
                <p className="text-gray-800 text-base leading-relaxed">
                  <span className="font-bold text-gray-900">No audio/video is recorded - only participation events.</span><br/>
                  <span className="text-gray-500 text-sm font-light">ex. raising hand, entering the class</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Extension Download Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-center items-center gap-10">
            <div className="group bg-white rounded-3xl px-16 py-10 flex items-center space-x-8 hover:scale-105 transition-all duration-300 cursor-pointer shadow-2xl w-full md:w-auto border-2 border-transparent hover:border-accent-400">
              <GlobeAltIcon className="w-24 h-24 text-accent-600 group-hover:text-accent-700 transition-colors" />
              <div>
                <div className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-500">Extension for</div>
                <div className="text-4xl font-bold text-gray-900 tracking-tight">Chrome</div>
              </div>
            </div>

            <div className="group bg-white rounded-3xl px-16 py-10 flex items-center space-x-8 hover:scale-105 transition-all duration-300 cursor-pointer shadow-2xl w-full md:w-auto border-2 border-transparent hover:border-accent-400">
              <GlobeAltIcon className="w-24 h-24 text-accent-600 group-hover:text-accent-700 transition-colors" />
              <div>
                <div className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-500">Extension for</div>
                <div className="text-4xl font-bold text-gray-900 tracking-tight">Edge</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer/Disclaimer */}
      <footer className="bg-gray-50 py-16 px-6 text-center border-t border-gray-200">
        <div className="max-w-5xl mx-auto space-y-6">
          <p className="font-bold text-gray-900 text-sm uppercase tracking-widest">Disclaimer</p>
          <p className="text-gray-600 text-sm leading-relaxed font-light">
            This website and the ENGAGIUM system are academic projects created by <span className="font-semibold text-gray-900">R. Corp Group (2025)</span><br/>
            for educational purposes only. All features and information presented here are prototypes and<br/>
            may not fully represent a final or commercial product.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed font-light">
            ENGAGIUM uses and except audio or video content and complies with the Data Privacy Act of<br/>
            2012. Unauthorized copying, distribution, or modification of any part of this project is<br/>
            prohibited without permission from R. Corp Group.
          </p>
          <p className="font-semibold text-gray-900 text-sm pt-6">© 2025 R. Corp Group. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {isLoginOpen && (
        <LoginModal 
          onClose={() => setIsLoginOpen(false)} 
          onSwitchToSignUp={() => {
            setIsLoginOpen(false);
            setIsSignUpOpen(true);
          }}
          onSwitchToForgotPassword={() => {
            setIsLoginOpen(false);
            setIsForgotPasswordOpen(true);
          }}
        />
      )}

      {/* Sign Up Modal */}
      {isSignUpOpen && (
        <SignUpModal 
          onClose={() => setIsSignUpOpen(false)} 
          onSwitchToLogin={() => {
            setIsSignUpOpen(false);
            setIsLoginOpen(true);
          }} 
        />
      )}

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <ForgotPasswordModal 
          onClose={() => setIsForgotPasswordOpen(false)} 
          onBackToLogin={() => {
            setIsForgotPasswordOpen(false);
            setIsLoginOpen(true);
          }} 
        />
      )}
    </div>
  );
};

export default LandingPage;
