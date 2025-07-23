import { DerivativePlayground } from './DerivativePlayground.js';
import { ui } from '../../core/ui.js';

const subPlaygrounds = {
    derivative: { module: DerivativePlayground, panelId: 'derivative-panel' }
};
let activeSubPlaygroundKey = null;

function switchSubPlayground(name) {
    if (activeSubPlaygroundKey === name) return;
    if (activeSubPlaygroundKey) {
        const oldSub = subPlaygrounds[activeSubPlaygroundKey];
        if (oldSub) {
            ui.togglePanel(oldSub.panelId, false);
            oldSub.module.deactivate();
        }
    }
    const newSub = subPlaygrounds[name];
    if (newSub) {
        activeSubPlaygroundKey = name;
        newSub.module.activate();
        ui.togglePanel(newSub.panelId, true);
        document.querySelectorAll('#sub-nav-calculus .sub-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subPlayground === name);
        });
    }
}

export const CalculusChapter = {
    init(world) {
        Object.values(subPlaygrounds).forEach(sub => sub.module.init(world));
        document.querySelectorAll('#sub-nav-calculus .sub-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => switchSubPlayground(btn.dataset.subPlayground));
        });
    },
    activate() {
        switchSubPlayground('derivative');
    },
    deactivate() {
        if (activeSubPlaygroundKey) {
            const oldSub = subPlaygrounds[activeSubPlaygroundKey];
            ui.togglePanel(oldSub.panelId, false);
            oldSub.module.deactivate();
        }
        activeSubPlaygroundKey = null;
    },
    update(delta) {
        if (activeSubPlaygroundKey) {
            subPlaygrounds[activeSubPlaygroundKey].module.update(delta);
        }
    }
};