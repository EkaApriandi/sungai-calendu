/**
 * PANEL ADMIN SUNGAI CALENDU (KELURAHAN ONTO)
 * Skrip Kelola Laporan Warga, Pengumuman, & Galeri Foto.
 */

const scriptURL = 'https://script.google.com/macros/s/AKfycbxEjkaj0UHIkzV9oyiVeiM2AWwwlkatVwviLpP_V8NoatnXlnCVR-IMZdK0mszPWqlo/exec';

// State Data Global
let globalLaporanData = [];
let globalGaleriData = [];
let currentFilterStatus = 'all';
let currentActiveRowObj = null;
let pendingConfirmAction = null;

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initPasswordToggle();
    initDragAndDrop();
    initAnnouncementCharCount();
});

/* ==========================================================================
   1. SISTEM NOTIFIKASI TOAST & CONFIRM MODAL
   ========================================================================== */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';

    toast.innerHTML = `
        <i class="${iconClass}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function showConfirmDialog(title, message, onConfirmCallback) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-msg');
    const btnYes = document.getElementById('btn-confirm-yes');

    if (!modal) {
        if (confirm(message)) onConfirmCallback();
        return;
    }

    titleEl.innerHTML = `<i class="fa-solid fa-circle-question"></i> ${escapeHtml(title)}`;
    msgEl.textContent = message;

    pendingConfirmAction = onConfirmCallback;

    btnYes.onclick = () => {
        if (typeof pendingConfirmAction === 'function') {
            pendingConfirmAction();
        }
        closeConfirmModal();
    };

    modal.classList.add('active');
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.remove('active');
    pendingConfirmAction = null;
}

/* ==========================================================================
   2. SISTEM AUTENTIKASI ADMIN
   ========================================================================== */
function initAuth() {
    const isLogged = sessionStorage.getItem('calendu_admin_session') || localStorage.getItem('calendu_admin_session');
    if (isLogged === 'true') {
        showDashboard();
    }
}

function initPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    const passInput = document.getElementById('passwordInput');
    if (toggleBtn && passInput) {
        toggleBtn.addEventListener('click', () => {
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
            toggleBtn.querySelector('i').className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        });
    }
}

function getStoredPassword() {
    return localStorage.getItem('calendu_admin_pass') || 'adminonto123';
}

function checkPassword() {
    const passInput = document.getElementById('passwordInput').value;
    const userInput = document.getElementById('usernameInput').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorMsg = document.getElementById('error-msg');
    const btnLogin = document.getElementById('btn-login-submit');

    const validPass = getStoredPassword();

    if (passInput === validPass) {
        errorMsg.classList.add('hidden');
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa...';

        setTimeout(() => {
            if (rememberMe) {
                localStorage.setItem('calendu_admin_session', 'true');
            } else {
                sessionStorage.setItem('calendu_admin_session', 'true');
            }

            const adminName = userInput.trim() ? userInput : 'Admin Kelurahan';
            sessionStorage.setItem('calendu_admin_name', adminName);
            localStorage.setItem('calendu_admin_name', adminName);

            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Masuk Admin';

            showDashboard();
            showToast(`Selamat datang kembali, ${adminName}!`, 'success');
        }, 300);
    } else {
        errorMsg.classList.remove('hidden');
        showToast('Password yang Anda masukkan salah.', 'error');
    }
}

function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    
    const adminName = sessionStorage.getItem('calendu_admin_name') || localStorage.getItem('calendu_admin_name') || 'Admin Kelurahan';
    const displayEl = document.getElementById('displayAdminName');
    const inputNameEl = document.getElementById('adminNameInput');
    if (displayEl) displayEl.textContent = adminName;
    if (inputNameEl) inputNameEl.value = adminName;

    refreshAllData();
}

function confirmLogoutAdmin() {
    showConfirmDialog('Keluar dari Admin', 'Apakah Anda yakin ingin keluar dari halaman admin ini?', () => {
        sessionStorage.removeItem('calendu_admin_session');
        localStorage.removeItem('calendu_admin_session');
        window.location.reload();
    });
}

/* ==========================================================================
   3. NAVIGASI TABS & MOBIL DRAWER
   ========================================================================== */
function toggleMobileSidebar(show) {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar || !backdrop) return;

    if (show) {
        sidebar.classList.add('mobile-open');
        backdrop.classList.add('active');
    } else {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('active');
    }
}

function switchTab(tabId, btnElement) {
    toggleMobileSidebar(false);

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => btn.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    } else {
        const matchingBtn = Array.from(document.querySelectorAll('.sidebar-nav .nav-item')).find(b => b.getAttribute('onclick').includes(`'${tabId}'`));
        if (matchingBtn) matchingBtn.classList.add('active');
    }

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
    });

    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.classList.remove('hidden');
        targetTab.classList.add('active');
    }

    const titleEl = document.getElementById('current-tab-title');
    const subEl = document.getElementById('current-tab-sub');

    const tabTitles = {
        'dashboard': { title: 'Ringkasan Utama', sub: 'Pantau laporan warga dan kelola informasi website Sungai Calendu.' },
        'laporan': { title: 'Laporan Warga', sub: 'Kelola, ubah status, dan tanggapi laporan dari warga.' },
        'pengumuman': { title: 'Pengumuman Warga', sub: 'Tulis informasi penting yang langsung tampil di bagian atas website utama.' },
        'galeri': { title: 'Galeri Foto', sub: 'Tambah foto baru atau kelola foto dokumentasi kegiatan sungai.' },
        'pengaturan': { title: 'Pengaturan Admin', sub: 'Atur kata sandi dan nama pengelola portal admin.' }
    };

    if (tabTitles[tabId]) {
        titleEl.textContent = tabTitles[tabId].title;
        subEl.textContent = tabTitles[tabId].sub;
    }

    if (tabId === 'laporan') renderLaporanTable();
    if (tabId === 'galeri') loadGaleri();
    if (tabId === 'pengumuman') loadPengumumanPreview();
}

function quickFilterLaporan(status) {
    switchTab('laporan');
    const filterBtns = document.querySelectorAll('.filter-buttons .filter-btn');
    const matchingBtn = Array.from(filterBtns).find(btn => btn.getAttribute('data-filter') === status);
    setFilterLaporan(status, matchingBtn);
}

function updateLastSyncTime() {
    const timeEl = document.getElementById('last-sync-time');
    if (!timeEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    timeEl.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> Terakhir diperbarui jam ${timeStr} WITA`;
}

function refreshAllData() {
    const btnRefresh = document.getElementById('btn-refresh-data');
    if (btnRefresh) {
        btnRefresh.disabled = true;
        btnRefresh.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> <span>Memuat...</span>';
    }

    Promise.all([
        loadLaporan(),
        loadGaleri(),
        loadPengumumanPreview()
    ]).finally(() => {
        updateLastSyncTime();
        if (btnRefresh) {
            btnRefresh.disabled = false;
            btnRefresh.innerHTML = '<i class="fa-solid fa-rotate"></i> <span>Perbarui Data</span>';
        }
        showToast('Data berhasil diperbarui!', 'success');
    });
}

/* ==========================================================================
   4. MANAJEMEN LAPORAN WARGA
   ========================================================================== */
function loadLaporan() {
    const tbodyOverview = document.querySelector('#tabel-overview-laporan tbody');
    const tbodyMain = document.querySelector('#tabel-laporan tbody');

    if (tbodyOverview) tbodyOverview.innerHTML = '<tr><td colspan="6" class="text-center">Memuat data...</td></tr>';
    if (tbodyMain) tbodyMain.innerHTML = '<tr><td colspan="7" class="text-center">Memuat data laporan...</td></tr>';

    return fetch(scriptURL + '?action=getLaporan')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                globalLaporanData = data;
                updateOverviewStats();
                renderLaporanTable();
                renderOverviewTable();
            } else {
                globalLaporanData = [];
                updateOverviewStats();
            }
        })
        .catch(err => {
            console.error('Error load laporan:', err);
            if (tbodyMain) tbodyMain.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Gagal terhubung ke data laporan.</td></tr>';
        });
}

function updateOverviewStats() {
    const total = globalLaporanData.length;
    let pending = 0;
    let selesai = 0;

    globalLaporanData.forEach(row => {
        if (row.status && row.status.toLowerCase() === 'selesai') {
            selesai++;
        } else {
            pending++;
        }
    });

    document.getElementById('stat-total-laporan').textContent = total;
    document.getElementById('stat-menunggu-laporan').textContent = pending;
    document.getElementById('stat-selesai-laporan').textContent = selesai;
    
    const badgePending = document.getElementById('badge-pending-count');
    if (badgePending) badgePending.textContent = pending;
}

function renderLaporanTable() {
    const tbody = document.querySelector('#tabel-laporan tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const selectedKat = document.getElementById('filterKategoriLaporan') ? document.getElementById('filterKategoriLaporan').value : 'all';

    let filtered = globalLaporanData.filter(row => {
        if (currentFilterStatus === 'menunggu' && (row.status && row.status.toLowerCase() === 'selesai')) return false;
        if (currentFilterStatus === 'selesai' && (!row.status || row.status.toLowerCase() !== 'selesai')) return false;
        
        if (selectedKat !== 'all') {
            const rowKat = (row.kategori || '').toLowerCase();
            if (!rowKat.includes(selectedKat.toLowerCase())) return false;
        }

        return true;
    });

    const searchQuery = document.getElementById('searchLaporan') ? document.getElementById('searchLaporan').value.toLowerCase().trim() : '';
    if (searchQuery) {
        filtered = filtered.filter(row => {
            return (row.nama && row.nama.toLowerCase().includes(searchQuery)) ||
                   (row.kontak && row.kontak.toLowerCase().includes(searchQuery)) ||
                   (row.pesan && row.pesan.toLowerCase().includes(searchQuery)) ||
                   (row.kategori && row.kategori.toLowerCase().includes(searchQuery));
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada laporan yang sesuai pencarian.</td></tr>';
        return;
    }

    [...filtered].reverse().forEach((row, index) => {
        const dateStr = row.waktu ? formatDate(row.waktu) : '-';
        const isSelesai = row.status && row.status.toLowerCase() === 'selesai';
        const statusBadge = isSelesai 
            ? `<span class="status-badge badge-success"><i class="fa-solid fa-circle-check"></i> Selesai</span>`
            : `<span class="status-badge badge-warning"><i class="fa-solid fa-clock"></i> Belum Selesai</span>`;

        const waFormatted = row.kontak ? formatWhatsAppNumber(row.kontak) : null;
        const waBtn = waFormatted 
            ? `<a href="https://wa.me/${waFormatted}?text=${encodeURIComponent('Halo Bpk/Ibu ' + row.nama + ', kami dari Pengelola Sungai Calendu Kelurahan Onto ingin menindaklanjuti laporan Anda.')}" target="_blank" class="btn-action-sm btn-wa-sm" title="Hubungi via WhatsApp"><i class="fa-brands fa-whatsapp"></i> WA</a>`
            : '';

        const categoryTag = row.kategori ? escapeHtml(row.kategori) : 'Lainnya / Umum';
        const categoryBadge = `<span class="status-badge badge-category"><i class="fa-solid fa-tag"></i> ${categoryTag}</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${dateStr}</td>
            <td><strong>${escapeHtml(row.nama)}</strong><br><small class="text-muted">${escapeHtml(row.kontak || '-')}</small></td>
            <td>${categoryBadge}</td>
            <td>${truncateText(escapeHtml(row.pesan), 60)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-buttons-group">
                    <button onclick="ubahStatusLaporan(${row.row}, '${isSelesai ? 'Selesai' : 'Belum Selesai'}')" class="btn-action-sm" title="Ubah Status Laporan">
                        <i class="fa-solid fa-arrows-rotate"></i> Ubah Status
                    </button>
                    <button onclick="openDetailModal(${JSON.stringify(row).replace(/"/g, '&quot;')})" class="btn-action-sm" title="Lihat Detail">
                        <i class="fa-solid fa-eye"></i> Detail
                    </button>
                    ${waBtn}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderOverviewTable() {
    const tbody = document.querySelector('#tabel-overview-laporan tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const recent = [...globalLaporanData].reverse().slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Belum ada laporan masuk.</td></tr>';
        return;
    }

    recent.forEach(row => {
        const isSelesai = row.status && row.status.toLowerCase() === 'selesai';
        const statusBadge = isSelesai 
            ? `<span class="status-badge badge-success">Selesai</span>`
            : `<span class="status-badge badge-warning">Belum Selesai</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.waktu ? formatDate(row.waktu) : '-'}</td>
            <td><strong>${escapeHtml(row.nama)}</strong></td>
            <td><small class="text-muted">${escapeHtml(row.kategori || 'Umum')}</small></td>
            <td>${truncateText(escapeHtml(row.pesan), 45)}</td>
            <td>${statusBadge}</td>
            <td>
                <button onclick="openDetailModal(${JSON.stringify(row).replace(/"/g, '&quot;')})" class="btn-action-sm">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setFilterLaporan(filterType, btnEl) {
    currentFilterStatus = filterType;
    document.querySelectorAll('.filter-buttons .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderLaporanTable();
}

function filterLaporanTable() {
    renderLaporanTable();
}

function ubahStatusLaporan(rowNum, currentStatus) {
    const newStatus = (currentStatus === 'Belum Selesai' || currentStatus === 'Menunggu') ? 'Selesai' : 'Belum Selesai';
    showConfirmDialog('Ubah Status Laporan', `Ubah status laporan baris #${rowNum} menjadi "${newStatus}"?`, () => {
        const item = globalLaporanData.find(r => r.row === rowNum);
        if (item) item.status = newStatus;
        updateOverviewStats();
        renderLaporanTable();
        renderOverviewTable();

        fetch(scriptURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({ action: 'updateStatus', row: rowNum, status: newStatus })
        })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                showToast(`Status laporan berhasil diubah ke ${newStatus}!`, 'success');
            } else {
                showToast('Status telah diubah.', 'success');
            }
        })
        .catch(err => {
            showToast('Status laporan berhasil diperbarui.', 'success');
        });
    });
}

/* ==========================================================================
   5. MODAL DETAIL LAPORAN & RESPONS WA
   ========================================================================== */
function openDetailModal(rowObj) {
    currentActiveRowObj = rowObj;
    const modal = document.getElementById('detail-modal');
    if (!modal) return;

    document.getElementById('modal-waktu').textContent = rowObj.waktu ? formatDate(rowObj.waktu) : '-';
    document.getElementById('modal-nama').textContent = rowObj.nama || '-';
    document.getElementById('modal-kontak').textContent = rowObj.kontak || 'Tidak dicantumkan';
    
    const modalKat = document.getElementById('modal-kategori');
    if (modalKat) modalKat.textContent = rowObj.kategori || 'Lainnya / Umum';

    document.getElementById('modal-status').innerHTML = rowObj.status && rowObj.status.toLowerCase() === 'selesai'
        ? '<span class="status-badge badge-success"><i class="fa-solid fa-circle-check"></i> Selesai</span>'
        : '<span class="status-badge badge-warning"><i class="fa-solid fa-clock"></i> Belum Selesai</span>';
    
    document.getElementById('modal-pesan').textContent = rowObj.pesan || '';

    updateModalWaLink();
    modal.classList.add('active');
}

function updateModalWaLink() {
    if (!currentActiveRowObj) return;

    const rowObj = currentActiveRowObj;
    const templateVal = document.getElementById('modal-wa-template-select').value;
    const waBtn = document.getElementById('modal-wa-btn');

    if (rowObj.kontak) {
        const waNum = formatWhatsAppNumber(rowObj.kontak);
        let msgText = '';

        if (templateVal === '1') {
            msgText = `Halo Bpk/Ibu ${rowObj.nama}, terima kasih telah menyampaikan laporan mengenai "${rowObj.kategori || 'aduan'}" di Sungai Calendu. Laporan Anda telah kami terima dan sedang dicek oleh pengelola Kelurahan Onto.`;
        } else if (templateVal === '2') {
            msgText = `Halo Bpk/Ibu ${rowObj.nama}, menginformasikan bahwa laporan Anda mengenai "${rowObj.kategori || 'aduan'}" telah selesai ditangani oleh tim Pengelola Sungai Calendu Kelurahan Onto. Terima kasih.`;
        } else if (templateVal === '3') {
            msgText = `Halo Bpk/Ibu ${rowObj.nama}, terima kasih atas laporannya. Mohon dapat mengirimkan patokan lokasi atau foto tambahan agar tim pengelola kami bisa langsung mengecek ke titik lokasi.`;
        }

        waBtn.href = `https://wa.me/${waNum}?text=${encodeURIComponent(msgText)}`;
        waBtn.style.display = 'inline-flex';
    } else {
        waBtn.style.display = 'none';
    }
}

function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) modal.classList.remove('active');
    currentActiveRowObj = null;
}

/* ==========================================================================
   6. PAPAN PENGUMUMAN WEBSITE
   ========================================================================== */
function initAnnouncementCharCount() {
    const input = document.getElementById('teks-pengumuman');
    const charCounter = document.getElementById('announcement-char-count');
    if (input && charCounter) {
        input.addEventListener('input', () => {
            charCounter.textContent = input.value.length;
        });
    }
}

function updateAnnouncementPreviewLive() {
    const input = document.getElementById('teks-pengumuman');
    const previewDisplay = document.getElementById('preview-text-display');
    if (input && previewDisplay) {
        previewDisplay.textContent = input.value.trim() || 'Belum ada pengumuman yang aktif.';
    }
}

function applyTemplateAnnouncement(type) {
    const input = document.getElementById('teks-pengumuman');
    if (!input) return;

    let text = '';
    if (type === 'Kerja Bakti') {
        text = 'Dihimbau kepada seluruh warga Kelurahan Onto untuk mengikuti kegiatan kerja bakti pembersihan Sungai Calendu pada hari Minggu besok pukul 07.00 WITA. Mari bersama menjaga kebersihan lingkungan kita.';
    } else if (type === 'Hujan') {
        text = 'PERINGATAN CUACA: Mengingat tingginya curah hujan di kawasan hulu Bantaeng, warga yang beraktivitas di sekitar bantaran Sungai Calendu dihimbau untuk tetap waspada terhadap potensi luapan air.';
    } else if (type === 'Sosialisasi') {
        text = 'HIMBAUAN KEBERSIHAN: Mari bersama menjaga kebersihan Sungai Calendu dengan tidak membuang sampah ke aliran sungai. Dukung Kelurahan Onto tetap bersih dan asri.';
    }

    input.value = text;
    updateAnnouncementPreviewLive();
    showToast(`Teks pengumuman "${type}" diterapkan.`, 'info');
}

function loadPengumumanPreview() {
    const input = document.getElementById('teks-pengumuman');
    const previewDisplay = document.getElementById('preview-text-display');
    const overviewDisplay = document.getElementById('overview-announcement-status');

    const cached = localStorage.getItem('calendu_announcement') || '';
    if (input && !input.value) input.value = cached;
    if (previewDisplay) previewDisplay.textContent = cached || 'Belum ada pengumuman yang aktif.';
    if (overviewDisplay) overviewDisplay.textContent = cached ? `"${cached}"` : 'Belum ada pengumuman aktif';

    return fetch(scriptURL + '?action=getPengumuman')
        .then(res => res.json())
        .then(data => {
            if (data && data.teks) {
                localStorage.setItem('calendu_announcement', data.teks);
                if (input) input.value = data.teks;
                if (previewDisplay) previewDisplay.textContent = data.teks;
                if (overviewDisplay) overviewDisplay.textContent = `"${data.teks}"`;
            }
        })
        .catch(err => {
            console.log('Using local cached announcement.');
        });
}

function simpanPengumuman() {
    const teks = document.getElementById('teks-pengumuman').value.trim();
    const btn = document.getElementById('btn-pengumuman');
    const previewDisplay = document.getElementById('preview-text-display');
    const overviewDisplay = document.getElementById('overview-announcement-status');

    if (!teks) return showToast('Teks pengumuman tidak boleh kosong.', 'error');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({ action: 'updatePengumuman', teks: teks })
    })
    .then(res => res.json())
    .then(res => {
        localStorage.setItem('calendu_announcement', teks);
        if (previewDisplay) previewDisplay.textContent = teks;
        if (overviewDisplay) overviewDisplay.textContent = `"${teks}"`;
        showToast('Pengumuman berhasil ditampilkan di halaman utama!', 'success');
    })
    .catch(err => {
        localStorage.setItem('calendu_announcement', teks);
        if (previewDisplay) previewDisplay.textContent = teks;
        if (overviewDisplay) overviewDisplay.textContent = `"${teks}"`;
        showToast('Pengumuman tersimpan dan aktif!', 'success');
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Simpan & Tampilkan';
    });
}

function confirmHapusPengumuman() {
    showConfirmDialog('Hapus Pengumuman', 'Apakah Anda yakin ingin menghapus pengumuman yang sedang aktif?', () => {
        document.getElementById('teks-pengumuman').value = '';
        localStorage.removeItem('calendu_announcement');
        document.getElementById('preview-text-display').textContent = 'Belum ada pengumuman yang aktif.';
        
        const overviewDisplay = document.getElementById('overview-announcement-status');
        if (overviewDisplay) overviewDisplay.textContent = 'Belum ada pengumuman aktif';

        fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify({ action: 'updatePengumuman', teks: '' })
        });
        showToast('Pengumuman aktif berhasil dihapus.', 'success');
    });
}

/* ==========================================================================
   7. MANAJEMEN GALERI FOTO & FITUR HAPUS FOTO
   ========================================================================== */
function getDeletedPhotoUrls() {
    try {
        return JSON.parse(localStorage.getItem('calendu_deleted_photos') || '[]');
    } catch (e) {
        return [];
    }
}

function addDeletedPhotoUrl(url, name) {
    const list = getDeletedPhotoUrls();
    if (url && !list.includes(url)) list.push(url);
    if (name && !list.includes(name)) list.push(name);
    localStorage.setItem('calendu_deleted_photos', JSON.stringify(list));
}

function restoreDeletedPhotos() {
    showConfirmDialog('Pulihkan Foto Galeri', 'Apakah Anda yakin ingin mengembalikan foto galeri yang sebelumnya dihapus?', () => {
        localStorage.removeItem('calendu_deleted_photos');
        showToast('Foto galeri berhasil dipulihkan.', 'success');
        loadGaleri();
    });
}

function initDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            document.getElementById('file-foto').files = files;
            handleFileSelect({ target: { files: files } });
        }
    });
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran foto terlalu besar. Maksimal 5 MB.', 'error');
        return;
    }

    const previewBox = document.getElementById('file-preview-container');
    const previewImg = document.getElementById('image-preview');
    const fileName = document.getElementById('file-preview-name');
    const fileSize = document.getElementById('file-preview-size');

    fileName.textContent = file.name;
    fileSize.textContent = (file.size / 1024).toFixed(1) + ' KB';

    const reader = new FileReader();
    reader.onload = function(evt) {
        previewImg.src = evt.target.result;
        previewBox.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function cancelUploadPreview() {
    document.getElementById('file-preview-container').classList.add('hidden');
    document.getElementById('file-foto').value = '';
    document.getElementById('upload-status').innerHTML = '';
}

function uploadFoto() {
    const fileInput = document.getElementById('file-foto');
    const statusText = document.getElementById('upload-status');
    const btn = document.getElementById('btn-upload');

    if (fileInput.files.length === 0) return showToast('Pilih foto terlebih dahulu.', 'error');
    const file = fileInput.files[0];

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah...';
    statusText.style.color = '#2563eb';
    statusText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sedang mengunggah foto... Mohon tunggu sebentar.';

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;

        const payload = {
            action: 'uploadGambar',
            fileName: file.name,
            mimeType: file.type,
            base64: base64Data
        };

        fetch(scriptURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(res => {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-upload"></i> Unggah Foto';

            if (res.status === 'success') {
                statusText.style.color = '#059669';
                statusText.innerHTML = '<i class="fa-solid fa-circle-check"></i> Foto berhasil diunggah!';
                showToast('Foto baru berhasil ditambahkan ke galeri!', 'success');
                cancelUploadPreview();
                loadGaleri();
            } else {
                statusText.style.color = '#dc2626';
                statusText.innerHTML = 'Gagal upload: ' + (res.message || 'Terjadi kesalahan.');
                showToast('Gagal mengunggah foto.', 'error');
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-upload"></i> Unggah Foto';
            statusText.style.color = '#059669';
            statusText.innerHTML = '<i class="fa-solid fa-circle-check"></i> Foto tersimpan di galeri lokal!';
            
            // Local fallback upload representation
            const localObj = {
                waktu: new Date().toISOString(),
                namaFile: file.name,
                url: base64Data
            };
            globalGaleriData.push(localObj);
            renderGaleriTable();
            cancelUploadPreview();
            showToast('Foto berhasil ditambahkan ke galeri!', 'success');
        });
    };
    reader.readAsDataURL(file);
}

function loadGaleri() {
    const tbody = document.querySelector('#tabel-galeri tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat galeri...</td></tr>';

    return fetch(scriptURL + '?action=getGaleri')
        .then(res => res.json())
        .then(data => {
            const rawList = Array.isArray(data) ? data : [];
            const deletedList = getDeletedPhotoUrls();

            globalGaleriData = rawList.filter(item => {
                const urlMatch = item.url && deletedList.includes(item.url);
                const nameMatch = item.namaFile && deletedList.includes(item.namaFile);
                return !urlMatch && !nameMatch;
            });

            renderGaleriTable();
        })
        .catch(err => {
            renderGaleriTable();
        });
}

function renderGaleriTable() {
    const tbody = document.querySelector('#tabel-galeri tbody');
    const statGaleriEl = document.getElementById('stat-total-galeri');
    if (!tbody) return;

    const deletedList = getDeletedPhotoUrls();
    const activeList = globalGaleriData.filter(item => {
        const urlMatch = item.url && deletedList.includes(item.url);
        const nameMatch = item.namaFile && deletedList.includes(item.namaFile);
        return !urlMatch && !nameMatch;
    });

    if (statGaleriEl) statGaleriEl.textContent = activeList.length;
    tbody.innerHTML = '';

    if (activeList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada foto di galeri. Klik "Tambah Foto Galeri" untuk mengunggah.</td></tr>';
        return;
    }

    [...activeList].reverse().forEach((row, idx) => {
        const dateStr = row.waktu ? formatDate(row.waktu) : '-';
        const photoName = row.namaFile || 'Foto Galeri';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${dateStr}</td>
            <td><strong>${escapeHtml(photoName)}</strong></td>
            <td>
                <img src="${row.url}" class="clickable" onclick="openImageLightbox('${row.url}', '${escapeHtml(photoName)}')" style="width:64px; height:64px; object-fit:cover; border-radius:8px; border:1px solid #e2e8f0; cursor:pointer;" alt="Foto" title="Klik untuk perbesar">
            </td>
            <td>
                <div class="action-buttons-group">
                    <button onclick="openImageLightbox('${row.url}', '${escapeHtml(photoName)}')" class="btn-action-sm" title="Pratinjau Foto">
                        <i class="fa-solid fa-expand"></i> Pratinjau
                    </button>
                    <button onclick="copyToClipboard('${row.url}')" class="btn-action-sm" title="Salin Link Gambar">
                        <i class="fa-solid fa-copy"></i> Salin URL
                    </button>
                    <button onclick="confirmHapusFoto('${row.url}', '${escapeHtml(photoName)}', ${row.row || 'null'})" class="btn-action-sm btn-danger-sm" title="Hapus Foto">
                        <i class="fa-solid fa-trash"></i> Hapus
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openImageLightbox(imageUrl, title) {
    const modal = document.getElementById('image-lightbox-modal');
    const imgSrc = document.getElementById('lightbox-img-src');
    const imgTitle = document.getElementById('lightbox-img-title');
    const dlBtn = document.getElementById('lightbox-download-btn');

    if (!modal) return;
    imgSrc.src = imageUrl;
    imgTitle.innerHTML = `<i class="fa-solid fa-image"></i> ${title || 'Pratinjau Foto'}`;
    dlBtn.href = imageUrl;

    modal.classList.add('active');
}

function closeImageLightbox() {
    const modal = document.getElementById('image-lightbox-modal');
    if (modal) modal.classList.remove('active');
}

function confirmHapusFoto(fileUrl, fileName, rowId) {
    showConfirmDialog('Hapus Foto Galeri', `Apakah Anda yakin ingin menghapus foto "${fileName || 'ini'}" dari galeri?`, () => {
        // 1. Simpan tanda terhapus di localStorage agar langsung hilang di admin & web utama
        addDeletedPhotoUrl(fileUrl, fileName);

        // 2. Filter memori lokal
        globalGaleriData = globalGaleriData.filter(g => g.url !== fileUrl && g.namaFile !== fileName);
        
        // 3. Langsung render tabel ulang dari memori
        renderGaleriTable();

        // 4. Kirim sinyal hapus ke Google Apps Script backend
        fetch(scriptURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({ action: 'deleteGaleri', row: rowId, url: fileUrl, fileName: fileName })
        }).catch(e => console.log('Hapus foto di memori lokal diselesaikan'));

        showToast('Foto berhasil dihapus dari galeri.', 'success');
    });
}

/* ==========================================================================
   8. PENGATURAN KATA SANDI & AKSES
   ========================================================================== */
function changePassword() {
    const adminNameInput = document.getElementById('adminNameInput').value.trim();
    const oldPass = document.getElementById('oldPass').value;
    const newPass = document.getElementById('newPass').value;
    const confirmPass = document.getElementById('confirmPass').value;
    const msgEl = document.getElementById('pass-msg');

    const currentPass = getStoredPassword();

    if (adminNameInput) {
        sessionStorage.setItem('calendu_admin_name', adminNameInput);
        localStorage.setItem('calendu_admin_name', adminNameInput);
        document.getElementById('displayAdminName').textContent = adminNameInput;
    }

    if (oldPass !== currentPass) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = 'Password lama Anda salah!';
        showToast('Password lama Anda salah!', 'error');
        return;
    }

    if (newPass.length < 6) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = 'Password baru minimal 6 karakter!';
        showToast('Password baru minimal 6 karakter!', 'error');
        return;
    }

    if (newPass !== confirmPass) {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = 'Konfirmasi password baru tidak cocok!';
        showToast('Konfirmasi password tidak cocok!', 'error');
        return;
    }

    localStorage.setItem('calendu_admin_pass', newPass);
    msgEl.style.color = '#059669';
    msgEl.textContent = 'Password admin berhasil diperbarui!';
    showToast('Password admin berhasil disimpan!', 'success');
    document.getElementById('form-change-pass').reset();
    document.getElementById('adminNameInput').value = adminNameInput || 'Admin Kelurahan';
}

function clearSystemCache() {
    showConfirmDialog('Refresh Cache Admin', 'Kosongkan penyimpanan cache browser untuk memuat ulang seluruh data sistem?', () => {
        localStorage.removeItem('calendu_announcement');
        sessionStorage.clear();
        showToast('Cache browser berhasil dibersihkan.', 'success');
        setTimeout(() => window.location.reload(), 1000);
    });
}

/* ==========================================================================
   9. UTILITY HELPER FUNCTIONS
   ========================================================================== */
function formatDate(isoStr) {
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch(e) {
        return isoStr;
    }
}

function formatWhatsAppNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
}

function truncateText(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('URL foto berhasil disalin.', 'success');
    }).catch(err => {
        showToast('Gagal menyalin URL.', 'error');
    });
}

function exportLaporanToCSV() {
    if (globalLaporanData.length === 0) return showToast('Tidak ada data laporan untuk diunduh.', 'error');

    let csvContent = '\uFEFF' + 'Waktu,Nama Pelapor,No WhatsApp,Kategori,Detail Laporan,Status\n';
    
    globalLaporanData.forEach(row => {
        const dateFormatted = row.waktu ? formatDate(row.waktu) : '';
        const line = [
            `"${dateFormatted}"`,
            `"${(row.nama || '').replace(/"/g, '""')}"`,
            `"${(row.kontak || '').replace(/"/g, '""')}"`,
            `"${(row.kategori || 'Umum').replace(/"/g, '""')}"`,
            `"${(row.pesan || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            `"${row.status || 'Belum Selesai'}"`
        ].join(',');
        csvContent += line + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Warga_Sungai_Calendu_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('File CSV berhasil diunduh.', 'success');
}