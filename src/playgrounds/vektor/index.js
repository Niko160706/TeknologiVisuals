import { BasicVectorOps } from './BasicVectorOps.js';
import { LinearTransform } from './LinearTransform.js';
import { ui } from '../../core/ui.js';

const subPlaygrounds = {
    operations: { module: BasicVectorOps,  panelId: 'vector-ops-panel',   actionBarId: 'vector-action-bar' },
    transform:  { module: LinearTransform, panelId: 'matrix-transform-panel', actionBarId: null }
};
let activeSubPlaygroundKey = null;

function switchSubPlayground(name) {
    if (activeSubPlaygroundKey === name) return;

    // Nonaktifkan yang lama
    if (activeSubPlaygroundKey) {
        const oldSubData = subPlaygrounds[activeSubPlaygroundKey];
        if (oldSubData) {
            ui.togglePanel(oldSubData.panelId, false);
            if (oldSubData.actionBarId) ui.toggleActionBar(false);
            oldSubData.module.deactivate();
        }
    }
    
    // Aktifkan yang baru
    const newSubData = subPlaygrounds[name];
    if (newSubData) {
        activeSubPlaygroundKey = name;
        newSubData.module.activate();
        ui.togglePanel(newSubData.panelId, true);
        if (newSubData.actionBarId) ui.toggleActionBar(true);
        
        document.querySelectorAll('#sub-nav-vector .sub-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subPlayground === name);
        });
    }
}

export const VectorChapter = {
    init(world) {
        Object.values(subPlaygrounds).forEach(subData => subData.module.init(world));
        document.querySelectorAll('#sub-nav-vector .sub-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => switchSubPlayground(btn.dataset.subPlayground));
        });
    },
    activate() {
        // Selalu mulai dari 'operations' saat chapter ini diaktifkan
        switchSubPlayground('operations');
    },
    deactivate() {
        // Pastikan untuk menyembunyikan sub-playground yang aktif saat pindah chapter
        if (activeSubPlaygroundKey) {
            const oldSubData = subPlaygrounds[activeSubPlaygroundKey];
            if (oldSubData) {
                ui.togglePanel(oldSubData.panelId, false);
                if (oldSubData.actionBarId) ui.toggleActionBar(false);
                oldSubData.module.deactivate();
            }
        }
        activeSubPlaygroundKey = null; // Reset saat meninggalkan chapter
    },
    update(delta) {
        if (activeSubPlaygroundKey) {
            subPlaygrounds[activeSubPlaygroundKey].module.update(delta);
        }
    }
};
