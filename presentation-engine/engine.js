// --- GENERATE WIPE TAPES ---
// 28 tapes per rotator in 3 size classes (lg/md/sm) for varied-height woven grid coverage
document.addEventListener('DOMContentLoaded', () => {
    const rotatorA = document.getElementById('wipe-rotator-a');
    const rotatorB = document.getElementById('wipe-rotator-b');

    const sizePattern = ['wt-lg', 'wt-sm', 'wt-md', 'wt-sm', 'wt-lg', 'wt-md', 'wt-sm', 'wt-md'];
    const tapesPerRotator = 28;
    const staggerStep = 0.018; // seconds between each tape's animation start

    for (let i = 0; i < tapesPerRotator; i++) {
        const isEven = i % 2 === 0;
        const sizeClass = sizePattern[i % sizePattern.length];

        [rotatorA, rotatorB].forEach(rotator => {
            const tape = document.createElement('div');
            tape.className = `wipe-tape ${sizeClass} ${isEven ? 'even tape-white' : 'odd tape-carbon'}`;
            tape.innerHTML = `<div class="ticker-track ${isEven ? 'reverse' : ''}"><span></span><span></span></div>`;

            // Center-out stagger: tapes near center fire first, edges last
            const distFromCenter = Math.abs(i - (tapesPerRotator / 2));
            const delay = distFromCenter * staggerStep;
            tape.style.animationDelay = `${delay.toFixed(3)}s`;

            rotator.appendChild(tape);
        });
    }

    createAmbientMarginalia();
    updateTickerContent();
    initContinuousTickers();

    // Set initial logo filter based on the first slide's background
    const firstSlide = slides[0];
    const initDark = firstSlide.classList.contains('bg-carbon') || firstSlide.classList.contains('bg-red');
    presentation.setAttribute('data-slide-bg', initDark ? 'dark' : 'light');
});

// --- AMBIENT MARGINALIA GENERATOR ---
function createAmbientMarginalia() {
    const wrapper = document.querySelector('.ambient-marginalia-wrapper');
    if (!wrapper) return;

    const phrases = [
        'what matters is people',
        'the future of work starts here',
        'skills are the new currency',
        'invest in human capital',
    ];

    const classes = ['marg-1', 'marg-2', 'marg-3', 'marg-4'];

    classes.forEach((cls, i) => {
        const el = document.createElement('div');
        el.className = `ambient-marginalia ${cls}`;
        el.textContent = phrases[i % phrases.length];
        wrapper.appendChild(el);
    });
}

// --- JAVASCRIPT ANIMATION ENGINE ---
let tickerAnims = [];
let decayInterval = null;
let spinUpInterval = null;

function initContinuousTickers() {
    // Skip all ticker motion when the user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Ambient + wipe ticker tracks
    const tracks = document.querySelectorAll('.tape-ambient .ticker-track, .wipe-tape .ticker-track');
    if (!tracks.length) return;

    // Expanded duration pool for 8 ambient tapes — more variation, all very slow
    const durations = [720000, 840000, 600000, 900000, 660000, 780000, 540000, 810000];

    tracks.forEach((track, index) => {
        const isReverse = track.classList.contains('reverse');
        let anim = track.animate([
            { transform: isReverse ? 'translateX(-50%)' : 'translateX(0)' },
            { transform: isReverse ? 'translateX(0)' : 'translateX(-50%)' }
        ], { duration: durations[index % durations.length], iterations: Infinity });
        tickerAnims.push(anim);
    });

    // Marginalia: horizontal drift across the full viewport width
    const margElements = document.querySelectorAll('.ambient-marginalia');
    const margDurations = [85000, 110000, 95000, 75000];

    margElements.forEach((el, index) => {
        const isReverse = index % 2 === 1;
        let anim = el.animate([
            { transform: `translateX(${isReverse ? '100vw' : '-100vw'})` },
            { transform: `translateX(${isReverse ? '-100vw' : '100vw'})` }
        ], { duration: margDurations[index % margDurations.length], iterations: Infinity });
        tickerAnims.push(anim);
    });
}

// Flywheel physics: asymmetric spin-up / wind-down for heavy-object momentum
function burstSpeed() {
    if (!tickerAnims.length) return;
    if (decayInterval) clearInterval(decayInterval);
    if (spinUpInterval) clearInterval(spinUpInterval);

    const peakRate = 60;
    const spinUpDuration = 180;   // ms to reach peak (fast spin-up)
    const spinUpSteps = 6;
    const spinUpTick = spinUpDuration / spinUpSteps;

    let step = 0;

    // Phase 1: Spin-up — easeOutExpo ramp to peak
    spinUpInterval = setInterval(() => {
        step++;
        const t = step / spinUpSteps;
        const rate = peakRate * (1 - Math.pow(2, -10 * t));
        tickerAnims.forEach(anim => { anim.playbackRate = rate; });

        if (step >= spinUpSteps) {
            clearInterval(spinUpInterval);
            spinUpInterval = null;
            tickerAnims.forEach(anim => { anim.playbackRate = peakRate; });

            // Phase 2: Wind-down — exponential decay + linear drag (heavy flywheel friction)
            let elapsed = 0;
            const decayTick = 40;
            const halfLife = 600; // ms — time to reach half speed

            decayInterval = setInterval(() => {
                elapsed += decayTick;
                const decayFactor = Math.exp(-0.693 * elapsed / halfLife);
                const linearDrag = Math.max(0, 1 - (elapsed / 4000));
                const rate = Math.max(1, peakRate * decayFactor * (0.7 + 0.3 * linearDrag));

                tickerAnims.forEach(anim => { anim.playbackRate = rate; });

                if (rate <= 1.02) {
                    tickerAnims.forEach(anim => { anim.playbackRate = 1; });
                    clearInterval(decayInterval);
                    decayInterval = null;
                }
            }, decayTick);
        }
    }, spinUpTick);
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

  // Update logo filter: dark backgrounds (carbon, red) need white logos; light need dark logos
  const bg = slides[currentSlide];
  presentation.setAttribute('data-slide-bg',
    (bg.classList.contains('bg-carbon') || bg.classList.contains('bg-red')) ? 'dark' : 'light'
  );

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
  burstSpeed(); // Fire the flywheel speed burst

  setTimeout(() => {
      // 2. Midpoint: all tapes on screen. Swap modes underneath.
      presentation.classList.toggle('ambient');

      // 3. Fire the wipe out
      wipeOverlay.classList.remove('wiping-in');
      wipeOverlay.classList.add('wiping-out');

      setTimeout(() => {
          // 4. Cleanup
          wipeOverlay.classList.remove('wiping-out');
          wipeOverlay.classList.remove('active');
          isWiping = false;
      }, 1100); // wipe-duration (1050) + buffer (50)
  }, 1100);   // wipe-duration (1050) + max stagger (252) - overlap (200)
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
  if (e.target.closest('#ui-controls')) return;
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

  // Slide 1 — Title
  let s1 = pptx.addSlide(); s1.background = { color: cWhite };
  s1.addText("THE", { x: 0, y: 0.4, w: 10, align: "center", fontFace: "Overpass", fontSize: 60, bold: true, color: cBlue });
  s1.addText("Human Capital", { x: 0, y: 1.1, w: 10, align: "center", fontFace: "Instrument Serif", fontSize: 44, italic: true, color: cRed, bold: false });
  s1.addText("SPRING", { x: 0, y: 1.6, w: 10, align: "center", fontFace: "Overpass", fontSize: 60, bold: true, color: cBlue });
  s1.addText("Quarterly", { x: 0, y: 2.3, w: 10, align: "center", fontFace: "Instrument Serif", fontSize: 44, italic: true, color: cRed, bold: false });
  s1.addText("FORUM", { x: 0, y: 2.8, w: 10, align: "center", fontFace: "Overpass", fontSize: 60, bold: true, color: cBlue });
  s1.addText("April 14, 2026 — MLK Jr. Memorial Library", { x: 0.5, y: 3.8, w: 7, fontFace: "IBM Plex Mono", fontSize: 11, bold: false, color: cCarbon });

  // Slide 2 — Presented By
  let s2 = pptx.addSlide(); s2.background = { color: cCarbon };
  s2.addText("PRESENTED BY", { x: 0, y: 0.5, w: 10, align: "center", fontFace: "IBM Plex Mono", fontSize: 12, color: "888888", bold: false });
  s2.addText("DC PUBLIC LIBRARY", { x: 0.5, y: 1.1, w: 9, align: "center", fontFace: "Overpass", fontSize: 44, bold: true, color: cWhite });
  s2.addText("&", { x: 0, y: 2.05, w: 10, align: "center", fontFace: "Instrument Serif", fontSize: 26, color: "888888", italic: true, bold: false });
  s2.addText("LEVY STRATEGIC DESIGN", { x: 0.5, y: 2.45, w: 9, align: "center", fontFace: "Overpass", fontSize: 44, bold: true, color: cWhite });
  s2.addText("In partnership with CivicTech DC and The Upskilling Labs", { x: 0.5, y: 3.55, w: 9, align: "center", fontFace: "IBM Plex Sans", fontSize: 15, color: "888888", bold: false });

  // Slide 3 — Agenda
  let s3 = pptx.addSlide(); s3.background = { color: cCarbon };
  s3.addText("Agenda", { x: 0.5, y: 0.4, w: 9, fontFace: "Instrument Serif", fontSize: 36, color: cWhite, bold: false });
  let agenda = [ "12:30 PM  Opening Remarks", "12:45 PM  Fireside Chat", "1:15 PM   Employer Skills Demand", "2:00 PM   Break", "2:15 PM   Personal LinkedIn Optimization", "3:30 PM   Live Build Workshop" ];
  agenda.forEach((text, i) => { s3.addText(text, { x: 0.8, y: 1.0 + (i * 0.45), w: 8, fontFace: "IBM Plex Sans", fontSize: 16, color: cWhite }); });

  // Slide 4 — Opening Remarks
  let s4 = pptx.addSlide(); s4.background = { color: cWhite };
  s4.addText("12:30 PM", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s4.addText("OPENING", { x: 0.5, y: 0.8, w: 9, fontFace: "Overpass", fontSize: 48, bold: true, color: cCarbon });
  s4.addText("How to use the day", { x: 0.5, y: 1.6, w: 9, fontFace: "Instrument Serif", fontSize: 24, color: cCarbon, bold: false });
  s4.addText("Ann Marie Guzzi & Brendan Whitaker", { x: 0.5, y: 2.4, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });
  s4.addText("LEVY STRATEGIC DESIGN", { x: 0.5, y: 2.7, w: 9, fontFace: "IBM Plex Mono", fontSize: 11, color: "666666", bold: false });
  s4.addText("Chelsea Kirkland", { x: 0.5, y: 3.4, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });
  s4.addText("DC PUBLIC LIBRARY", { x: 0.5, y: 3.7, w: 9, fontFace: "IBM Plex Mono", fontSize: 11, color: "666666", bold: false });

  // Slide 5 — Fireside Chat
  let s5 = pptx.addSlide(); s5.background = { color: cWhite };
  s5.addText("12:45 PM", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s5.addText("FIRESIDE CHAT", { x: 0.5, y: 0.8, w: 9, fontFace: "Overpass", fontSize: 48, bold: true, color: cCarbon });
  s5.addText("Future of work in the capital region", { x: 0.5, y: 1.6, w: 9, fontFace: "Instrument Serif", fontSize: 24, color: cCarbon, bold: false });
  s5.addText("Clara Haskell Botstein", { x: 0.5, y: 2.2, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });
  s5.addText("CHIEF OF STAFF, DC'S OFFICE OF THE DEPUTY MAYOR FOR EDUCATION", { x: 0.5, y: 2.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 11, color: "666666", bold: false });
  s5.addText("in conversation with", { x: 0.5, y: 3.0, w: 9, fontFace: "Instrument Serif", fontSize: 16, italic: true, color: cCarbon, bold: false });
  s5.addText("Ann Marie Guzzi", { x: 0.5, y: 3.4, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });
  s5.addText("LEVY STRATEGIC DESIGN", { x: 0.5, y: 3.7, w: 9, fontFace: "IBM Plex Mono", fontSize: 11, color: "666666", bold: false });

  // Slide 6 — Employer Skills Demand
  let s6 = pptx.addSlide(); s6.background = { color: cWhite };
  s6.addText("1:15 PM", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s6.addText("EMPLOYER\nSKILLS DEMAND", { x: 0.5, y: 0.8, w: 9, h: 1.2, fontFace: "Overpass", fontSize: 48, bold: true, color: cCarbon });
  s6.addText("In healthcare and energy", { x: 0.5, y: 2.0, w: 9, fontFace: "Instrument Serif", fontSize: 24, color: cCarbon, bold: false });
  s6.addText("Christian Jones", { x: 0.5, y: 2.5, w: 4, fontFace: "IBM Plex Sans", fontSize: 18, bold: true, color: cCarbon });
  s6.addText("DC HOSPITAL ASSOCIATION", { x: 0.5, y: 2.8, w: 4, fontFace: "IBM Plex Mono", fontSize: 10, color: "666666", bold: false });
  s6.addText("Brittny Pinto", { x: 5, y: 2.5, w: 4.5, fontFace: "IBM Plex Sans", fontSize: 18, bold: true, color: cCarbon });
  s6.addText("PEPCO WORKFORCE DEVELOPMENT INITIATIVES", { x: 5, y: 2.8, w: 4.5, fontFace: "IBM Plex Mono", fontSize: 10, color: "666666", bold: false });
  s6.addText("moderated by", { x: 0.5, y: 3.3, w: 9, fontFace: "Instrument Serif", fontSize: 16, italic: true, color: cCarbon, bold: false });
  s6.addText("Pat Philippe", { x: 0.5, y: 3.6, w: 9, fontFace: "IBM Plex Sans", fontSize: 18, bold: true, color: cCarbon });
  s6.addText("WORKFORCE INVESTMENT COUNCIL", { x: 0.5, y: 3.9, w: 9, fontFace: "IBM Plex Mono", fontSize: 10, color: "666666", bold: false });

  // Slide 7 — Break 1
  let s7 = pptx.addSlide(); s7.background = { color: cBlue };
  s7.addText("2:00 PM", { x: 0, y: 1.5, w: 10, align: "center", fontFace: "IBM Plex Mono", fontSize: 18, color: cCarbon, bold: false });
  s7.addText("15 MINUTE\nBREAK", { x: 0, y: 1.8, w: 10, h: 2, align: "center", fontFace: "Overpass", fontSize: 60, bold: true, color: cCarbon });
  s7.addText("Visit Marianne's Cafe for DC Central Kitchen coffee!", { x: 0.5, y: 3.8, w: 9, fontFace: "Caveat", fontSize: 18, color: cRed, italic: true });

  // Slide 8 — Personal LinkedIn Optimization
  let s8 = pptx.addSlide(); s8.background = { color: cWhite };
  s8.addText("2:15 PM", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s8.addText("PERSONAL LINKEDIN\nOPTIMIZATION", { x: 0.5, y: 0.8, w: 9, h: 1.2, fontFace: "Overpass", fontSize: 48, bold: true, color: cCarbon });
  s8.addText("Javi Calderon and Lea Berry", { x: 0.5, y: 2.2, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });
  s8.addText("EDUCATORS AND CAREER COACHES", { x: 0.5, y: 2.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 11, color: "666666", bold: false });

  // Slide 9 — Break 2
  let s9 = pptx.addSlide(); s9.background = { color: cRed };
  s9.addText("3:15 PM", { x: 0, y: 1.5, w: 10, align: "center", fontFace: "IBM Plex Mono", fontSize: 18, color: cWhite, bold: false });
  s9.addText("15 MINUTE\nBREAK", { x: 0, y: 1.8, w: 10, h: 2, align: "center", fontFace: "Overpass", fontSize: 60, bold: true, color: cWhite });

  // Slide 10 — Live Build Workshop
  let s10 = pptx.addSlide(); s10.background = { color: cWhite };
  s10.addText("3:30 PM", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s10.addText("LIVE BUILD\nWORKSHOP", { x: 0.5, y: 0.8, w: 9, h: 1.2, fontFace: "Overpass", fontSize: 48, bold: true, color: cCarbon });
  s10.addText("Solving a real-world problem with AI", { x: 0.5, y: 2.0, w: 9, fontFace: "Instrument Serif", fontSize: 24, color: cCarbon, bold: false });
  s10.addText("Civic Tech DC", { x: 0.5, y: 2.8, w: 9, fontFace: "IBM Plex Sans", fontSize: 20, bold: true, color: cCarbon });

  // Slide 11 — Up Next
  let s11 = pptx.addSlide(); s11.background = { color: cCarbon };
  s11.addText("UP NEXT", { x: 0.5, y: 0.5, w: 9, fontFace: "IBM Plex Mono", fontSize: 14, color: cRed, bold: false });
  s11.addText("The Upskilling Labs'\nShowcase Summit", { x: 0.5, y: 0.8, w: 9, h: 1.5, fontFace: "Instrument Serif", fontSize: 40, color: cWhite, bold: false });
  s11.addText("Stay for panels on AI's impact on climate and energy and project demos from The Upskilling Labs community.", { x: 0.5, y: 2.5, w: 8.5, h: 1.5, fontFace: "IBM Plex Sans", fontSize: 16, color: cWhite });

  pptx.writeFile({ fileName: "HCQ_Spring_Forum_Presentation.pptx" });
  } catch (err) {
    alert('Download failed: ' + err.message);
    console.error(err);
  }
}

// Expose functions globally so inline onclick handlers work regardless of
// module scope or script-loading order after external merges
window.toggleFullScreen = toggleFullScreen;
window.toggleAmbient = toggleAmbient;
window.downloadPPTX = downloadPPTX;