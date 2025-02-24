import EngFont from '../assets/fonts/monasans/Mona-Sans.ttf';
import ThFont from '../assets/fonts/sarabun/Sarabun-Regular.ttf';
import ThBoldFont from '../assets/fonts/sarabun/Sarabun-Bold.ttf';
import ThItalicFont from '../assets/fonts/sarabun/Sarabun-Italic.ttf';

export const preloadFonts = () => {
    const fonts = [
      { family: 'MonaSans', url: EngFont },
      { family: 'Sarabun', url: ThFont },
      { family: 'Sarabun', url: ThBoldFont },
      { family: 'Sarabun', url: ThItalicFont },
      // Add other fonts here
    ];
  
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font.url;
      link.as = 'font';
      link.type = 'font/ttf';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  };