// Deklarasikan semua variabel di lingkup modul
let world, scene, line, gradientTriangle, deltaXLabel, deltaYLabel;
const state = { deltaY: 2, deltaX: 2, c: 0 };

export const LinearFunction = {
    isActive: false,

    init(worldContext) {
        world = worldContext;
        scene = world.scene;

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 3 });
        line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial);

        const triMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
        gradientTriangle = new THREE.LineSegments(new THREE.BufferGeometry(), triMaterial);
        
        // Buat elemen label secara dinamis
        const deltaXDiv = document.createElement('div');
        deltaXDiv.className = 'axis-label-2d';
        deltaXDiv.textContent = 'Δx';
        deltaXLabel = new THREE.CSS2DObject(deltaXDiv);

        const deltaYDiv = document.createElement('div');
        deltaYDiv.className = 'axis-label-2d';
        deltaYDiv.textContent = 'Δy';
        deltaYLabel = new THREE.CSS2DObject(deltaYDiv);
        
        scene.add(line, gradientTriangle, deltaXLabel, deltaYLabel);
        
        this.addEventListeners();
        this.deactivate();
    },

    activate() {
        this.isActive = true;
        world.switchTo2D();
        line.visible = true;
        gradientTriangle.visible = true;
        deltaXLabel.visible = true;
        deltaYLabel.visible = true;
        this.updateLine();
    },

    deactivate() {
        this.isActive = false;
        line.visible = false;
        gradientTriangle.visible = false;
        if (deltaXLabel) deltaXLabel.visible = false;
        if (deltaYLabel) deltaYLabel.visible = false;
    },

    update() {},

    updateLine() {
        const m = state.deltaY / state.deltaX;
        const c = state.c;
        const xMin = -25, xMax = 25;
        
        const linePoints = [
            new THREE.Vector3(xMin, m * xMin + c, 0),
            new THREE.Vector3(xMax, m * xMax + c, 0)
        ];
        line.geometry.setFromPoints(linePoints);

        const triOrigin = new THREE.Vector3(1, m * 1 + c, 0);
        const triRunEnd = new THREE.Vector3(1 + state.deltaX, m * 1 + c, 0);
        const triRiseEnd = new THREE.Vector3(1 + state.deltaX, m * 1 + c + state.deltaY, 0);
        
        const triPoints = [triOrigin, triRunEnd, triRunEnd, triRiseEnd];
        gradientTriangle.geometry.setFromPoints(triPoints);

        deltaXLabel.position.set(triOrigin.x + state.deltaX / 2, triOrigin.y - 0.5, 0);
        deltaYLabel.position.set(triRunEnd.x + 0.5, triRunEnd.y + state.deltaY / 2, 0);

        // Update UI Panel
        const mValueEl = document.getElementById('linear-m-value');
        const cValueEl = document.getElementById('linear-c-value');
        if (mValueEl) mValueEl.textContent = m.toFixed(2);
        if (cValueEl) cValueEl.textContent = c.toFixed(2);
    },

    addEventListeners() {
        // PERBAIKAN: Menggunakan ID yang benar dari HTML yang Anda berikan
        const deltaYSlider = document.getElementById('delta-y-slider');
        const deltaXSlider = document.getElementById('delta-x-slider');
        const cSlider = document.getElementById('linear-c-slider');

        const deltaYValue = document.getElementById('delta-y-value');
        const deltaXValue = document.getElementById('delta-x-value');
        const cValue = document.getElementById('linear-c-slider-value');
        
        if(deltaYSlider && deltaYValue) {
            deltaYSlider.addEventListener('input', (e) => {
                state.deltaY = parseFloat(e.target.value);
                deltaYValue.textContent = state.deltaY.toFixed(1);
                this.updateLine();
            });
        }
        if(deltaXSlider && deltaXValue) {
            deltaXSlider.addEventListener('input', (e) => {
                state.deltaX = parseFloat(e.target.value);
                deltaXValue.textContent = state.deltaX.toFixed(1);
                this.updateLine();
            });
        }
        if(cSlider && cValue) {
            cSlider.addEventListener('input', (e) => {
                state.c = parseFloat(e.target.value);
                cValue.textContent = state.c.toFixed(1);
                this.updateLine();
            });
        }
    }
};