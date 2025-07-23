import { world } from '../core/world.js';
import { ui } from '../core/ui.js';
import { VectorChapter } from '../playgrounds/vektor/index.js';
import { FunctionChapter } from '../playgrounds/fungsi/index.js';
import { CalculusChapter } from '../playgrounds/kalkulus/index.js'; // Impor Chapter baru

const chapters = {
    vector:   { chapter: VectorChapter,   navId: 'sub-nav-vector' },
    function: { chapter: FunctionChapter, navId: 'sub-nav-function' },
    calculus: { chapter: CalculusChapter, navId: 'sub-nav-calculus' } // Daftarkan Chapter baru
};
let activeChapterKey = null;

function main() {
    world.init();
    Object.values(chapters).forEach(c => c.chapter.init(world));
    ui.initNav(switchChapter);
    switchChapter('vector'); 
    animate();
}

function switchChapter(chapterName) {
    if (activeChapterKey === chapterName) return;
    if (activeChapterKey) {
        const oldChapter = chapters[activeChapterKey];
        ui.togglePanel(oldChapter.navId, false);
        oldChapter.chapter.deactivate();
    }
    const newChapter = chapters[chapterName];
    if (newChapter) {
        activeChapterKey = chapterName;
        ui.togglePanel(newChapter.navId, true);
        newChapter.chapter.activate();
        ui.setActiveButton(chapterName);
    }
}

function animate() {
    requestAnimationFrame(animate);
    world.update();
    if (activeChapterKey) {
        chapters[activeChapterKey].chapter.update(world.clock.getDelta());
    }
}

window.addEventListener('DOMContentLoaded', main);