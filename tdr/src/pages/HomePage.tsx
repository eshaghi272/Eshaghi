import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import Treatments from '../components/Treatments';
import About from '../components/About';
import Testimonials from '../components/Testimonials';
import InstagramGallery from '../components/InstagramGallery';
import Consultation from '../components/Consultation';
import Footer from '../components/Footer';
import SignupBanner from '../components/SignupBanner';
import CookieBanner from '../components/CookieBanner';
import AuthModal from '../components/AuthModal';
import DataService from '../services/DataService';

interface HomePageProps {
  onNavigateToAppointments?: () => void;
  onNavigateToAdmin?: () => void; // ✅ اضافه شده
}

const HomePage: React.FC<HomePageProps> = ({ onNavigateToAppointments, onNavigateToAdmin }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const handleLogin = (data: { phone: string; nationalCode: string; fullName?: string }) => {
    console.log('Login successful:', data);
    setUser(data);
    setIsAuthOpen(false);
    if (onNavigateToAppointments) {
      onNavigateToAppointments();
    }
  };

  const handleRegister = (data: { phone: string; nationalCode: string; fullName: string }) => {
    console.log('Register successful:', data);
    setUser(data);
    setIsAuthOpen(false);
    if (onNavigateToAppointments) {
      onNavigateToAppointments();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation 
        onNavigateToAppointments={onNavigateToAppointments}
        onOpenAuth={() => setIsAuthOpen(true)}
        onNavigateToAdmin={onNavigateToAdmin} // ✅ پاس دادن prop
      />
      <main>
        <Hero onBookAppointment={() => setIsAuthOpen(true)} />
        <SignupBanner />
        <Treatments />
        <About />
        <Testimonials />
        <InstagramGallery />
        <Consultation />
        <Footer />
      </main>
      <CookieBanner />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
};

export default HomePage;