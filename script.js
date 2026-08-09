/**
 * SUNGAI CALENDU - SCRIPT UTAMA HALAMAN PUBLIK
 * Navigasi, Lightbox Galeri, Pengumuman, & Kirim Laporan Warga.
 */

const scriptURL = 'https://script.google.com/macros/s/AKfycbxEjkaj0UHIkzV9oyiVeiM2AWwwlkatVwviLpP_V8NoatnXlnCVR-IMZdK0mszPWqlo/exec';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initAnnouncement();
    initFormLaporan();
    initGaleriLightbox();
    loadDynamicContent();
});

/* ==========================================================================
   1. NAVIGASI & HEADER SCROLL
   ========================================================================== */
function initNavbar() {
    const navbar = document.getElementById('navbar-header');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        highlightActiveSection();
    });

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            if (mobileToggle) {
                const icon = mobileToggle.querySelector('i');
                icon.className = 'fa-solid fa-bars';
            }
        });
    });
}

function highlightActiveSection() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
}

/* ==========================================================================
   2. PENGUMUMAN DYNAMIC FROM ADMIN
   ========================================================================== */
function initAnnouncement() {
    const annBar = document.getElementById('announcement-bar');
    const annText = document.getElementById('announcement-text');
    const closeBtn = document.getElementById('close-announcement');

    const cachedText = localStorage.getItem('calendu_announcement');
    if (cachedText) {
        showAnnouncement(cachedText);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            annBar.classList.add('hidden');
        });
    }

    fetch(scriptURL + '?action=getPengumuman')
        .then(res => res.json())
        .then(data => {
            if (data && data.teks && data.teks.trim() !== '') {
                localStorage.setItem('calendu_announcement', data.teks);
                showAnnouncement(data.teks);
            }
        })
        .catch(err => {
            console.log('Pengumuman live dari cache');
        });
}

function showAnnouncement(text) {
    const annBar = document.getElementById('announcement-bar');
    const annText = document.getElementById('announcement-text');
    if (annBar && annText) {
        annText.textContent = text;
        annBar.classList.remove('hidden');
    }
}

/* ==========================================================================
   3. FITUR LAPORAN WARGA (TANPA BATASAN KARAKTER)
   ========================================================================== */
function initFormLaporan() {
    const form = document.forms['form-laporan'];
    const btnSubmit = document.querySelector('.btn-submit');
    const btnSubmitText = document.getElementById('btn-submit-text');
    const pesanSukses = document.getElementById('pesan-sukses');
    const pesanGagal = document.getElementById('pesan-gagal');
    const pesanInput = document.getElementById('pesan');
    const charCounter = document.getElementById('char-counter');

    // Live character counter tanpa batasan
    if (pesanInput && charCounter) {
        pesanInput.addEventListener('input', () => {
            charCounter.textContent = pesanInput.value.length;
        });
    }

    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();

            pesanSukses.classList.add('hidden');
            pesanGagal.classList.add('hidden');

            const namaVal = form.nama.value.trim();
            const pesanVal = form.pesan.value.trim();
            const kontakVal = form.kontak.value.trim();
            const kategoriVal = form.kategori ? form.kategori.value : 'Lainnya / Umum';

            if (!namaVal || !pesanVal || !kategoriVal) {
                alert('Silakan isi Nama Lengkap, Kategori Laporan, dan Detail Laporan Anda.');
                return;
            }

            btnSubmit.disabled = true;
            btnSubmitText.textContent = 'Mengirim Laporan...';

            const payload = {
                action: 'lapor',
                nama: namaVal,
                kontak: kontakVal,
                kategori: kategoriVal,
                pesan: pesanVal,
                waktu: new Date().toISOString()
            };

            fetch(scriptURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                btnSubmit.disabled = false;
                btnSubmitText.textContent = 'Kirim Laporan';
                pesanSukses.classList.remove('hidden');
                form.reset();
                if (charCounter) charCounter.textContent = '0';

                pesanSukses.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                setTimeout(() => {
                    pesanSukses.classList.add('hidden');
                }, 8000);
            })
            .catch(error => {
                console.error('Laporan Error:', error);
                btnSubmit.disabled = false;
                btnSubmitText.textContent = 'Kirim Laporan';
                pesanGagal.classList.remove('hidden');
            });
        });
    }
}

/* ==========================================================================
   4. LIGHTBOX GALERI FOTO
   ========================================================================== */
function initGaleriLightbox() {
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    const modalCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('lightbox-close');

    if (!modal) return;

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.galeri-card');
        if (card) {
            const src = card.getAttribute('data-src') || card.querySelector('img').src;
            const caption = card.querySelector('img').alt || 'Dokumentasi Sungai Calendu';

            modalImg.src = src;
            modalCaption.textContent = caption;
            modal.classList.add('active');
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}

/* ==========================================================================
   5. DYNAMIC GALLERY CONTENT
   ========================================================================== */
function loadDynamicContent() {
    const galeriContainer = document.getElementById('galeri-container');
    if (!galeriContainer) return;

    let deletedPhotos = [];
    try {
        deletedPhotos = JSON.parse(localStorage.getItem('calendu_deleted_photos') || '[]');
    } catch(e) {
        deletedPhotos = [];
    }

    // Filter out static cards if deleted
    if (deletedPhotos.length > 0) {
        const staticCards = galeriContainer.querySelectorAll('.galeri-card');
        staticCards.forEach(card => {
            const src = card.getAttribute('data-src') || (card.querySelector('img') ? card.querySelector('img').src : '');
            const alt = card.querySelector('img') ? card.querySelector('img').alt : '';
            if (deletedPhotos.includes(src) || deletedPhotos.includes(alt)) {
                card.remove();
            }
        });
    }

    fetch(scriptURL + '?action=getGaleri')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(item => {
                    const urlStr = (item.url || '').toLowerCase();
                    const nameStr = (item.namaFile || '').toLowerCase();

                    // Check if deleted by admin
                    if (deletedPhotos.includes(item.url) || deletedPhotos.includes(item.namaFile)) {
                        return;
                    }

                    // Strict filter: exclude keris, kris, house, building, badik, pusaka, galeri3, galeri5
                    const unwantedKeywords = ['keris', 'kris', 'rumah', 'bangunan', 'badik', 'pusaka', 'senjata', 'homestay', 'galeri3', 'galeri5'];
                    const isUnwanted = unwantedKeywords.some(kw => urlStr.includes(kw) || nameStr.includes(kw));

                    if (isUnwanted) {
                        return;
                    }

                    // Check if already in container to prevent duplication
                    const existingCards = galeriContainer.querySelectorAll('.galeri-card');
                    let exists = false;
                    existingCards.forEach(card => {
                        if (card.getAttribute('data-src') === item.url) exists = true;
                    });

                    if (item.url && !exists) {
                        const card = document.createElement('div');
                        card.className = 'galeri-card';
                        card.setAttribute('data-src', item.url);
                        card.innerHTML = `
                            <img src="${item.url}" alt="${item.namaFile || 'Foto Sungai Calendu'}" loading="lazy">
                            <div class="galeri-overlay">
                                <i class="fa-solid fa-magnifying-glass-plus"></i>
                            </div>
                        `;
                        galeriContainer.prepend(card);
                    }
                });
            }
        })
        .catch(err => {
            console.log('Galeri menggunakan gambar bawaan statis.');
        });
}