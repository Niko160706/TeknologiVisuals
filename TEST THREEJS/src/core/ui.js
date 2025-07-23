class UI {
    initNav(callback) {
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.navButtons.forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', () => {
                    callback(btn.dataset.playground);
                });
            }
        });
    }

    setActiveButton(chapterName) {
        this.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.playground === chapterName);
        });
    }

    togglePanel(panelId, show) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = show ? 'flex' : 'none'; // 'flex' agar kolom sejajar
        }
    }

    // Fungsi untuk menampilkan/menyembunyikan bilah aksi
    toggleActionBar(show) {
        const actionBar = document.getElementById('vector-action-bar');
        if (actionBar) {
            actionBar.style.display = show ? 'flex' : 'none';
        }
    }
}
export const ui = new UI();