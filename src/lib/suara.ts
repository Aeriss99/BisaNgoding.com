let voices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

export function bisaBersuara(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(false);
      return;
    }
    
    if (voicesLoaded) {
      resolve(voices.some(v => v.lang.startsWith('en')));
      return;
    }
    
    const checkVoices = () => {
      voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoaded = true;
        resolve(voices.some(v => v.lang.startsWith('en')));
        return true;
      }
      return false;
    };
    
    if (checkVoices()) return;
    
    const timeout = setTimeout(() => {
      resolve(checkVoices());
    }, 2000);
    
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      clearTimeout(timeout);
      resolve(checkVoices());
    }, { once: true });
  });
}

export function ucapkan(teks: string, lambat = false): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(teks);
    
    let voice = voices.find(v => v.lang === 'en-US');
    if (!voice) voice = voices.find(v => v.lang === 'en-GB');
    if (!voice) voice = voices.find(v => v.lang.startsWith('en'));
    
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = lambat ? 0.6 : 0.9;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error('SpeechSynthesis error:', e);
  }
}
