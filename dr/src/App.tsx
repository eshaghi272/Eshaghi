import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { DBProvider } from './context/DBContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Testimonials from './pages/Testimonials';
import News from './pages/News';
import Education from './pages/Education';
import Contact from './pages/Contact';
import BookAppointment from './pages/BookAppointment';
import ArticleDetail from './pages/ArticleDetail';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DBProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<ArticleDetail />} />
                <Route path="/education" element={<Education />} />
                <Route path="/education/:id" element={<ArticleDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/book" element={<BookAppointment />} />
              </Routes>
            </Layout>
          </Router>
        </DBProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
