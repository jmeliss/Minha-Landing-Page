const titulo = document.querySelector('.glitch');

function dispararGlitch() {
    titulo.classList.add('glitch-burst');
    setTimeout(() => titulo.classList.remove('glitch-burst'), 250);
}

if (titulo && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    setTimeout(dispararGlitch, 800);

    setInterval(() => {
        dispararGlitch();
    }, 400 + Math.random() * 4000);
}