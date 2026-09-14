(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1) CHUVA DE GIRASSÓIS E CORAÇÕES (canvas, sem CSS animation)
     Desenhada 100% via JS/canvas para não depender de nenhuma
     animação CSS (evita qualquer regra de acessibilidade ou
     extensão do navegador que zere "animation-duration").
  ========================================================= */
  var canvas = document.getElementById('rain-canvas');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var dpr = Math.max(1, window.devicePixelRatio || 1);

  var particles = [];
  var maxParticles = 55;
  var heartChance = 0.22;
  var spawnEveryMs = reduceMotion ? 1400 : 550;
  var lastSpawnTime = 0;
  var lastFrameTime = null;

  var emojisFlor = ['🌻', '🌼'];
  var emojisCoracao = ['❤️', '💛', '💕'];

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeParticle(emoji) {
    return {
      kind: 'emoji',
      emoji: emoji,
      x: Math.random() * window.innerWidth,
      y: -40,
      size: 20 + Math.random() * 20,
      vy: (reduceMotion ? 18 : 32) + Math.random() * 22, // px/s
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.5 + Math.random() * 0.7,
      swayAmount: 10 + Math.random() * 14,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 1.1,
      opacity: 0,
      life: 0,
    };
  }

  var confettiColors = ['#f4b942', '#ffb6a3', '#ffd9a0', '#6b4226', '#ffffff', '#e0a52c'];

  function makeConfettiParticle(fromTop) {
    return {
      kind: 'confetti',
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      x: Math.random() * window.innerWidth,
      y: fromTop ? -20 : Math.random() * window.innerHeight * 0.3,
      w: 6 + Math.random() * 7,
      h: 10 + Math.random() * 8,
      vy: (reduceMotion ? 30 : 60) + Math.random() * 60,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.8 + Math.random() * 1.2,
      swayAmount: 20 + Math.random() * 30,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 4,
      opacity: 0,
      life: 0,
    };
  }

  function spawnParticle(forceHeart) {
    if (!ctx || particles.length >= maxParticles) return;
    var isHeart = forceHeart || Math.random() < heartChance;
    var pool = isHeart ? emojisCoracao : emojisFlor;
    var emoji = pool[Math.floor(Math.random() * pool.length)];
    particles.push(makeParticle(emoji));
  }

  function burstHearts(amount) {
    for (var i = 0; i < amount; i++) {
      setTimeout(function () {
        if (particles.length >= maxParticles + 40) return;
        var emoji = emojisCoracao[Math.floor(Math.random() * emojisCoracao.length)];
        particles.push(makeParticle(emoji));
      }, i * 45);
    }
  }

  var emojisComemoracao = ['🎉', '✨', '🥳', '💛', '🌻', '❤️'];

  function burstCelebration(amount) {
    for (var i = 0; i < amount; i++) {
      setTimeout(function () {
        if (particles.length >= maxParticles + 90) return;
        if (Math.random() < 0.55) {
          particles.push(makeConfettiParticle(true));
        } else {
          var emoji = emojisComemoracao[Math.floor(Math.random() * emojisComemoracao.length)];
          particles.push(makeParticle(emoji));
        }
      }, i * 35);
    }
  }

  function tick(time) {
    if (!ctx || !canvas) return;
    if (lastFrameTime === null) lastFrameTime = time;
    var dt = Math.min((time - lastFrameTime) / 1000, 0.05);
    lastFrameTime = time;

    if (time - lastSpawnTime > spawnEveryMs) {
      spawnParticle(false);
      lastSpawnTime = time;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life += dt;
      p.y += p.vy * dt;
      p.swayPhase += p.swaySpeed * dt;
      p.x += Math.sin(p.swayPhase) * p.swayAmount * dt;
      p.rotation += p.rotationSpeed * dt;
      p.opacity = Math.min(1, p.life / 0.4) * 0.85;

      if (p.y > window.innerHeight + 50) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.kind === 'confetti') {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        ctx.font = p.size + 'px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
      }

      ctx.restore();
    }

    requestAnimationFrame(tick);
  }

  if (canvas && ctx) {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(tick);
  }

  /* =========================================================
     2) BOTÃO FUJÃO
  ========================================================= */
  var btnNao = document.getElementById('btn-nao');
  var btnSim = document.getElementById('btn-sim');
  var fleeMargin = 16;
  var fleeRadius = 110; // distância (px) que ativa a fuga
  var isFleeing = false;

  function moveButtonAwayFrom(x, y) {
    if (!btnNao) return;

    var rect = btnNao.getBoundingClientRect();
    var maxX = window.innerWidth - rect.width - fleeMargin;
    var maxY = window.innerHeight - rect.height - fleeMargin;

    var newX = Math.random() * Math.max(maxX, 0);
    var newY = Math.random() * Math.max(maxY, 0);

    // garante que o novo ponto fique razoavelmente longe do cursor
    var attempts = 0;
    while (
      typeof x === 'number' &&
      Math.hypot((newX + rect.width / 2) - x, (newY + rect.height / 2) - y) < fleeRadius &&
      attempts < 6
    ) {
      newX = Math.random() * Math.max(maxX, 0);
      newY = Math.random() * Math.max(maxY, 0);
      attempts++;
    }

    if (!isFleeing) {
      btnNao.style.position = 'fixed';
      isFleeing = true;
    }

    btnNao.style.left = newX + fleeMargin / 2 + 'px';
    btnNao.style.top = newY + fleeMargin / 2 + 'px';
  }

  function handlePointerNear(clientX, clientY) {
    if (!btnNao) return;
    var rect = btnNao.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    var distance = Math.hypot(clientX - centerX, clientY - centerY);

    if (distance < fleeRadius) {
      moveButtonAwayFrom(clientX, clientY);
    }
  }

  if (btnNao) {
    // Desktop: o botão foge sempre que o mouse chega perto
    document.addEventListener('mousemove', function (e) {
      handlePointerNear(e.clientX, e.clientY);
    });

    // Reforço extra: se ainda assim o cursor entrar nele, foge na hora
    btnNao.addEventListener('mouseenter', function (e) {
      moveButtonAwayFrom(e.clientX, e.clientY);
    });

    // Celular/touch: foge assim que o dedo encosta, sem registrar o clique
    btnNao.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      moveButtonAwayFrom(touch ? touch.clientX : undefined, touch ? touch.clientY : undefined);
    }, { passive: false });

    // Por garantia, se algum clique escapar, ele também foge em vez de "funcionar"
    btnNao.addEventListener('click', function (e) {
      e.preventDefault();
      moveButtonAwayFrom();
    });
  }

  /* =========================================================
     3) BOTÃO "SIM" + MODAL ROMÂNTICO
  ========================================================= */
  var modalOverlay = document.getElementById('modal-overlay');
  var modalClose = document.getElementById('modal-close');
  var lastFocusedEl = null;

  function openModal() {
    if (!modalOverlay) return;
    lastFocusedEl = document.activeElement;
    modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  }

  if (btnSim) {
    btnSim.addEventListener('click', function () {
      openModal();

      // multiplica a quantidade de corações caindo
      heartChance = 0.8;
      spawnEveryMs = reduceMotion ? 700 : 180;
      maxParticles = 90;
      burstHearts(35);
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay && !modalOverlay.hidden) {
      closeModal();
    }
  });

  /* =========================================================
     4) UM BRINDE A NÓS — contador ao vivo + confete
  ========================================================= */
  // ajuste aqui se a data/hora exata do início do namoro for outra
  var startDate = new Date(2026, 5, 14, 0, 0, 0);

  var counterDays = document.getElementById('counter-days');
  var counterHours = document.getElementById('counter-hours');
  var counterMinutes = document.getElementById('counter-minutes');
  var counterSeconds = document.getElementById('counter-seconds');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateCounter() {
    if (!counterDays) return;
    var diff = Date.now() - startDate.getTime();
    if (diff < 0) diff = 0;

    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var minutes = Math.floor((diff % 3600000) / 60000);
    var seconds = Math.floor((diff % 60000) / 1000);

    counterDays.textContent = days;
    counterHours.textContent = pad(hours);
    counterMinutes.textContent = pad(minutes);
    counterSeconds.textContent = pad(seconds);
  }

  if (counterDays) {
    updateCounter();
    setInterval(updateCounter, 1000);
  }

  var brindeSection = document.getElementById('brinde');
  if (brindeSection && 'IntersectionObserver' in window) {
    var brindeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          burstCelebration(reduceMotion ? 25 : 55);
          brindeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    brindeObserver.observe(brindeSection);
  }
})();
