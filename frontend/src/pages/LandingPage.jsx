import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from '@/components/LoginModal';
import SignUpModal from '@/components/SignUpModal';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header/Navigation */}
      <header className="bg-teal-700 text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold tracking-wider">engagium</div>
            <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 50 L50 20 L80 50 L50 80 Z" stroke="white" strokeWidth="6" fill="none"/>
              <path d="M30 50 L50 30 L70 50" stroke="white" strokeWidth="4" fill="none"/>
            </svg>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="px-6 py-2 bg-white text-teal-700 rounded-full font-semibold hover:bg-teal-50 transition"
            >
              Log In
            </button>
            <button 
              onClick={() => setIsSignUpOpen(true)}
              className="px-6 py-2 bg-teal-900 text-white rounded-full font-semibold hover:bg-teal-800 transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl font-bold text-teal-800 mb-4">engagium</h1>
        <div className="flex justify-center mb-8">
          <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 50 L50 20 L80 50 L50 80 Z" stroke="#0f766e" strokeWidth="6" fill="none"/>
            <path d="M30 50 L50 30 L70 50" stroke="#0f766e" strokeWidth="4" fill="none"/>
          </svg>
        </div>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
          is a Class Participation Tracker for Online Learning, a system<br/>
          designed to quantify, monitor, and evaluate student participation<br/>
          during online learning sessions. The system is designed to provide a<br/>
          fair, consistent, and partially automated way of tracking various forms<br/>
          of student engagement — such as: chat activity, turns, mic messages<br/>
          and reaction activity — during synchronous online classes.
        </p>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-r from-orange-100 to-teal-100 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-teal-600 text-white inline-block px-8 py-3 rounded-full text-3xl font-bold mb-12">
            benefits
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AUTOMATED TRACKING</h3>
                  <p className="text-gray-700">
                    No need to manually check who is<br/>
                    speaking or chatting — the system<br/>
                    monitors everything automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">FAIR & CONSISTENT GRADING</h3>
                  <p className="text-gray-700">
                    Participation reports are auto-generated,<br/>
                    reducing bias and subjectivity.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">TIME-SAVING FOR PROFESSORS</h3>
                  <p className="text-gray-700">
                    Session logs, analytics, and participation<br/>
                    summaries are generated automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">INTEGRATES WITH GOOGLE MEET & ZOOM</h3>
                  <p className="text-gray-700">
                    The browser extension captures participation from<br/>
                    your online classes.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">PRIVACY-FRIENDLY</h3>
                  <p className="text-gray-700">
                    Engagium records only text-based events, not audio<br/>
                    or video.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-gray-400 text-white inline-block px-8 py-3 rounded-full text-3xl font-bold mb-12">
            how it works?
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-teal-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <div className="bg-teal-100 rounded-3xl p-8 h-64 flex flex-col justify-center">
                <div className="text-teal-700 text-6xl mb-4">📥</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">INSTALL THE<br/>BROWSER<br/>EXTENSION</h3>
                <p className="text-gray-700 text-sm">
                  Capture real-time<br/>
                  participation from<br/>
                  your online<br/>
                  classes.
                </p>
              </div>
              <div className="absolute top-8 right-0 transform translate-x-1/2 hidden md:block">
                <svg className="w-16 h-8" viewBox="0 0 64 32" fill="none">
                  <path d="M2 16 L62 16" stroke="#14b8a6" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#14b8a6" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gray-400 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <div className="bg-teal-600 text-white rounded-3xl p-8 h-64 flex flex-col justify-center">
                <div className="text-4xl mb-4">▶️</div>
                <h3 className="text-xl font-bold mb-2">START<br/>YOUR ONLINE<br/>CLASS</h3>
                <p className="text-sm">
                  Engagium<br/>
                  tracks chat<br/>
                  messages, mic<br/>
                  activity, and<br/>
                  reactions<br/>
                  automatically.
                </p>
              </div>
              <div className="absolute top-8 right-0 transform translate-x-1/2 hidden md:block">
                <svg className="w-16 h-8" viewBox="0 0 64 32" fill="none">
                  <path d="M2 16 L62 16" stroke="#14b8a6" strokeWidth="3" markerEnd="url(#arrowhead2)"/>
                  <defs>
                    <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#14b8a6" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="bg-teal-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <div className="bg-teal-100 rounded-3xl p-8 h-64 flex flex-col justify-center">
                <div className="text-teal-700 text-5xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">VIEW REPORTS<br/>ON THE<br/>DASHBOARD</h3>
                <p className="text-gray-700 text-sm">
                  Review detailed<br/>
                  participation<br/>
                  scores, and<br/>
                  session<br/>
                  summaries on the<br/>
                  web platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before You Sign Up Section */}
      <section className="bg-gradient-to-b from-orange-50 to-orange-100 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-4xl font-bold text-gray-900">Before you Sign Up</h2>
          </div>

          <div className="space-y-6 text-lg">
            <div className="flex items-start space-x-4 bg-white rounded-lg p-6 shadow-sm">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="text-gray-800">
                  <span className="font-bold">You must provide a valid Gmail</span><br/>
                  e.g. professor5012@gmail.com<br/>
                  or professorstclare.scc@gmail.com
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white rounded-lg p-6 shadow-sm">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="text-gray-800">
                  <span className="font-bold">ENGAGIUM works best with Google Chrome</span><br/>
                  • It might work in Microsoft Edge or Zoom.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white rounded-lg p-6 shadow-sm">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="text-gray-800">
                  <span className="font-bold">Online classes must be hosted on Google Meet or Zoom.</span>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white rounded-lg p-6 shadow-sm">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <p className="text-gray-800">
                  <span className="font-bold">No audio/video is recorded - only participation events.</span><br/>
                  • A time stamp, name(s), and action.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Extension Download Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="bg-gray-900 text-white rounded-3xl px-12 py-8 flex items-center space-x-6 hover:bg-gray-800 transition cursor-pointer shadow-lg">
              <div className="text-5xl">🌐</div>
              <div>
                <div className="text-sm font-semibold mb-1">Extension for</div>
                <div className="text-3xl font-bold">Chrome</div>
              </div>
            </div>

            <div className="bg-teal-600 text-white rounded-3xl px-12 py-8 flex items-center space-x-6 hover:bg-teal-700 transition cursor-pointer shadow-lg">
              <div className="text-5xl">🌊</div>
              <div>
                <div className="text-sm font-semibold mb-1">Extension for</div>
                <div className="text-3xl font-bold">Microsoft Edge</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer/Disclaimer */}
      <footer className="bg-gray-100 py-8 px-6 text-center text-sm text-gray-600">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="font-semibold">Disclaimer</p>
          <p>
            This website and the ENGAGIUM system are academic projects created by R. Corp Group (2025)<br/>
            for educational purposes only. All features and information presented here are prototypes and<br/>
            may not reflect a final or commercial product.
          </p>
          <p>
            Copyright © 2025 R. Corp Group. All rights reserved.<br/>
            Unauthorized copying, distribution, or modification of any part of this project is<br/>
            prohibited without permission from R. Corp Group.
          </p>
          <p className="font-semibold">© 2025 R. Corp Group All rights reserved.</p>
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
