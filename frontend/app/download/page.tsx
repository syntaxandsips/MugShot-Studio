'use client';

import { Header } from "@/src/components/ui/header-2";
import Footer from "@/src/components/ui/footer";
import { Download, Smartphone, Play, AppWindow, ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { AuthModal } from "@/src/components/ui/auth-modal";
import { DotScreenShader } from "@/src/components/ui/dot-shader-background";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import React from "react";
import { motion } from "framer-motion";

export default function DownloadPage() {
  const [authOpen, setAuthOpen] = React.useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-white overflow-x-hidden">
        
      {/* Background with z-index 0 */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none opacity-40">
        <DotScreenShader />
      </div>

      {/* Content wrapper with z-index 10 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 flex flex-col items-center justify-center w-full py-20">
          <div className="w-full max-w-6xl mx-auto px-4 flex flex-col items-center text-center">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12 flex flex-col items-center"
            >
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium border-teal-600/20 bg-teal-600/10 text-teal-800 mb-8">
                Latest Version v1.0.2
              </div>
              
              <GradientHeading variant="black" size="xll" weight="bold" className="mb-8">
                Download MugShot
              </GradientHeading>
              
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4">
                Experience the power of AI-crafted thumbnails directly on your device. 
                Choose your platform below to get started.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid md:grid-cols-3 gap-8 w-full max-w-5xl"
            >
              {/* Google Play */}
              <div className="group relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col">
                <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
                  <Play className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 text-left">Android</h3>
                <p className="text-gray-500 mb-8 text-left">Get it on Google Play Store for the best experience.</p>
                <div className="mt-auto">
                   <Button 
                    className="w-full h-12 text-lg bg-teal-700 hover:bg-teal-800 text-white rounded-xl"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download APK
                  </Button>
                  <p className="text-xs text-gray-400 mt-3 text-center">Requires Android 8.0+</p>
                </div>
              </div>

              {/* F-Droid */}
              <div className="group relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col">
                 <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                  <AppWindow className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 text-left">F-Droid</h3>
                <p className="text-gray-500 mb-8 text-left">Privacy-focused open source repository.</p>
                <div className="mt-auto">
                   <Button 
                    variant="outline"
                    className="w-full h-12 text-lg border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-xl"
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    View on F-Droid
                  </Button>
                  <p className="text-xs text-gray-400 mt-3 text-center">Signed source available</p>
                </div>
              </div>

              {/* iOS */}
              <div className="group relative bg-gray-50/80 backdrop-blur-sm border border-dashed border-gray-300 rounded-3xl p-8 flex flex-col opacity-80">
                 <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                  <Smartphone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-500 mb-2 text-left">iOS</h3>
                <p className="text-gray-400 mb-8 text-left">Coming soon to the Apple App Store.</p>
                <div className="mt-auto">
                   <Button 
                    disabled
                    className="w-full h-12 text-lg bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed"
                  >
                    Coming Soon
                  </Button>
                  <p className="text-xs text-gray-300 mt-3 text-center">Join waitlist for updates</p>
                </div>
              </div>

            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}