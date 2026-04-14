// --- GENERATE WIPE TAPES ---
// Create 20 tapes per rotator (10.2vmax each = 204vmax) for dual-axis woven grid coverage
document.addEventListener('DOMContentLoaded', () => {
    const rotatorA = document.getElementById('wipe-rotator-a');
    const rotatorB = document.getElementById('wipe-rotator-b');
    for (let i = 0; i < 20; i++) {
        const isEven = i % 2 === 0;
        [rotatorA, rotatorB].forEach(rotator => {
            const tape = document.createElement('div');
            tape.className = `wipe-tape ${isEven ? 'even tape-white' : 'odd tape-carbon'}`;
            tape.innerHTML = `<div class="ticker-track ${isEven ? 'reverse' : ''}"><span></span><span></span></div>`;
            rotator.appendChild(tape);
        });
    }
    updateTickerContent();
    initContinuousTickers();
});

// --- JAVASCRIPT ANIMATION ENGINE ---
let tickerAnims = [];
let decayInterval = null;

function initContinuousTickers() {
    const tracks = document.querySelectorAll('.tape-ambient .ticker-track, .wipe-tape .ticker-track');
    if (!tracks.length) return;
    tracks.forEach((track, index) => {
        // Crawl speeds (extremely slow base)
        const durations = [600000, 750000, 550000, 650000];
        const isReverse = track.classList.contains('reverse');
        let anim = track.animate([
            { transform: isReverse ? 'translateX(-50%)' : 'translateX(0)' },
            { transform: isReverse ? 'translateX(0)' : 'translateX(-50%)' }
        ], { duration: durations[index % 4], iterations: Infinity });
        tickerAnims.push(anim);
    });
}

function burstSpeed() {
    if (!tickerAnims.length) return;
    if (decayInterval) clearInterval(decayInterval);
    
    tickerAnims.forEach(anim => {
        anim.playbackRate = 50; 
    });
    
    decayInterval = setInterval(() => {
        let allDone = true;
        tickerAnims.forEach(anim => {
            anim.playbackRate *= 0.94; 
            if(anim.playbackRate > 1.05) allDone = false;
            else anim.playbackRate = 1;
        });
        if(allDone) {
            clearInterval(decayInterval);
            decayInterval = null;
        }
    }, 50);
}

// --- PRESENTATION CONTROLS ---
let currentSlide = 0;
let isWiping = false;
const slides = document.querySelectorAll('.slide');
const presentation = document.getElementById('presentation');
const wipeOverlay = document.getElementById('wipe-overlay');

function updateTickerContent() {
    let tickerText = slides[currentSlide].getAttribute('data-ticker') || 'HUMAN CAPITAL QUARTERLY &mdash; ';
    tickerText = tickerText.trim() + '&nbsp;&nbsp;'; // Non-breaking spaces to avoid browser render snapping
    const repeatedText = tickerText.repeat(50); // Massive repeat for 250vw safety
    
    document.querySelectorAll('.ticker-track span').forEach(span => {
        span.innerHTML = repeatedText;
    });
}

function showSlide(index) {
  if (isWiping) return; // Lock navigation if transition is running

  currentSlide = index;
  if (currentSlide >= slides.length) currentSlide = 0;
  if (currentSlide < 0) currentSlide = slides.length - 1;
  slides.forEach(slide => slide.classList.remove('active'));
  slides[currentSlide].classList.add('active');

  if (presentation.classList.contains('ambient')) {
      presentation.classList.remove('ambient');
  }
  updateTickerContent();
}

function toggleAmbient() {
  if (isWiping) return;
  isWiping = true;

  // 1. Fire the wipe curtain to cover the screen
  wipeOverlay.classList.add('active');
  wipeOverlay.classList.add('wiping-in');
  burstSpeed(); // Fire the hyper speed tape crawl

  setTimeout(() => {
      // 2. Midpoint: Screen is completely covered by tapes. Swap modes underneath.
      presentation.classList.toggle('ambient');
      
      // 3. Fire the wipe out
      wipeOverlay.classList.remove('wiping-in');
      wipeOverlay.classList.add('wiping-out');
      
      setTimeout(() => {
          // 4. Cleanup
          wipeOverlay.classList.remove('wiping-out');
          wipeOverlay.classList.remove('active');
          isWiping = false;
      }, 950); 
  }, 900); 
}

function toggleFullScreen() {
  if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => { console.log(err); }); } 
  else { if (document.exitFullscreen) { document.exitFullscreen(); } }
}

document.addEventListener('keydown', (e) => {
  if (isWiping) return; // Lock key input during wipe animation
  if (e.key === 'ArrowRight') { showSlide(currentSlide + 1); }
  else if (e.key === 'ArrowLeft') { showSlide(currentSlide - 1); }
  else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); toggleAmbient(); }
});

document.addEventListener('click', (e) => {
  if (isWiping) return; 
  if(e.target.tagName.toLowerCase() === 'button') return; 
  if(e.clientX > window.innerWidth / 2) { showSlide(currentSlide + 1); }
  else { showSlide(currentSlide - 1); }
});

// --- PPTX GENERATION ---
function downloadPPTX() {
  if (typeof PptxGenJS === 'undefined') {
    alert('Presentation library not loaded. Please check your internet connection and try again.');
    return;
  }
  try {
  let pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9'; 
  const cWhite = 'F9F9F8', cCarbon = '121212', cRed = 'E4002B', cBlue = '41B6E6';
  
  // Slide 1
  let s1 = pptx.addSlide(); s1.background = { color: cWhite };
  s1.addText("THE", { x: 0, y: 0.4, w: 10, align: "center", fontFace: "Overpass", fontSize: 60, bold: true, color: cBlue });
  s1.addText("Human Capital", { x: 0, y: 1.1, w: 10, align: "center", fontFace: "Instrument Serif", fontSize: 44, italic: true, color: cRed, bold: false });
  s1.addText("SPRING", { x: 0, y: 1.6, w: 10, align: "center", fontFace: "Overpass", fontSize: 60, bold: true, color: cBlue });
  s1.addText("Quarterly", { x: 0, y: 2.3, w: 10, align: "center", fontFace: "Instrument Serif", fontSize: 44, italic: true, color: cRed, bold: false });
  s1.addText("FORUM", { x: 0, y: 2.8, w: 10, align: "center", fontFace: "Overpass", fontSize: 60, bold: true, color: cBlue });
  s1.addText("April 14, 2026 — MLK Library", { x: 0.5, y: 3.8, w: 4.5, fontFace: "IBM Plex Mono", fontSize: 11, bold: false, color: cCarbon });

  // Slide 2
  let s2 = pptx.addSlide(); s2.background = { color: cCarbon };
  s2.addText("Agenda", { x: 0.5, y: 0.4, w: 9, fontFace: "Instrument Serif", fontSize: 36, color: cWhite, bold: false });
  let agenda = [ "12:30 PM Opening Remarks", "12:45 PM Fireside Chat", "1:15 PM Employer Skills Demand", "2:00 PM BREAK", "2:15 PM LinkedIn Optimization", "3:30 PM Live Build Workshop" ];
  agenda.forEach((text, i) => { s2.addText(text, { x: 0.8, y: 1.0 + (i * 0.45), w: 8, fontFace: "IBM Plex Sans", fontSize: 16, color: cWhite }); });

  // Slide 3
  let s3 = pptx.addSlide(); s3.background = { color: cWhite };
  s3.addText("12:30 PM", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s3.addText("OPENING", { x: 0.5, y: 0.8, w: 9, fontFace: "Overpass", fontSize: 48, bold: true, color: cCarbon });
  s3.addText("How to use the day", { x: 0.5, y: 1.6, w: 9, fontFace: "Instrument Serif", fontSize: 24, color: cCarbon, bold: false });
  s3.addText("Ann Marie Guzzi & Brendan Whitaker", { x: 0.5, y: 2.4, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });
  s3.addText("LEVY STRATEGIC DESIGN", { x: 0.5, y: 2.7, w: 9, fontFace: "IBM Plex Mono", fontSize: 11, color: "666666", bold: false });
  s3.addText("Chelsea Kirkland", { x: 0.5, y: 3.4, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });
  s3.addText("DC PUBLIC LIBRARY", { x: 0.5, y: 3.7, w: 9, fontFace: "IBM Plex Mono", fontSize: 11, color: "666666", bold: false });

  // Slide 4
  let s4 = pptx.addSlide(); s4.background = { color: cWhite };
  s4.addText("12:45 PM", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s4.addText("FIRESIDE CHAT", { x: 0.5, y: 0.8, w: 9, fontFace: "Overpass", fontSize: 48, bold: true, color: cCarbon });
  s4.addText("Future of work in the capital region", { x: 0.5, y: 1.6, w: 9, fontFace: "Instrument Serif", fontSize: 24, color: cCarbon, bold: false });
  s4.addText("Clara Haskell Botstein", { x: 0.5, y: 2.2, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });
  s4.addText("CHIEF OF STAFF, DC'S OFFICE OF THE DEPUTY MAYOR FOR EDUCATION", { x: 0.5, y: 2.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 11, color: "666666", bold: false });
  s4.addText("in conversation with", { x: 0.5, y: 3.0, w: 9, fontFace: "Instrument Serif", fontSize: 16, italic: true, color: cCarbon, bold: false });
  s4.addText("Ann Marie Guzzi", { x: 0.5, y: 3.4, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });
  s4.addText("LEVY STRATEGIC DESIGN", { x: 0.5, y: 3.7, w: 9, fontFace: "IBM Plex Mono", fontSize: 11, color: "666666", bold: false });

  // Slide 5
  let s5 = pptx.addSlide(); s5.background = { color: cWhite };
  s5.addText("1:15 PM", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s5.addText("EMPLOYER\nSKILLS DEMAND", { x: 0.5, y: 0.8, w: 9, h: 1.2, fontFace: "Overpass", fontSize: 48, bold: true, color: cCarbon });
  s5.addText("In healthcare and energy", { x: 0.5, y: 2.0, w: 9, fontFace: "Instrument Serif", fontSize: 24, color: cCarbon, bold: false });
  s5.addText("Christian Jones", { x: 0.5, y: 2.5, w: 4, fontFace: "IBM Plex Sans", fontSize: 18, bold: true, color: cCarbon });
  s5.addText("DC HOSPITAL ASSOCIATION", { x: 0.5, y: 2.8, w: 4, fontFace: "IBM Plex Mono", fontSize: 10, color: "666666", bold: false });
  s5.addText("Brittny Pinto", { x: 5, y: 2.5, w: 4.5, fontFace: "IBM Plex Sans", fontSize: 18, bold: true, color: cCarbon });
  s5.addText("PEPCO'S WORKFORCE DEVELOPMENT INITIATIVES", { x: 5, y: 2.8, w: 4.5, fontFace: "IBM Plex Mono", fontSize: 10, color: "666666", bold: false });
  s5.addText("moderated by", { x: 0.5, y: 3.3, w: 9, fontFace: "Instrument Serif", fontSize: 16, italic: true, color: cCarbon, bold: false });
  s5.addText("Pat Philippe", { x: 0.5, y: 3.6, w: 9, fontFace: "IBM Plex Sans", fontSize: 18, bold: true, color: cCarbon });
  s5.addText("WORKFORCE INVESTMENT COUNCIL", { x: 0.5, y: 3.9, w: 9, fontFace: "IBM Plex Mono", fontSize: 10, color: "666666", bold: false });

  // Slide 6
  let s6 = pptx.addSlide(); s6.background = { color: cBlue };
  s6.addText("2:00 PM", { x: 0, y: 1.5, w: 10, align: "center", fontFace: "IBM Plex Mono", fontSize: 18, color: cCarbon, bold: false });
  s6.addText("15 MINUTE\nBREAK", { x: 0, y: 1.8, w: 10, h: 2, align: "center", fontFace: "Overpass", fontSize: 60, bold: true, color: cCarbon });
  s6.addText("Visit Marianne’s Cafe for DC Central Kitchen coffee!", { x: 0.5, y: 3.8, w: 9, fontFace: "Caveat", fontSize: 18, color: cRed, italic: true });

  // Slide 7
  let s7 = pptx.addSlide(); s7.background = { color: cWhite };
  s7.addText("2:15 PM", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s7.addText("PERSONAL LINKEDIN\nOPTIMIZATION", { x: 0.5, y: 0.8, w: 9, h: 1.2, fontFace: "Overpass", fontSize: 48, bold: true, color: cCarbon });
  s7.addText("Led by Javi Calderon and Lea Berry", { x: 0.5, y: 2.2, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });
  s7.addText("EDUCATORS AND CAREER COACHES", { x: 0.5, y: 2.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 11, color: "666666", bold: false });

  // Slide 8
  let s8 = pptx.addSlide(); s8.background = { color: cRed };
  s8.addText("3:15 PM", { x: 0, y: 1.5, w: 10, align: "center", fontFace: "IBM Plex Mono", fontSize: 18, color: cWhite, bold: false });
  s8.addText("15 MINUTE\nBREAK", { x: 0, y: 1.8, w: 10, h: 2, align: "center", fontFace: "Overpass", fontSize: 60, bold: true, color: cWhite });

  // Slide 9
  let s9 = pptx.addSlide(); s9.background = { color: cWhite };
  s9.addText("3:30 PM", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s9.addText("LIVE BUILD\nWORKSHOP", { x: 0.5, y: 0.8, w: 9, h: 1.2, fontFace: "Overpass", fontSize: 48, bold: true, color: cCarbon });
  s9.addText("Solving a real-world problem with AI", { x: 0.5, y: 2.0, w: 9, fontFace: "Instrument Serif", fontSize: 24, color: cCarbon, bold: false });
  s9.addText("With Civic Tech DC", { x: 0.5, y: 2.8, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });

  // Slide 10
  let s10 = pptx.addSlide(); s10.background = { color: cCarbon };
  s10.addText("UP NEXT", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s10.addText("The Upskilling Labs’\nShowcase Summit", { x: 0.5, y: 0.8, w: 9, h: 1.5, fontFace: "Instrument Serif", fontSize: 40, color: cWhite, bold: false });
  s10.addText("Stay for panels on AI’s impact on climate and energy and project demos from The Upskilling Labs community.", { x: 0.5, y: 2.5, w: 8.5, h: 1.5, fontFace: "IBM Plex Sans", fontSize: 16, color: cWhite });

  pptx.writeFile({ fileName: "HCQ_Spring_Forum_Presentation.pptx" });
  } catch (err) {
    alert('Download failed: ' + err.message);
    console.error(err);
  }
}