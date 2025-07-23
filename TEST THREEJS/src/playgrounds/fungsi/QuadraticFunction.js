let world, scene, curve;
let a = 1, b = 0, c = 0;

export const QuadraticFunction = {
    isActive: false,
    init(worldContext) {
        world = worldContext;
        scene = world.scene;
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
        const geometry = new THREE.BufferGeometry();
        curve = new THREE.Line(geometry, material);
        scene.add(curve);
        this.addEventListeners();
        this.deactivate();
    },
    activate() {
        this.isActive = true;
        world.switchTo2D();
        curve.visible = true;
        this.updateCurve();
    },
    deactivate() {
        this.isActive = false;
        curve.visible = false;
    },
    update() {},
    updateCurve() {
        const points = [];
        const range = Math.max(10, 1 / (Math.abs(a) || 0.1) * 15);
        for (let x = -range; x <= range; x += (range * 2) / 200) {
            points.push(new THREE.Vector3(x, a * x * x + b * x + c, 0));
        }
        curve.geometry.setFromPoints(points);
    },

    addEventListeners() {
        const sliderA = document.getElementById('slider-a');
        const sliderB = document.getElementById('slider-b');
        const sliderC = document.getElementById('slider-c');

        const valueA = document.getElementById('slider-a-value');
        const valueB = document.getElementById('slider-b-value');
        const valueC = document.getElementById('slider-c-value');

        // PERBAIKAN: Tambahkan pengecekan 'if' agar tidak error jika elemen tidak ada
        if (sliderA && valueA) {
            sliderA.addEventListener('input', (e) => {
                a = parseFloat(e.target.value);
                valueA.textContent = a.toFixed(1);
                this.updateCurve();
            });
        }
        if (sliderB && valueB) {
            sliderB.addEventListener('input', (e) => {
                b = parseFloat(e.target.value);
                valueB.textContent = b.toFixed(1);
                this.updateCurve();
            });
        }
        if (sliderC && valueC) {
            sliderC.addEventListener('input', (e) => {
                c = parseFloat(e.target.value);
                valueC.textContent = c.toFixed(1);
                this.updateCurve();
            });
        }
    }
};