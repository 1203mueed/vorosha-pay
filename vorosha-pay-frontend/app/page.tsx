import { ChevronDown, Shield, Cpu, CreditCard, ArrowRight, Check, Star, Menu } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white p-2 rounded-full shadow-lg">
        <label className="language-toggle">
          <input type="checkbox" id="languageToggle" />
          <span className="language-slider"></span>
          <div className="language-labels">
            <span className="bengali">বাং</span>
            <span>EN</span>
          </div>
        </label>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full bg-white bg-opacity-90 backdrop-blur-md z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl mr-2">
                V
              </div>
              <span className="text-xl font-bold text-emerald-800">Vorosha Pay</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-emerald-600 transition">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-emerald-600 transition">How It Works</a>
              <a href="#security" className="text-gray-700 hover:text-emerald-600 transition">Security</a>
              <a href="#testimonials" className="text-gray-700 hover:text-emerald-600 transition">Testimonials</a>
              <a href="#contact" className="text-gray-700 hover:text-emerald-600 transition">Contact</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="px-4 py-2 text-emerald-600 font-medium hover:bg-emerald-50 rounded-full transition">
                Log In
              </Link>
              <Link href="/auth/register" className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-medium rounded-full hover:shadow-lg transition">
                Sign Up
              </Link>
            </div>
            
            <button className="md:hidden text-gray-700 focus:outline-none">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="alpana-pattern"></div>
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0 relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="bengali block text-emerald-800">আস্থার নতুন যুগ</span>
              <span className="block text-orange-600">Trust Redefined</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg">
              Experience Bangladesh's most secure digital escrow platform with AI-powered protection and seamless transactions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/auth/register" className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-medium rounded-full hover:shadow-lg transition text-center">
                Get Started
              </Link>
              <Link href="/demo" className="px-8 py-4 border border-emerald-600 text-emerald-600 font-medium rounded-full hover:bg-emerald-50 transition text-center">
                Live Demo
              </Link>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center">
                <div className="bg-emerald-100 p-2 rounded-full mr-3">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="counter text-2xl font-bold text-emerald-800">247,832</div>
                  <div className="text-sm text-gray-500">৳ secured today</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-800">100%</div>
                  <div className="text-sm text-gray-500">Fraud Protected</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 flex justify-center relative z-10">
            <div className="mobile-mockup">
              <div className="mobile-screen relative bg-white rounded-3xl overflow-hidden shadow-2xl" style={{width: '280px', height: '550px'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-orange-50 opacity-80"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-300 rounded-full"></div>
                
                {/* Mockup Content */}
                <div className="relative h-full flex flex-col p-4">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-emerald-800 font-bold">Vorosha Pay</div>
                    <div className="text-xs text-gray-500">12:45 PM</div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="w-32 h-32 bg-white rounded-xl shadow-md mb-6 flex items-center justify-center qr-morph">
                      <div className="grid grid-cols-4 gap-1">
                        {/* QR Code Pattern */}
                        {Array.from({ length: 16 }, (_, i) => (
                          <div key={i} className={`w-6 h-6 ${
                            [0,1,2,3,4,7,8,11,12,13,14,15].includes(i) ? 'bg-emerald-800' :
                            [6,9].includes(i) ? 'bg-orange-500' : 'bg-white'
                          }`}></div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center mb-6">
                      <div className="text-lg font-bold text-emerald-800 mb-1">Scan to Pay</div>
                      <div className="text-sm text-gray-500">Valid for 2 minutes</div>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                      <div className="bg-gradient-to-r from-emerald-600 to-orange-500 h-2 rounded-full" style={{width: '65%'}}></div>
                    </div>
                    
                    <div className="w-full grid grid-cols-3 gap-2">
                      <button className="py-2 bg-gray-100 rounded-lg text-gray-700 text-sm">Cancel</button>
                      <button className="py-2 bg-gray-100 rounded-lg text-gray-700 text-sm col-span-2">Enter Amount</button>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-around py-3 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-emerald-600">
                          <CreditCard className="w-6 h-6 mx-auto" />
                        </div>
                        <div className="text-xs text-gray-500">Pay</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">
                          <ArrowRight className="w-6 h-6 mx-auto" />
                        </div>
                        <div className="text-xs text-gray-400">Transfer</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">
                          <Shield className="w-6 h-6 mx-auto" />
                        </div>
                        <div className="text-xs text-gray-400">Wallet</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 scroll-indicator">
          <ChevronDown className="w-8 h-8 text-emerald-600" />
        </div>
      </section>

      {/* Trust Meter */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-800 mb-4">Your Trust, Our Priority</h2>
            <p className="text-gray-600">Vorosha Pay maintains the highest security standards with real-time AI monitoring</p>
          </div>
          
          <div className="max-w-4xl mx-auto bg-gray-50 rounded-xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div className="mb-4 md:mb-0">
                <div className="text-2xl font-bold text-emerald-800">Trust Score</div>
                <div className="text-sm text-gray-500">Calculated in real-time</div>
              </div>
              <div className="text-4xl font-bold text-emerald-800">9.2/10</div>
            </div>
            
            <div className="trust-meter mb-6">
              <div className="trust-meter-fill"></div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-emerald-800">256-bit</div>
                <div className="text-sm text-gray-500">Encryption</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-800">24/7</div>
                <div className="text-sm text-gray-500">AI Monitoring</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-800">100%</div>
                <div className="text-sm text-gray-500">Fraud Protection</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-800">0.1s</div>
                <div className="text-sm text-gray-500">Transaction Speed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-800 mb-4">
              <span className="bengali block text-lg text-orange-600">অভিনব বৈশিষ্ট্য</span>
              Revolutionary Features
            </h2>
            <p className="text-gray-600">Experience the future of digital payments with our cutting-edge technology</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-sm card-hover">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Cpu className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-emerald-800 mb-3">AI Fraud Detection</h3>
              <p className="text-gray-600 mb-4">Our neural networks analyze transactions in real-time to prevent fraud before it happens.</p>
              <div className="relative h-40">
                <svg viewBox="0 0 200 120" className="w-full h-full">
                  <path className="neural-path" stroke="#006A4E" strokeWidth="1" fill="none" d="M20,20 Q50,10 80,20 T140,20 T180,30 M20,40 Q50,30 80,40 T140,50 T180,60 M20,80 Q50,70 80,80 T140,90 T180,100 M20,20 L40,40 M80,20 L60,40 M80,20 L100,40 M140,30 L120,50 M140,30 L160,50 M20,40 L40,60 M80,40 L60,60 M80,40 L100,60 M140,50 L120,70 M140,50 L160,70 M20,80 L40,100 M80,80 L60,100 M80,80 L100,100 M140,90 L120,110 M140,90 L160,110" />
                </svg>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-sm card-hover">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <CreditCard className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-emerald-800 mb-3">Secure Escrow</h3>
              <p className="text-gray-600 mb-4">Your money stays protected until both parties confirm the transaction is complete.</p>
              <div className="payment-connection flex justify-around items-center py-6">
                <div className="h-10 w-16 bg-emerald-600 text-white rounded flex items-center justify-center text-xs font-bold">bKash</div>
                <div className="h-10 w-16 bg-orange-500 text-white rounded flex items-center justify-center text-xs font-bold">Nagad</div>
                <div className="h-10 w-16 bg-emerald-600 text-white rounded flex items-center justify-center text-xs font-bold">Rocket</div>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-sm card-hover">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-emerald-800 mb-3">Military-Grade Security</h3>
              <p className="text-gray-600 mb-4">Your data is encrypted with bank-level security protocols and biometric authentication.</p>
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border-4 border-emerald-200 rounded-full animate-spin" style={{animationDuration: '8s'}}></div>
                  <div className="absolute inset-4 border-4 border-orange-200 rounded-full animate-spin" style={{animationDuration: '6s', animationDirection: 'reverse'}}></div>
                  <div className="absolute inset-8 border-4 border-emerald-300 rounded-full animate-spin" style={{animationDuration: '10s'}}></div>
                  <div className="absolute inset-12 flex items-center justify-center">
                    <Shield className="w-12 h-12 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-800 mb-4">
              <span className="bengali block text-lg text-orange-600">এটি কি কিভাবে কাজ করে</span>
              How It Works
            </h2>
            <p className="text-gray-600">Secure escrow transactions in just a few simple steps</p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-8">
            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-2xl mb-4">1</div>
              <h3 className="text-xl font-bold text-emerald-800 mb-3">Create Transaction</h3>
              <p className="text-gray-600 mb-4">Create an escrow transaction with amount and description.</p>
              <div className="mt-auto">
                <CreditCard className="w-16 h-16 text-emerald-200 mx-auto" />
              </div>
            </div>
            
            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-emerald-200">
              <ArrowRight className="w-12 h-12" />
            </div>
            
            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-2xl mb-4">2</div>
              <h3 className="text-xl font-bold text-emerald-800 mb-3">Fund Escrow</h3>
              <p className="text-gray-600 mb-4">Buyer funds the escrow through bKash payment.</p>
              <div className="mt-auto">
                <Shield className="w-16 h-16 text-orange-200 mx-auto" />
              </div>
            </div>
            
            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-emerald-200">
              <ArrowRight className="w-12 h-12" />
            </div>
            
            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-2xl mb-4">3</div>
              <h3 className="text-xl font-bold text-emerald-800 mb-3">Complete & Release</h3>
              <p className="text-gray-600 mb-4">Confirm delivery and automatically release payment to seller.</p>
              <div className="mt-auto">
                <Check className="w-16 h-16 text-emerald-200 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-emerald-50 to-orange-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-800 mb-4">
              <span className="bengali block text-lg text-orange-600">আমাদের গ্রাহকরা কি বলেন</span>
              What Our Users Say
            </h2>
            <p className="text-gray-600">Join thousands of satisfied users across Bangladesh</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-xl p-8 shadow-sm card-hover">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold mr-4">র</div>
                <div>
                  <h4 className="font-bold text-emerald-800">রহিমা আক্তার</h4>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-orange-500 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">"আমি আমার ছোট দোকানের জন্য Vorosha Pay ব্যবহার করি। এটা খুব সহজ এবং নিরাপদ। গ্রাহকরা এখন QR কোড স্ক্যান করে দ্রুত পেমেন্ট করতে পারে।"</p>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-white rounded-xl p-8 shadow-sm card-hover">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold mr-4">K</div>
                <div>
                  <h4 className="font-bold text-emerald-800">Kamal Hossain</h4>
                  <div className="flex items-center">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-orange-500 fill-current" />
                    ))}
                    <Star className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">"As a freelancer, Vorosha Pay has made receiving international payments so much easier. The escrow system gives me confidence."</p>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-white rounded-xl p-8 shadow-sm card-hover">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold mr-4">S</div>
                <div>
                  <h4 className="font-bold text-emerald-800">Sharmin Akter</h4>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-orange-500 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">"আমি প্রতিমাসে ঢাকা থেকে সিলেটে টাকা পাঠাই। আগে অনেক সময় লাগত, এখন Vorosha Pay দিয়ে মুহূর্তেই টাকা চলে যায়।"</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-800 text-white relative overflow-hidden">
        <div className="alpana-pattern"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bengali block text-lg text-orange-300">এখনই শুরু করুন</span>
              Ready to Experience Secure Payments?
            </h2>
            <p className="text-lg text-emerald-100 mb-10">Join thousands of users who trust Vorosha Pay for their secure transactions</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/register" className="px-8 py-4 bg-white text-emerald-800 font-medium rounded-full hover:bg-gray-100 transition text-center">
                Get Started Now
              </Link>
              <Link href="#contact" className="px-8 py-4 border border-white text-white font-medium rounded-full hover:bg-emerald-700 transition text-center">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl mr-2">V</div>
                <span className="text-xl font-bold">Vorosha Pay</span>
              </div>
              <p className="text-gray-400 mb-6">Bangladesh's most trusted digital escrow platform with AI-powered security.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Developers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">© 2025 Vorosha Pay. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
