import React, { useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import MentorshipSection from '@/components/MentorshipSection';
import AIAssistantSection from '@/components/AIAssistantSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Index = () => {
  useEffect(() => {
    document.title = "AlumniConnect";
  }, []);
  useEffect(() => {
    // Animation for elements when they enter the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => observer.observe(el));
    
    return () => {
      animateElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar />
      <HeroSection />
      <FeaturesSection />
      <AIAssistantSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
