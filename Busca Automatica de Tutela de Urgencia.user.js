// ==UserScript==
// @name         Busca Automatica de Tutela de Urgencia
// @namespace    http://tampermonkey.net/
// @version      8.6
// @description  Varre a petição inicial em busca de pedido de antecipação de tutela + Cópia rápida de link de documento na árvore + OCR de PDFs digitalizados com cache de cliques
// @author       Allison de Castro Silva
// @match        https://eproc1g.tjmg.jus.br/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
// @updateURL    https://github.com/AllisondeCastro/Pesquisa-automatica-de-tutela-de-urgencia/raw/refs/heads/main/Busca%20Automatica%20de%20Tutela%20de%20Urgencia.user.js
// @downloadURL  https://github.com/AllisondeCastro/Pesquisa-automatica-de-tutela-de-urgencia/raw/refs/heads/main/Busca%20Automatica%20de%20Tutela%20de%20Urgencia.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self) return;

    // ===========================================================================================
    // ESTILOS PREMIUM — Interface do Script (botão, popups, toasts, quick copy)
    // ===========================================================================================
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&family=Nunito:wght@400;500;600;700&display=swap');

        /* ═══════════════════════════════════════════════════════════════════
           ANIMAÇÕES AVANÇADAS
           ═══════════════════════════════════════════════════════════════════ */
        @keyframes tutela-breathe {
            0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 0 0 0 var(--ring-color, rgba(255,255,255,0.06)); }
            50% { box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 0 0 5px var(--ring-color, rgba(255,255,255,0.03)); }
        }
        @keyframes tutela-spin-border {
            0% { --border-angle: 0deg; }
            100% { --border-angle: 360deg; }
        }
        @keyframes tutela-popup-in {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.92) translateY(8px); filter: blur(4px); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes tutela-popup-out {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(1) translateY(0); filter: blur(0); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.96) translateY(-6px); filter: blur(3px); }
        }
        @keyframes tutela-toast-in {
            0% { opacity: 0; transform: translateY(14px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tutela-toast-out {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(10px) scale(0.97); }
        }
        @keyframes tutela-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        @keyframes tutela-icon-pop {
            0% { transform: scale(0.3) rotate(-20deg); opacity: 0; }
            60% { transform: scale(1.15) rotate(3deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes tutela-progress-bar {
            0% { width: 100%; }
            100% { width: 0%; }
        }
        .alerta-pisca {
            animation: tutela-popup-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* @property para animação de borda conic-gradient (browsers modernos) */
        @property --border-angle {
            syntax: '<angle>';
            initial-value: 0deg;
            inherits: false;
        }

        /* ═══════════════════════════════════════════════════════════════════
           BOTÃO FLUTUANTE — Glassmorphism com anel luminoso
           ═══════════════════════════════════════════════════════════════════ */
        #btn-buscar-tutela-pdf {
            position: fixed;
            bottom: 28px;
            right: 28px;
            width: 54px;
            height: 54px;
            border-radius: 16px;
            background:
                linear-gradient(135deg, rgba(180,30,30,0.88), rgba(120,15,15,0.92)) padding-box,
                conic-gradient(from var(--border-angle, 0deg), rgba(255,120,120,0.5), rgba(255,60,60,0.1), rgba(255,120,120,0.5)) border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            cursor: pointer;
            z-index: 9999999;
            border: 2px solid transparent;
            box-shadow:
                0 8px 32px rgba(140,20,20,0.35),
                0 2px 8px rgba(0,0,0,0.2),
                inset 0 1px 0 rgba(255,255,255,0.12);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            user-select: none;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            animation: tutela-spin-border 4s linear infinite, tutela-breathe 3s ease-in-out infinite;
            --ring-color: rgba(255,80,80,0.08);
        }
        #btn-buscar-tutela-pdf:hover {
            transform: scale(1.1) translateY(-3px);
            box-shadow:
                0 12px 40px rgba(140,20,20,0.45),
                0 4px 12px rgba(0,0,0,0.25),
                inset 0 1px 0 rgba(255,255,255,0.18);
            background:
                linear-gradient(135deg, rgba(200,40,40,0.92), rgba(140,20,20,0.95)) padding-box,
                conic-gradient(from var(--border-angle, 0deg), rgba(255,150,150,0.7), rgba(255,80,80,0.15), rgba(255,150,150,0.7)) border-box;
        }
        #btn-buscar-tutela-pdf:active {
            transform: scale(0.94);
            transition-duration: 0.1s;
            box-shadow:
                0 2px 12px rgba(140,20,20,0.4),
                inset 0 2px 6px rgba(0,0,0,0.3);
        }

        /* ═══════════════════════════════════════════════════════════════════
           ESTADOS DO BOTÃO — Identidade visual por estado
           ═══════════════════════════════════════════════════════════════════ */
        .btn-lendo {
            background:
                linear-gradient(135deg, rgba(245,166,35,0.9), rgba(230,81,0,0.93)) padding-box,
                conic-gradient(from var(--border-angle, 0deg), rgba(255,200,100,0.7), rgba(255,165,0,0.1), rgba(255,200,100,0.7)) border-box !important;
            --ring-color: rgba(255,165,0,0.12) !important;
            animation: tutela-spin-border 1.5s linear infinite, tutela-breathe 1s ease-in-out infinite !important;
        }
        .btn-achou {
            background:
                linear-gradient(135deg, rgba(56,142,60,0.9), rgba(27,94,32,0.93)) padding-box,
                conic-gradient(from var(--border-angle, 0deg), rgba(129,199,132,0.6), rgba(76,175,80,0.1), rgba(129,199,132,0.6)) border-box !important;
            --ring-color: rgba(76,175,80,0.1) !important;
            animation: tutela-spin-border 6s linear infinite !important;
        }
        .btn-juris {
            background:
                linear-gradient(135deg, rgba(255,152,0,0.9), rgba(230,81,0,0.93)) padding-box,
                conic-gradient(from var(--border-angle, 0deg), rgba(255,213,79,0.6), rgba(255,152,0,0.1), rgba(255,213,79,0.6)) border-box !important;
            --ring-color: rgba(255,152,0,0.1) !important;
            animation: tutela-spin-border 6s linear infinite !important;
        }

        /* ═══════════════════════════════════════════════════════════════════
           POPUP DE RESULTADO — Acrylic material + borda luminosa
           ═══════════════════════════════════════════════════════════════════ */
        #popup-tutela-resultado {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            padding: 0;
            border-radius: 20px;
            z-index: 99999999;
            font-size: 20px;
            font-weight: 600;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.12);
            pointer-events: none;
            backdrop-filter: blur(40px) saturate(1.8);
            -webkit-backdrop-filter: blur(40px) saturate(1.8);
            animation: tutela-popup-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            letter-spacing: -0.02em;
            line-height: 1.5;
            max-width: 460px;
            min-width: 340px;
            overflow: hidden;
            box-shadow:
                0 24px 80px rgba(0,0,0,0.4),
                0 8px 24px rgba(0,0,0,0.2),
                inset 0 1px 0 rgba(255,255,255,0.1);
        }
        /* Conteúdo interno com padding */
        #popup-tutela-resultado .popup-inner {
            padding: 36px 44px 28px;
            position: relative;
        }
        /* Barra de progresso inferior */
        #popup-tutela-resultado .popup-timer-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: rgba(255,255,255,0.3);
            border-radius: 0 0 20px 20px;
        }

        /* --- Variantes de cor --- */
        #popup-tutela-resultado.popup-success {
            background: linear-gradient(160deg, rgba(21,87,36,0.82), rgba(30,70,32,0.78));
            border-color: rgba(129,199,132,0.25);
            box-shadow:
                0 24px 80px rgba(0,0,0,0.4),
                0 0 60px rgba(46,125,50,0.15),
                inset 0 1px 0 rgba(255,255,255,0.1);
        }
        #popup-tutela-resultado.popup-success .popup-timer-bar {
            background: linear-gradient(90deg, rgba(129,199,132,0.6), rgba(200,230,201,0.3));
            animation: tutela-progress-bar 0.9s linear forwards;
        }
        #popup-tutela-resultado.popup-jurisprudence {
            background: linear-gradient(160deg, rgba(180,95,6,0.82), rgba(150,70,0,0.78));
            border-color: rgba(255,183,77,0.25);
            box-shadow:
                0 24px 80px rgba(0,0,0,0.4),
                0 0 60px rgba(255,152,0,0.12),
                inset 0 1px 0 rgba(255,255,255,0.1);
        }
        #popup-tutela-resultado.popup-jurisprudence .popup-timer-bar {
            background: linear-gradient(90deg, rgba(255,183,77,0.6), rgba(255,224,178,0.3));
            animation: tutela-progress-bar 1.6s linear forwards;
        }
        #popup-tutela-resultado.popup-error {
            background: linear-gradient(160deg, rgba(130,20,20,0.82), rgba(100,15,15,0.78));
            border-color: rgba(239,83,80,0.25);
            box-shadow:
                0 24px 80px rgba(0,0,0,0.4),
                0 0 60px rgba(198,40,40,0.12),
                inset 0 1px 0 rgba(255,255,255,0.1);
        }
        #popup-tutela-resultado.popup-error .popup-timer-bar {
            background: linear-gradient(90deg, rgba(239,83,80,0.6), rgba(255,205,210,0.3));
            animation: tutela-progress-bar 1.6s linear forwards;
        }
        @keyframes tutela-hourglass-spin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.18); }
            100% { transform: rotate(360deg) scale(1); }
        }
        #popup-tutela-resultado.popup-ocr {
            background: linear-gradient(160deg, rgba(80, 50, 10, 0.92), rgba(45, 25, 5, 0.9));
            border-color: rgba(255, 193, 7, 0.45);
            box-shadow:
                0 24px 80px rgba(0,0,0,0.5),
                0 0 60px rgba(255, 193, 7, 0.25),
                inset 0 1px 0 rgba(255,255,255,0.15);
        }
        #popup-tutela-resultado.popup-ocr .popup-icon {
            display: inline-block;
            animation: tutela-hourglass-spin 1.6s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite !important;
            filter: drop-shadow(0 0 10px rgba(255, 200, 0, 0.8));
        }
        #popup-tutela-resultado.popup-ocr .popup-timer-bar {
            display: none;
        }
        #popup-tutela-resultado.popup-fadeout {
            animation: tutela-popup-out 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        /* --- Elementos internos --- */
        #popup-tutela-resultado .popup-icon {
            font-size: 42px;
            display: block;
            margin-bottom: 16px;
            animation: tutela-icon-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            animation-delay: 0.15s;
            filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
        }
        #popup-tutela-resultado .popup-title {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin-bottom: 12px;
            display: block;
            opacity: 0.7;
        }
        #popup-tutela-resultado .popup-detail {
            font-size: 16px;
            font-weight: 500;
            opacity: 0.95;
            display: block;
            margin-top: 4px;
            line-height: 1.6;
        }
        #popup-tutela-resultado .popup-detail b {
            font-weight: 700;
            color: #fff;
            background: rgba(255,255,255,0.08);
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 15px;
        }
        #popup-tutela-resultado .popup-page {
            font-size: 14px;
            font-weight: 600;
            opacity: 0.85;
            display: block;
            margin-top: 16px;
            padding-top: 14px;
            border-top: 1px solid rgba(255,255,255,0.1);
            letter-spacing: 0.02em;
        }

        /* ═══════════════════════════════════════════════════════════════════
           BOTÃO QUICK COPY (Árvore de Documentos)
           ═══════════════════════════════════════════════════════════════════ */
        .eproc-quick-copy {
            display: inline-flex; /* Botão persistentemente visível */
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            border-radius: 3px;
            cursor: pointer;
            margin-left: 2px;
            margin-right: 1px;
            vertical-align: middle;
            background: transparent;
            border: none;
            transition: opacity 0.15s ease, background 0.15s ease;
            opacity: 0.45;
        }
        .eproc-quick-copy:hover {
            opacity: 1;
            background: rgba(0, 129, 194, 0.1);
        }
        .eproc-quick-copy:active {
            opacity: 0.7;
        }
        .eproc-quick-copy svg {
            width: 12px;
            height: 12px;
            fill: #0081c2;
            pointer-events: none;
        }
        .eproc-quick-copy.copied {
            opacity: 1 !important;
        }
        .eproc-quick-copy.copied svg {
            fill: #16a34a !important;
        }

        /* ═══════════════════════════════════════════════════════════════════
           TOAST — Acrylic material design (canto superior esquerdo)
           ═══════════════════════════════════════════════════════════════════ */
        #eproc-tutela-toast {
            position: fixed;
            top: 20px;
            left: 20px;
            transform: translateY(14px);
            background: linear-gradient(135deg, rgba(22,33,18,0.72), rgba(30,48,24,0.68));
            color: #ecfdf5;
            padding: 13px 22px;
            border-radius: 50px;
            border: 1px solid rgba(110,231,183,0.2);
            box-shadow:
                0 4px 24px rgba(0,0,0,0.25),
                0 0 40px rgba(16,185,129,0.08),
                inset 0 1px 0 rgba(255,255,255,0.1);
            font-size: 13px;
            font-weight: 500;
            font-family: 'Nunito', 'Quicksand', 'Segoe UI', -apple-system, sans-serif;
            letter-spacing: 0.02em;
            z-index: 999999;
            opacity: 0;
            pointer-events: none;
            display: flex;
            align-items: center;
            gap: 10px;
            backdrop-filter: blur(20px) saturate(1.8);
            -webkit-backdrop-filter: blur(20px) saturate(1.8);
            transition: none;
        }
        #eproc-tutela-toast.toast-show {
            animation: tutela-toast-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        #eproc-tutela-toast.toast-hide {
            animation: tutela-toast-out 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        #eproc-tutela-toast svg {
            width: 18px;
            height: 18px;
            fill: #6ee7b7;
            flex-shrink: 0;
            filter: drop-shadow(0 0 6px rgba(110,231,183,0.5));
        }
    `;
    document.head.appendChild(style);

    // ===========================================================================================
    // TOAST GLOBAL
    // ===========================================================================================
    const toast = document.createElement('div');
    toast.id = 'eproc-tutela-toast';
    toast.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        <span>Link copiado!</span>
    `;
    document.body.appendChild(toast);

    let toastTimer = null;
    function showToast(msg) {
        toast.querySelector('span').textContent = msg || 'Link copiado!';
        toast.classList.remove('toast-hide');
        toast.style.opacity = '1';
        toast.classList.add('toast-show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('toast-show');
            toast.classList.add('toast-hide');
            setTimeout(() => { toast.style.opacity = '0'; toast.classList.remove('toast-hide'); }, 300);
        }, 1000);
    }

    // ===========================================================================================
    // CONFIGURAÇÃO DO PDF.JS
    // ===========================================================================================
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }

    // ===========================================================================================
    // PALAVRAS-CHAVE PARA BUSCA DE TUTELA
    // ===========================================================================================
    const keywords =[
        "antecipacao de tutela", "antecipacao da tutela", "tutela antecipada",
        "inaudita altera pars", "altera pars", "pedido liminar", "liminar",
        "liminares", "antecipacao dos efeitos", "tutela de urgencia", "tutela provisoria", "art. 300", "artigo 300"
    ];

    const positiveWords =[
        "requer", "requerimento", "pedido", "pleiteia", "postula",
        "concessao", "conceder", "deferimento", "deferir",
        "expedicao", "diante do exposto", "ex positis", "nestes termos", "pede deferimento",
        "liminarmente", "periculum in mora", "fumus boni iuris", "probabilidade do direito",
        "perigo de dano", "risco ao resultado util", "tutela pretendida"
    ];

    const negativeWords =[
        "ementa", "acordao", "relator", "relatora", "recurso provido", "recurso desprovido",
        "recurso nao provido", "deram provimento", "negaram provimento",
        "nega se provimento", "negou se provimento", "dado provimento",
        "turma civel", "camara civel", "turma criminal", "camara criminal",
        "turma recursal", "julgado em", "data de julgamento", "data da publicacao",
        "diario da justica", "dje", "unanimidade", "votacao unanime",
        "jurisprudencia", "precedente", "sumula",
        "decisao mantida", "sentenca mantida", "recurso conhecido", "recurso nao conhecido"
    ];

    let pdfButtonShown = false;
    let currentPdfData = null;
    let pdfButtonNode = null;
    let lastFoundCursor = null; // { page, charIndex } — cursor para busca sequencial

    // ── Estado AJG: verificado uma única vez por PDF carregado ──
    let ajgJaVerificado = false;  // true após a 1ª busca de tutela
    let ajgEncontrado = null;     // null = não verificado | true = tem AJG | false = sem AJG

    // ── Cache de OCR por PDF carregado (para navegação rápida em cliques repetidos) ──
    let ocrCacheData = null;      // { totalChars, ajgEncontrado, tutelaMatch, pages }
    let ocrEmAndamento = null;    // Promessa de OCR em execução para evitar chamadas duplicadas

    // ===========================================================================================
    // DETECÇÃO DE PDF
    // ===========================================================================================
    function findPdf(doc) {
        if (!doc) return null;
        let embeds = doc.querySelectorAll('embed[type="application/pdf"], object[type="application/pdf"]');
        if (embeds.length > 0) return { element: embeds[0], url: embeds[0].src || embeds[0].data };

        let frames = doc.querySelectorAll('iframe, frame');
        for (let f of frames) {
            let src = f.src || '';
            if (src.includes('acao=arvore_documento_listar')) continue;

            if (src.includes('acao=documento_download_documento') ||
                src.includes('acao=arvore_documento_download') ||
                src.includes('acao=documento_visualizar')) {
                return { element: f, url: src };
            }

            try {
                let innerDoc = f.contentDocument || f.contentWindow.document;
                if (innerDoc) {
                    if (innerDoc.contentType === 'application/pdf') return { element: f, url: src };
                    let innerResult = findPdf(innerDoc);
                    if (innerResult) return innerResult;
                }
            } catch(e) {}
        }
        return null;
    }

    // ===========================================================================================
    // MATCHER TOLERANTE — ignora espaçamento entre letras (ex.: "t u t e l a") e pequenas
    // corrupções de acentuação/OCR (ex.: "urgÍncia" no lugar de "urgência")
    // ===========================================================================================
    const cacheTokens = new Map();
    function tokensDe(padrao) {
        if (cacheTokens.has(padrao)) return cacheTokens.get(padrao);
        const t = padrao.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const toks = [];
        for (const ch of t) {
            if (/[a-z0-9]/.test(ch)) toks.push({ tipo: 'ch', ch, risco: /[aeiou]/.test(ch) || ch === 'c' });
            else toks.push({ tipo: 'sep' });
        }
        cacheTokens.set(padrao, toks);
        return toks;
    }
    function limiteDe(toks) { return toks.length <= 10 ? 1 : 2; }
    function ehAlnum(c) { return c !== undefined && /[a-z0-9]/.test(c); }

    function casaEm(texto, ini, toks, limite) {
        function rec(ti, hi, usados) {
            if (ti >= toks.length) return { fim: hi, usados: usados };
            if (usados > limite) return null;
            const tok = toks[ti];
            if (tok.tipo === 'ch') {
                let p = hi;
                while (p < texto.length && (texto[p] === ' ' || texto[p] === '\t')) p++;
                if (p >= texto.length) return null;
                const h = texto[p];
                if (h === tok.ch) {
                    const r = rec(ti + 1, p + 1, usados);
                    if (r) return r;
                }
                if (tok.risco) {
                    if (h !== ' ' && h !== '\t') {
                        const r = rec(ti + 1, p + 1, usados + 1);
                        if (r) return r;
                    }
                    const r2 = rec(ti + 1, p, usados + 1);
                    if (r2) return r2;
                }
                return null;
            } else {
                let q = hi;
                while (q < texto.length && !/[a-z0-9]/.test(texto[q])) q++;
                const r = rec(ti + 1, q, usados);
                if (r) return r;
                if (q > hi) {
                    const r2 = rec(ti + 1, hi, usados);
                    if (r2) return r2;
                }
                return null;
            }
        }
        return rec(0, ini, 0);
    }

    // Retorna as ocorrências do termo a partir de `desde`. `limiteOverride` (null = automático)
    // controla a quantidade de edições permitidas: 0 = apenas espaçamento entre letras.
    function buscarTolerante(texto, padrao, desde, maxMatches, limiteOverride) {
        const toks = tokensDe(padrao);
        if (!toks.length) return [];
        const limite = (limiteOverride === undefined || limiteOverride === null) ? limiteDe(toks) : limiteOverride;
        const out = [];
        let i = Math.max(0, desde | 0);
        while (i < texto.length && out.length < maxMatches) {
            if (texto[i] === ' ' || texto[i] === '\t') { i++; continue; }
            const inicioValido = !ehAlnum(texto[i - 1]);
            if (inicioValido && (texto[i] === toks[0].ch || toks[0].risco)) {
                const m = casaEm(texto, i, toks, limite);
                if (m && !ehAlnum(texto[m.fim])) {
                    out.push({ index: i, fim: m.fim, edits: m.usados });
                    i = Math.max(m.fim, i + 1);
                    continue;
                }
            }
            i++;
        }
        return out;
    }

    function existeTolerante(texto, padrao, limite) {
        return buscarTolerante(texto, padrao, 0, 1, (limite === undefined ? null : limite)).length > 0;
    }

    /**
     * Obter a instância do Tesseract.js (pré-carregada via @require ou dinâmica).
     */
    async function obterTesseract() {
        if (typeof Tesseract !== 'undefined') return Tesseract;
        if (typeof window !== 'undefined' && window.Tesseract) return window.Tesseract;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            script.onload = () => resolve(window.Tesseract);
            script.onerror = () => reject(new Error('Falha ao carregar Tesseract.js'));
            document.head.appendChild(script);
        });
    }

    function fecharPopupResultado() {
        let existing = document.getElementById('popup-tutela-resultado');
        if (existing) {
            existing.classList.add('popup-fadeout');
            setTimeout(() => { if (existing.parentNode) existing.remove(); }, 300);
        }
    }

    /**
     * Executa OCR via Tesseract.js nas páginas do PDF (renderizando offscreen canvas).
     * O resultado é MEMORIZADO em `ocrCacheData` para que cliques repetidos pesquisem instantaneamente!
     */
    async function executarOCRnoPDF(pdf) {
        if (ocrCacheData) return ocrCacheData;
        if (ocrEmAndamento) return await ocrEmAndamento;

        ocrEmAndamento = (async () => {
            try {
                // Exibe notificação clean e objetiva com ampulheta animada
                showPopup(
                    '⏳',
                    'Reconhecendo Texto (OCR)',
                    'Documento digitalizado.<br><b>Aguarde a leitura em imagem...</b>',
                    null,
                    'ocr'
                );

                const tess = await obterTesseract();
                if (!tess) {
                    fecharPopupResultado();
                    return { totalChars: 0, ajgEncontrado: false, tutelaMatch: null, pages: [] };
                }

                const worker = await tess.createWorker('por');

                let ajgEncontrado = false;
                let tutelaMatch = null;
                let totalChars = 0;
                const pagesCache = [];

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.2 });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d');

                    await page.render({ canvasContext: ctx, viewport }).promise;

                    const { data: { text } } = await worker.recognize(canvas);
                    const rawText = text || '';
                    const textNorm = rawText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    totalChars += textNorm.length;

                    pagesCache.push({
                        pageNum: pageNum,
                        rawText: rawText,
                        textNorm: textNorm
                    });

                    // Verificar AJG (busca com limites de palavra para evitar falsos positivos)
                    if (!ajgEncontrado) {
                        for (const termo of ajgTermos) {
                            for (const m of buscarTolerante(textNorm, termo, 0, 5)) {
                                if (matchAJGfalsoPositivo(textNorm, termo, m)) continue;
                                ajgEncontrado = true;
                                break;
                            }
                            if (ajgEncontrado) break;
                        }
                    }

                    // Verificar Tutela de Urgência (busca com limites de palavra:
                    // evita, p. ex., "liminar" casar dentro de "preliminar")
                    if (!tutelaMatch) {
                        for (const kw of keywords) {
                            if (buscarTolerante(textNorm, kw, 0, 1).length > 0) {
                                tutelaMatch = { match: kw, page: pageNum, score: 10, charIndex: 0 };
                                break;
                            }
                        }
                    }
                }

                await worker.terminate();

                ocrCacheData = {
                    totalChars: totalChars,
                    ajgEncontrado: ajgEncontrado,
                    tutelaMatch: tutelaMatch,
                    pages: pagesCache
                };

                fecharPopupResultado();
                return ocrCacheData;
            } catch(e) {
                console.error("Erro ao executar OCR no PDF:", e);
                fecharPopupResultado();
                return { totalChars: 0, ajgEncontrado: false, tutelaMatch: null, pages: [] };
            } finally {
                ocrEmAndamento = null;
            }
        })();

        return await ocrEmAndamento;
    }

    // Conta apenas hífens que não estão entre letras (números/citações), ignorando
    // hífens de palavra ("confirmando-se"), que poluem a pontuação.
    function hifensRelevantes(context) {
        let n = 0;
        for (let i = 0; i < context.length; i++) {
            if (context[i] !== '-') continue;
            const antes = context[i - 1], depois = context[i + 1];
            const letraAntes = antes !== undefined && /\p{L}/u.test(antes);
            const letraDepois = depois !== undefined && /\p{L}/u.test(depois);
            if (!(letraAntes && letraDepois)) n++;
        }
        return n;
    }

    // ===========================================================================================
    // ANÁLISE DE SCORE
    // ===========================================================================================
    function calculateScore(context) {
        let score = 0;
        if (hifensRelevantes(context) >= 4) score -= 15;

        let cleanContext = context.replace(/[-_.,;()""''[\]{}]/g, " ").replace(/\s+/g, " ");

        // Palavras positivas: tolerância total (capturam texto com acento corrompido)
        positiveWords.forEach(word => {
            if (existeTolerante(cleanContext, word)) score += 10;
        });

        // Palavras negativas (guardas de jurisprudência): apenas espaçamento entre letras,
        // sem substituições — evita falsos acertos como "ementa" casando com "mente"
        negativeWords.forEach(word => {
            if (existeTolerante(cleanContext, word, 0)) score -= 20;
        });

        return score;
    }

    // ===========================================================================================
    // BUSCA NO PDF (com suporte a cursor para busca sequencial)
    // ===========================================================================================
    async function searchPDF(url, cursor) {
        if (typeof pdfjsLib === 'undefined') return { error: 'Biblioteca de PDF não carregou.' };

        try {
            // Limpar hash da URL para PDF.js carregar corretamente
            const cleanUrl = url.split('#')[0];
            const loadingTask = pdfjsLib.getDocument({ url: cleanUrl, withCredentials: true });
            const pdf = await loadingTask.promise;
            const maxPages = pdf.numPages;

            const startPage = cursor ? cursor.page : 1;
            const startCharAfter = cursor ? cursor.charIndex : -1;

            let totalTextItems = 0;
            let totalTextChars = 0;

            // Função que analisa uma página e retorna matches válidos
            async function analyzePage(pageNum, skipBefore) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                let searchableText = "";
                let originalText = "";
                let textNodes =[];

                textContent.items.forEach(item => {
                    if (!item.str.trim()) return;
                    totalTextItems++;
                    let normalizedStr = item.str.replace(/\s+/g, ' ') + " ";
                    let startIdx = searchableText.length;
                    let cleanStr = normalizedStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    searchableText += cleanStr;
                    originalText += normalizedStr;
                    textNodes.push({
                        start: startIdx, end: searchableText.length,
                        size: Math.abs(item.transform[3] || item.height || 0),
                        x: item.transform[4] || 0,
                        y: item.transform[5] || 0
                    });
                });

                totalTextChars += searchableText.length;

                let sizeCounts = {}, xCounts = {};
                textNodes.forEach(n => {
                    let s = Math.round(n.size);
                    if (s > 0) sizeCounts[s] = (sizeCounts[s] || 0) + (n.end - n.start);
                    let x = Math.round(n.x / 10) * 10;
                    if (x > 0) xCounts[x] = (xCounts[x] || 0) + (n.end - n.start);
                });

                let mainFontSize = 12;
                if (Object.keys(sizeCounts).length > 0)
                    mainFontSize = parseInt(Object.keys(sizeCounts).reduce((a, b) => sizeCounts[a] > sizeCounts[b] ? a : b));
                let mainXPos = 0;
                if (Object.keys(xCounts).length > 0)
                    mainXPos = parseInt(Object.keys(xCounts).reduce((a, b) => xCounts[a] > xCounts[b] ? a : b));

                // X mínimo de cada linha (por y arredondado): só texto que INICIA a linha
                // é candidato à penalidade de margem — texto no meio da linha é prosa comum.
                let lineMin = {};
                textNodes.forEach(n => {
                    let y = Math.round(n.y);
                    if (lineMin[y] === undefined || n.x < lineMin[y]) lineMin[y] = n.x;
                });

                // Busca tolerante de todas as keywords, ordenada por posição e sem sobreposição
                let found = [];
                keywords.forEach(kw => {
                    buscarTolerante(searchableText, kw, Math.max(0, skipBefore + 1), 60)
                        .forEach(m => found.push({ index: m.index, fim: m.fim, kw: kw }));
                });
                found.sort((a, b) => (a.index - b.index) || ((b.fim - b.index) - (a.fim - a.index)));

                let bestMatch = null;
                let lastFim = -1;

                for (const match of found) {
                    // Ignora ocorrência que se sobrepõe à última aceita
                    // (ex.: "liminar" dentro de "pedido liminar" — mesma passagem do texto)
                    if (match.index < lastFim) continue;

                    let startIndex = Math.max(0, match.index - 300);
                    let endIndex = Math.min(searchableText.length, match.fim + 300);
                    let context = searchableText.substring(startIndex, endIndex);
                    let score = calculateScore(context);

                    let exactMatch = originalText.substring(match.index, match.fim);
                    if (exactMatch === exactMatch.toUpperCase() && exactMatch.length > 5) score += 15;

                    let matchedNode = textNodes.find(n => match.index >= n.start && match.index < n.end);
                    if (matchedNode) {
                        if (matchedNode.size < mainFontSize * 0.85) score -= 40;
                        const minX = lineMin[Math.round(matchedNode.y)];
                        const iniciaLinha = (minX === undefined) || (matchedNode.x <= minX + 2);
                        if (iniciaLinha && matchedNode.x > mainXPos + 80) score -= 30;
                    }

                    lastFim = match.fim;

                    // Na busca sequencial, pegar o PRIMEIRO match válido (score >= 0)
                    if (score >= 0) {
                        // charIndex = fim da ocorrência: a próxima busca parte dali (evita repetir)
                        return { match: exactMatch, page: pageNum, score: score, charIndex: Math.max(0, match.fim - 1) };
                    }

                    // Guardar o melhor match negativo como fallback
                    if (!bestMatch || score > bestMatch.score) {
                        bestMatch = { match: exactMatch, page: pageNum, score: score, charIndex: Math.max(0, match.fim - 1) };
                    }
                }
                return bestMatch; // pode ser null se não houver match nesta página
            }

            // FASE 1: Buscar a partir da posição do cursor até o final do documento
            let bestOverall = null;
            for (let i = 0; i < maxPages; i++) {
                let pageNum = ((startPage - 1 + i) % maxPages) + 1;
                let skipBefore = (i === 0 && cursor) ? startCharAfter : -1;

                let result = await analyzePage(pageNum, skipBefore);
                if (result && result.score >= 0) {
                    return result; // Match positivo encontrado — retornar imediatamente
                }
                if (result && (!bestOverall || result.score > bestOverall.score)) {
                    bestOverall = result;
                }

                // Se completou o wrap-around e voltou à página antes do cursor
                if (cursor && pageNum === startPage && i > 0) break;
            }

            // Se nenhuma página extraiu texto pesquisável (PDF contendo apenas imagens ou digitalizado),
            // executa o OCR via Tesseract.js diretamente sobre o canvas renderizado da página.
            if (totalTextItems === 0 || totalTextChars < 30) {
                const resOCR = await executarOCRnoPDF(pdf);
                if (resOCR && resOCR.tutelaMatch) {
                    return resOCR.tutelaMatch;
                }
                // Se o OCR foi executado com sucesso e reconheceu caracteres (totalChars >= 30),
                // significa que o documento FOI LIDO com sucesso, e a ausência de match indica apenas "Não Encontrado".
                if (resOCR && resOCR.totalChars >= 30) {
                    return { notFound: true, viaOCR: true };
                }
                return { isUnreadable: true };
            }

            if (bestOverall) {
                if (bestOverall.score < 0) {
                    return { isJurisprudence: true, page: bestOverall.page, match: bestOverall.match, charIndex: bestOverall.charIndex };
                }
                return bestOverall;
            }
            return { notFound: true };
        } catch (error) {
            return { error: 'Documento protegido contra leitura.' };
        }
    }

    // ===========================================================================================
    // POPUP DE RESULTADO (VISUAL PREMIUM)
    // ===========================================================================================
    function showPopup(icon, title, detail, pageInfo, type) {
        let existing = document.getElementById('popup-tutela-resultado');
        if (existing) existing.remove();

        let popup = document.createElement('div');
        popup.id = 'popup-tutela-resultado';
        popup.className = `popup-${type}`;

        popup.innerHTML = `
            <div class="popup-inner">
                <span class="popup-icon">${icon}</span>
                <span class="popup-title">${title}</span>
                <span class="popup-detail">${detail}</span>
                ${pageInfo ? `<span class="popup-page">${pageInfo}</span>` : ''}
            </div>
            <div class="popup-timer-bar"></div>
        `;

        document.body.appendChild(popup);

        if (type !== 'ocr') {
            let timeout = (type === 'success') ? 1800 : 3200; // Metade do tempo de exibição (1.8s / 3.2s)
            setTimeout(() => {
                popup.classList.add('popup-fadeout');
                setTimeout(() => { if (popup.parentNode) popup.remove(); }, 300);
            }, timeout);
        }
    }

    // ===========================================================================================
    // MÓDULO AJG — VERIFICAÇÃO DE PEDIDO DE ASSISTÊNCIA JUDICIÁRIA GRATUITA
    // (Independente da busca de tutela — roda uma vez, varre o PDF inteiro)
    // ===========================================================================================

    // Termos aceitos para busca de AJG (exclusivamente no arquivo PDF)
    const ajgTermos = [
        "assistencia judiciaria gratuita",
        "assistencia juridica gratuita",
        "assistencia judicial gratuita",
        "assistencia judiciaria",
        "assistencia juridica",
        "assistencia judicial",
        "justica gratuita",
        "gratuidade da justica",
        "gratuidade de justica",
        "gratuidade judicial",
        "gratuidade judiciaria",
        "beneficio da gratuidade",
        "beneficio da assistencia",
        "ajg",
        "hipossuficiencia",
        "hipossuficiente",
        "miserabilidade",
        "comprovante de renda",
        "comprovante de rendimentos",
        "declaracao de hipossuficiencia",
        "declaracao de pobreza",
        "isencao de custas",
        "dispensa de custas",
        "sem prejuizo de seu sustento",
        "sem prejuizo do sustento de sua familia",
        "sem prejuizo de seu sustento e de sua familia"
    ];

    /**
     * Retorna o trecho contínuo de caracteres alfanuméricos a partir de `ini`
     * (ignora espaços, pontuação e quebras), útil para inspecionar texto pós-match.
     */
    function trechoAlnum(texto, ini, maxLen) {
        let out = '';
        for (let i = Math.max(0, ini); i < texto.length && out.length < maxLen; i++) {
            const c = texto[i];
            if (/[a-z0-9]/.test(c)) out += c;
        }
        return out;
    }

    /**
     * Descarta falsos positivos de AJG no arquivo, como "hipossuficiência técnica" /
     * "hipossuficiente a parte", termos de inversão do ônus da prova (CDC) que NÃO
     * representam pedido de gratuidade judiciária.
     */
    function matchAJGfalsoPositivo(texto, termo, match) {
        if (!termo.startsWith('hipossuficien')) return false;
        const continuacao = trechoAlnum(texto, match.fim, 12);
        if (continuacao.startsWith('tecnica') || continuacao.startsWith('tecnico')) return true;
        const janela = trechoAlnum(texto, match.index - 160, 380);
        return janela.includes('onusdaprova') ||
               janela.includes('inversaodoonus') ||
               janela.includes('opejudicis') ||
               janela.includes('inversaodepjudicis');
    }

    /**
     * Realiza a verificação de AJG exclusivamente no arquivo PDF:
     * 1) Varre as páginas do PDF via PDF.js com busca tolerante (ignora espaçamento entre letras).
     * 2) Descarta falsos positivos como "hipossuficiência técnica" (inversão do ônus da prova).
     * 3) Em caso de PDF digitalizado sem camada de texto, executa OCR via Tesseract.js.
     */
    async function verificarAJGnoPDF(url) {
        // Sem acesso à biblioteca de PDF: não é possível analisar o arquivo, evita falso alarme.
        if (typeof pdfjsLib === 'undefined') return true;
        try {
            const cleanUrl = url.split('#')[0];
            const loadingTask = pdfjsLib.getDocument({ url: cleanUrl, withCredentials: true });
            const pdf = await loadingTask.promise;

            let totalTextItems = 0;
            let totalTextCharCount = 0;

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const itens = textContent.items.filter(item => item.str && item.str.trim());

                totalTextItems += itens.length;

                // Texto com espaços preservados e normalizado. A busca tolerante ignora
                // espaçamento entre letras (ex.: "j u s t i ç a") e corrupções de acentuação,
                // mantendo os limites de palavra (evita casar "ajg" dentro de lixo binário).
                const pageTextEspacos = itens
                    .map(item => item.str.replace(/\s+/g, ' ') + ' ')
                    .join('')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase();

                totalTextCharCount += pageTextEspacos.replace(/[^a-z0-9]/g, '').length;

                for (const termo of ajgTermos) {
                    for (const m of buscarTolerante(pageTextEspacos, termo, 0, 5)) {
                        if (matchAJGfalsoPositivo(pageTextEspacos, termo, m)) continue;
                        return true; // AJG encontrado no arquivo
                    }
                }
            }

            // Fallback para PDFs digitalizados (sem camada de texto): executa OCR via Tesseract.js nas páginas do PDF
            if (totalTextItems === 0 || totalTextCharCount < 30) {
                const resOCR = await executarOCRnoPDF(pdf);
                if (resOCR && resOCR.ajgEncontrado) return true;
                // OCR leu o documento com sucesso (totalChars >= 30) e não achou AJG: reporta ausência
                if (resOCR && resOCR.totalChars >= 30) return false;
                return true; // Não foi possível ler o documento — evita falso alarme
            }

            return false; // Nenhuma página do arquivo possui termo de AJG
        } catch(e) {
            return true; // Erro silencioso — não alarma
        }
    }

    /**
     * Exibe o banner de resultado:
     *   - Apenas banner laranja (AJG)
     * O banner AJG fica fixo até o usuário fechar manualmente ou expirar o tempo (1.9s).
     */
    function exibirBannersAJG() {
        // Remove container anterior se já existir
        const anterior = document.getElementById('tm-ajg-banners');
        if (anterior) anterior.remove();

        // Keyframes (injetados apenas uma vez no documento)
        if (!document.getElementById('tm-ajg-keyframes')) {
            const st = document.createElement('style');
            st.id = 'tm-ajg-keyframes';
            st.textContent = [
                '@keyframes tmAjgPulse{',
                '0%,100%{box-shadow:0 8px 30px rgba(0,0,0,.4),0 0 0 0 rgba(255,120,0,.55)}',
                '50%{box-shadow:0 8px 30px rgba(0,0,0,.4),0 0 0 10px rgba(255,120,0,0)}',
                '}',
                '@keyframes tmAjgShake{',
                '0%,100%{transform:rotate(0)}',
                '15%{transform:rotate(-12deg)}',
                '30%{transform:rotate(12deg)}',
                '45%{transform:rotate(-7deg)}',
                '60%{transform:rotate(7deg)}',
                '75%{transform:rotate(-3deg)}',
                '}',
                '@keyframes tmAjgIn{',
                '0%{opacity:0;transform:translateX(-50%) translateY(-28px)}',
                '100%{opacity:1;transform:translateX(-50%) translateY(0)}',
                '}',
                '@keyframes tmAjgOut{',
                '0%{opacity:1;transform:translateX(-50%) translateY(0)}',
                '100%{opacity:0;transform:translateX(-50%) translateY(-100px)}',
                '}'
            ].join('');
            document.head.appendChild(st);
        }

        // Wrapper centralizado no topo (flex horizontal)
        const wrap = document.createElement('div');
        wrap.id = 'tm-ajg-banners';
        wrap.style.cssText = [
            'position:fixed','top:18px','left:50%',
            'transform:translateX(-50%)',
            'display:flex','gap:10px','align-items:flex-start',
            'z-index:99999999',
            'animation:tmAjgIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
            'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'
        ].join(';');

        // ── Banner laranja (AJG ausente) ──
        const bA = document.createElement('div');
        bA.id = 'tm-banner-ajg';
        bA.style.cssText = [
            'background:linear-gradient(135deg,rgba(220,75,0,.97),rgba(165,42,0,.98))',
            'border:2.5px solid rgba(255,190,60,.75)',
            'border-radius:14px','padding:14px 20px',
            'min-width:260px','max-width:360px',
            'box-shadow:0 8px 30px rgba(0,0,0,.4),0 0 40px rgba(220,80,0,.35)',
            'backdrop-filter:blur(12px)','-webkit-backdrop-filter:blur(12px)',
            'color:#fff','animation:tmAjgPulse 1.6s ease-in-out infinite'
        ].join(';');
        bA.innerHTML = [
            '<div style="display:flex;align-items:center;gap:12px;">',
            '<span style="font-size:26px;flex-shrink:0;animation:tmAjgShake 2.2s ease-in-out infinite;',
            'filter:drop-shadow(0 0 6px rgba(255,200,0,.6))">⚠️</span>',
            '<div style="flex:1;">',
            '<div style="font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;',
            'color:rgba(255,210,100,.9);margin-bottom:3px;">Atenção — Verificação AJG</div>',
            '<div style="font-size:14px;font-weight:800;color:#FFE066;letter-spacing:-.01em;">',
            'SEM pedido de Justiça Gratuita</div>',
            '<div style="font-size:11px;font-weight:500;color:rgba(255,225,190,.85);margin-top:4px;line-height:1.4;">',
            'Nenhum termo de AJG localizado<br>neste documento.</div>',
            '</div>',
            '<button id="tm-fechar-ajg" title="Fechar" style="background:transparent;border:none;',
            'color:rgba(255,255,255,.45);font-size:20px;cursor:pointer;padding:0 2px;',
            'line-height:1;flex-shrink:0;">✕</button>',
            '</div>'
        ].join('');
        wrap.appendChild(bA);

        document.body.appendChild(wrap);

        // Função para fechar com animação de saída suave
        function fecharBanner() {
            if (!wrap.parentNode) return;
            wrap.style.animation = 'tmAjgOut 0.45s cubic-bezier(0.16,1,0.3,1) forwards';
            setTimeout(() => { if (wrap.parentNode) wrap.remove(); }, 450);
        }

        // Fechar ao clicar no X
        document.getElementById('tm-fechar-ajg').addEventListener('click', function(e) {
            e.stopPropagation();
            fecharBanner();
        });

        // Fechar automaticamente após 1.9s (metade do tempo)
        setTimeout(fecharBanner, 1900);
    }

    // ===========================================================================================
    // BOTÃO FLUTUANTE DE BUSCA
    // ===========================================================================================
    function createBottomRightButton() {
        let btn = document.createElement('div');
        btn.id = 'btn-buscar-tutela-pdf';
        btn.innerHTML = '⚠️';
        btn.title = 'Buscar Tutela (PDF)';

        btn.onclick = async function() {
            if (btn.classList.contains('btn-lendo')) return;

            btn.classList.add('btn-lendo');
            btn.classList.remove('btn-achou', 'btn-juris');
            btn.innerHTML = '⏳';

            // Verificar se é uma busca sequencial (já tem resultado anterior)
            let isSequential = lastFoundCursor !== null;

            // ── VERIFICAÇÃO AJG — roda apenas na PRIMEIRA busca de cada PDF ──
            // Executa em paralelo com a busca de tutela para não atrasar a UX
            let ajgPromise = null;
            if (!ajgJaVerificado) {
                ajgJaVerificado = true;
                ajgPromise = verificarAJGnoPDF(currentPdfData.url);
            }
            // ────────────────────────────────────────────────────────────────

            // Usar cursor se existe resultado anterior (busca sequencial)
            let result = await searchPDF(currentPdfData.url, lastFoundCursor);

            // ── Aguardar resultado AJG (se foi disparado) e decidir exibição ──
            let ajgAusenteNestaAcao = false;
            if (ajgPromise !== null) {
                ajgEncontrado = await ajgPromise;
                if (!ajgEncontrado) ajgAusenteNestaAcao = true;
            }
            // ────────────────────────────────────────────────────────────────

            if (result && result.match && !result.isJurisprudence) {
                let msgTitulo = isSequential ? 'Próxima Ocorrência!' : 'Encontrado!';
                showPopup(
                    '✅',
                    msgTitulo,
                    `Expressão: <b>"${result.match}"</b>`,
                    `Localizada na <b>PÁGINA ${result.page}</b>`,
                    'success'
                );

                btn.classList.remove('btn-lendo');
                btn.classList.add('btn-achou');
                btn.innerHTML = '✅';
                btn.title = `Tutela encontrada na pág. ${result.page} (clique para próxima)`;

                // Salvar cursor para busca sequencial - página seguinte ao resultado atual
                lastFoundCursor = { page: result.page, charIndex: (result.charIndex || 0) + 1 };

                // Se AJG ausente nesta primeira busca: exibir banner laranja
                if (ajgAusenteNestaAcao) exibirBannersAJG();

                if (currentPdfData.element) {
                    let baseUrl = currentPdfData.url.split('#')[0];
                    baseUrl = baseUrl.replace(/([&?])_v=\d+/, '$1').replace(/[&?]$/, '');
                    let separator = baseUrl.includes('?') ? '&' : '?';
                    let noCacheUrl = `${baseUrl}${separator}_v=${new Date().getTime()}`;

                    let wordsArray = result.match.trim().split(/\s+/);
                    let longestWord = wordsArray.reduce((a, b) => a.length > b.length ? a : b);
                    let searchTerm = encodeURIComponent(longestWord);

                    let targetUrl = `${noCacheUrl}#page=${result.page}&search=${searchTerm}`;
                    let el = currentPdfData.element;
                    let parent = el.parentNode;

                    if (parent) {
                        let newEl = document.createElement(el.tagName);
                        for (let i = 0; i < el.attributes.length; i++) {
                            let attr = el.attributes[i];
                            if (attr.name.toLowerCase() !== 'src' && attr.name.toLowerCase() !== 'data') {
                                newEl.setAttribute(attr.name, attr.value);
                            }
                        }

                        if (newEl.tagName === 'OBJECT') {
                            newEl.setAttribute('data', targetUrl);
                        } else {
                            newEl.setAttribute('src', targetUrl);
                        }

                        parent.replaceChild(newEl, el);
                        currentPdfData.element = newEl;
                        currentPdfData.url = targetUrl;

                        setTimeout(() => {
                            if (newEl.tagName === 'IFRAME') newEl.contentWindow?.focus();
                        }, 500);
                    }
                }

            } else if (result && result.isUnreadable) {
                showPopup(
                    '📷',
                    'Documento Digitalizado',
                    'O arquivo contém apenas <b>imagem</b> ou <b>caracteres não legíveis</b>.',
                    'Não é possível realizar busca de texto neste PDF.',
                    'jurisprudence'
                );
                btn.classList.remove('btn-lendo');
                btn.innerHTML = '📷';
                btn.title = 'Documento digitalizado / imagem (sem camada de texto)';
                if (ajgAusenteNestaAcao) exibirBannersAJG();

            } else if (result && result.isJurisprudence) {
                showPopup(
                    '⚖️',
                    'Apenas Jurisprudência',
                    `Expressão: <b>"${result.match}"</b>`,
                    `Ignorado para evitar falso positivo (Pág ${result.page})`,
                    'jurisprudence'
                );
                btn.classList.remove('btn-lendo');
                btn.classList.add('btn-juris');
                btn.innerHTML = '⚖️';
                btn.title = `Apenas jurisprudência na pág. ${result.page} (clique para próxima)`;
                // Atualizar cursor para pular este match de jurisprudência (evita repetir a página)
                lastFoundCursor = { page: result.page, charIndex: (result.charIndex || 0) + 1 };
                // Se AJG ausente na primeira busca: exibir apenas banner laranja
                if (ajgAusenteNestaAcao) exibirBannersAJG();

            } else if (result && result.error) {
                showPopup('❌', 'Erro', result.error, null, 'error');
                btn.classList.remove('btn-lendo');
                btn.innerHTML = '⚠️';
                // Se AJG ausente na primeira busca: exibir apenas banner laranja
                if (ajgAusenteNestaAcao) exibirBannersAJG();

            } else if (result && result.notFound) {
                if (isSequential) {
                    showPopup('🔚', 'Fim da Busca', 'Não há mais ocorrências de tutela no documento. Clique para reiniciar a busca.', null, 'error');
                    btn.classList.remove('btn-lendo');
                    btn.innerHTML = '🔄';
                    btn.title = 'Buscar do início (nova busca)';
                    // Reset cursor para permitir nova busca do início
                    lastFoundCursor = null;
                } else {
                    showPopup('❌', 'Não Encontrado', 'Nenhum pedido de tutela foi encontrado neste documento.', null, 'error');
                    btn.classList.remove('btn-lendo');
                    btn.innerHTML = '⚠️';
                    // Se AJG ausente na primeira busca: exibir apenas banner laranja
                    if (ajgAusenteNestaAcao) exibirBannersAJG();
                }
            }
        };

        document.body.appendChild(btn);
        return btn;
    }

    // ===========================================================================================
    // MONITOR DE PDF (loop principal)
    // ===========================================================================================
    function checkPDF() {
        let pdfData = findPdf(document);
        let isNewPdf = false;

        if (pdfData && !currentPdfData) {
            isNewPdf = true;
        } else if (pdfData && currentPdfData) {
            let url1 = pdfData.url.split('#')[0].replace(/([&?])_v=\d+/, '');
            let url2 = currentPdfData.url.split('#')[0].replace(/([&?])_v=\d+/, '');
            if (url1 !== url2) isNewPdf = true;
        }

        if (isNewPdf) {
            currentPdfData = pdfData;
            lastFoundCursor = null; // Reset cursor ao trocar de PDF
            ajgJaVerificado = false; // Reset AJG: novo PDF = nova verificação de AJG
            ajgEncontrado = null;
            // Reset do cache de OCR: evita reutilizar o resultado (AJG/tutela) do PDF anterior
            ocrCacheData = null;
            ocrEmAndamento = null;
            if (pdfButtonShown && pdfButtonNode) pdfButtonNode.remove();
            pdfButtonNode = createBottomRightButton();
            pdfButtonShown = true;
        } else if (!pdfData && pdfButtonShown) {
            if (pdfButtonNode) pdfButtonNode.remove();
            pdfButtonShown = false;
            currentPdfData = null;
        }
    }

    setInterval(checkPDF, 1500);

    // ===========================================================================================
    // MÓDULO 2: CÓPIA RÁPIDA DE LINK PARA DOCUMENTO (Árvore)
    // ===========================================================================================
    const COPY_SVG = `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
    const CHECK_SVG = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

    function injectQuickCopyButtons() {
        const copyLinkContainers = document.querySelectorAll('[id^="imgCopyLinkDoc_"]');

        copyLinkContainers.forEach(container => {
            if (container.querySelector('.eproc-quick-copy')) return;

            const popoverDiv = container.querySelector('[id^="popover-content"]');
            if (!popoverDiv) return;
            const popoverId = popoverDiv.id.replace('popover-content', '');

            // Encontrar li4 (formato "evento X, TIPODOCN")
            const li4Link = container.querySelector('[id^="li4' + popoverId + '"]');
            if (!li4Link) return;

            const onclickStr = li4Link.getAttribute('onclick') || '';
            const widgetMatch = onclickStr.match(/widgetlinkdocumento4[^'"]*/)
            if (!widgetMatch) return;
            const widgetId = widgetMatch[0];

            const linkText = li4Link.querySelector('span')?.textContent || 'Link';

            const cardSpan = container.querySelector('[id^="card"]');
            if (!cardSpan) return;

            const btn = document.createElement('span');
            btn.className = 'eproc-quick-copy';
            btn.title = 'Copiar: ' + linkText;
            btn.innerHTML = COPY_SVG;

            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();

                try {
                    if (typeof inputCopiarLinkDocumento === 'function') {
                        inputCopiarLinkDocumento(li4Link, widgetId);
                    }
                } catch(err) {
                    const widgetDiv = document.getElementById(widgetId);
                    if (widgetDiv) {
                        const widgetSpan = widgetDiv.querySelector('.widgetlinkdocumento');
                        if (widgetSpan) {
                            navigator.clipboard.writeText(widgetSpan.textContent).catch(() => {});
                        }
                    }
                }

                btn.classList.add('copied');
                btn.innerHTML = CHECK_SVG;
                showToast('Link copiado: ' + linkText);

                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = COPY_SVG;
                }, 1800);
            });

            // Inserir DEPOIS do ícone nativo de copiar link
            cardSpan.after(btn);
        });
    }

    // ===========================================================================================
    // INICIALIZAÇÃO DO MÓDULO DE CÓPIA (apenas na página de árvore)
    // ===========================================================================================

    function initQuickCopy() {
        injectQuickCopyButtons();

        const arvore = document.getElementById('divArvore');
        if (arvore) {
            const observer = new MutationObserver(() => {
                clearTimeout(observer._timer);
                observer._timer = setTimeout(() => {
                    injectQuickCopyButtons();
                }, 300);
            });
            observer.observe(arvore, { childList: true, subtree: true });
        }
    }

    // Tenta iniciar o módulo de cópia se estiver na árvore
    if (document.getElementById('divArvore')) {
        initQuickCopy();
    } else {
        // Aguarda a árvore aparecer (pode estar em iframe ou carregar depois)
        let checkCount = 0;
        const checkArvore = setInterval(() => {
            checkCount++;
            if (document.getElementById('divArvore')) {
                clearInterval(checkArvore);
                initQuickCopy();
            }
            if (checkCount > 30) clearInterval(checkArvore); // Timeout 15s
        }, 500);
    }

})();
