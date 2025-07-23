import { QuadraticFunction } from './QuadraticFunction.js';
import { LinearFunction } from './LinearFunction.js';
import { PolynomialFunction } from './PolynomialFunction.js'; // Impor modul baru
import { ui } from '../../core/ui.js';

const subPlaygrounds = {
    linear:    { module: LinearFunction,    panelId: 'linear-ui' },
    quadratic: { module: QuadraticFunction, panelId: 'quadratic-ui' },
    polynomial: { module: PolynomialFunction, panelId: 'polynomial-ui' } // Daftarkan modul baru
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
        document.querySelectorAll('#sub-nav-function .sub-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subPlayground === name);
        });
    }
}

export const FunctionChapter = {
    init(world) {
          Object.values(subPlaygrounds).forEach(sub => sub.module.init(world));
        document.querySelectorAll('#sub-nav-function .sub-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => switchSubPlayground(btn.dataset.subPlayground));
        });
    },
    activate() {
        switchSubPlayground('linear'); // Default ke Fungsi Linear
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