let world, scene;

let controlPoints = [];
let errorLines = []; // Array baru untuk menyimpan garis error
let curveObject;
let dragControls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
let degree = 1;

export const PolynomialFunction = {
    isActive: false,

    init(worldContext) {
        world = worldContext;
        scene = world.scene;

        const curveMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 3 });
        curveObject = new THREE.Line(new THREE.BufferGeometry(), curveMaterial);
        scene.add(curveObject);

        this._setupUIListeners();
        this.deactivate();
    },
    
    activate() {
        this.isActive = true;
        world.switchTo2D();
        curveObject.visible = true;
        controlPoints.forEach(p => p.visible = true);
        errorLines.forEach(l => l.visible = true);
        if (dragControls) dragControls.activate();
        world.renderer.domElement.addEventListener('pointerdown', this._onCanvasClick);
    },

    deactivate() {
        this.isActive = false;
        curveObject.visible = false;
        controlPoints.forEach(p => p.visible = false);
        errorLines.forEach(l => l.visible = false);
        if (dragControls) dragControls.deactivate();
        world.renderer.domElement.removeEventListener('pointerdown', this._onCanvasClick);
    },

    update() {},

    _addControlPoint(position) {
        if (controlPoints.length >= 7) return;
        
        // FITUR SNAP-TO-GRID: Bulatkan posisi ke integer terdekat
        position.round();

        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const point = new THREE.Mesh(geometry, material);
        point.position.copy(position);
        
        scene.add(point);
        controlPoints.push(point);

        // Buat garis error untuk titik baru
        const errorLineMaterial = new THREE.LineBasicMaterial({ color: 0xff4136, transparent: true, opacity: 0.7 });
        const errorLine = new THREE.Line(new THREE.BufferGeometry(), errorLineMaterial);
        errorLines.push(errorLine);
        scene.add(errorLine);

        this._updateDragControls();
        this._updateCurve();
    },

    _updateDragControls() {
        if (dragControls) dragControls.dispose();
        dragControls = new THREE.DragControls(controlPoints, world.camera, world.renderer.domElement);
        dragControls.addEventListener('dragstart', () => { world.controls.enabled = false; });
        dragControls.addEventListener('drag', (event) => {
            // FITUR SNAP-TO-GRID: Bulatkan posisi saat di-drag
            event.object.position.round();
            this._updateCurve();
        });
        dragControls.addEventListener('dragend', () => { world.controls.enabled = true; });
    },

    _updateCurve() {
        const degreeSlider = document.getElementById('poly-degree-slider');
        const degreeValue = document.getElementById('poly-degree-value');
        const equationEl = document.getElementById('polynomial-equation');
        const errorEl = document.getElementById('sse-value'); // Ambil elemen error
    

        const maxDegree = Math.max(1, controlPoints.length - 1);
        degree = Math.min(degree, maxDegree);
        
        if(degreeSlider) {
            degreeSlider.max = maxDegree;
            degreeSlider.value = degree;
            if(degreeValue) degreeValue.textContent = degree;
        }

        if (controlPoints.length < 2) {
            curveObject.geometry.setFromPoints([]);
            errorLines.forEach(l => l.geometry.setFromPoints([]));
            if(equationEl) equationEl.textContent = 'y = ...';
            if(errorEl) errorEl.textContent = '0.00';
            return;
        }

        const dataX = controlPoints.map(p => p.position.x);
        const dataY = controlPoints.map(p => p.position.y);
        
        const coeffs = this._polynomialFit(dataX, dataY, degree);
        
        // Fungsi untuk mengevaluasi y pada x tertentu
        const evaluatePolynomial = (x) => {
            let y = 0;
            for (let i = 0; i < coeffs.length; i++) {
                y += coeffs[i] * Math.pow(x, i);
            }
            return y;
        };

        const points = [];
        for (let x = -25; x <= 25; x += 0.1) {
            points.push(new THREE.Vector3(x, evaluatePolynomial(x), 0));
        }
        curveObject.geometry.setFromPoints(points);

        // FITUR VISUALISASI ERROR: Hitung & gambar garis error
        let totalError = 0;
        for (let i = 0; i < controlPoints.length; i++) {
            const point = controlPoints[i];
            const curveY = evaluatePolynomial(point.position.x); // Pastikan Anda punya fungsi ini
            const error = point.position.y - curveY;
            totalError += Math.pow(error, 2);
            
            const errorLinePoints = [
                point.position,
                new THREE.Vector3(point.position.x, curveY, 0)
            ];
            errorLines[i].geometry.setFromPoints(errorLinePoints);
        }
        
        // Perintah untuk menampilkan total error di UI
        if (errorEl) errorEl.textContent = totalError.toFixed(2);
        
        this._displayEquation(coeffs);
    },

   _displayEquation(coeffs) {
        const equationEl = document.getElementById('polynomial-equation');
        if (!equationEl) return;

        // Faktor pengali tetap untuk tujuan tampilan agar menjadi bilangan bulat
        const displayScaleFactor = 100;
        let equation = "y ≈ "; // Gunakan 'kira-kira sama dengan' untuk menandakan ini adalah representasi
        let isFirstTerm = true;
        
        for (let i = coeffs.length - 1; i >= 0; i--) {
            // Kalikan koefisien asli dengan faktor skala HANYA untuk tampilan
            const coeff = coeffs[i] * displayScaleFactor;
            
            if (Math.abs(coeff) < 1) continue; // Abaikan jika hasilnya masih < 1
            
            let sign = coeff > 0 ? "+ " : "- ";
            if (isFirstTerm && coeff > 0) sign = "";
            if (isFirstTerm && coeff < 0) sign = "-";
            
            // Tampilkan sebagai bilangan bulat
            const absCoeff = Math.abs(coeff).toFixed(0);
            let term = "";
            
            // Jangan tampilkan angka 1 di depan x (misal: 1x² -> x²)
            const displayCoeff = (absCoeff == 1 && i > 0) ? "" : absCoeff;

            if (i === 0) {
                term = absCoeff;
            } else if (i === 1) {
                term = `${displayCoeff}x `;
            } else {
                term = `${displayCoeff}x<sup>${i}</sup> `;
            }
            equation += `${sign}${term}`;
            isFirstTerm = false;
        }

        if(isFirstTerm) equation = "y = 0";
        equationEl.innerHTML = equation;
    },

    _polynomialFit(x, y, degree) {
        const X = [];
        for (let i = 0; i < x.length; i++) {
            const row = [];
            for (let j = 0; j <= degree; j++) {
                row.push(Math.pow(x[i], j));
            }
            X.push(row);
        }
        const XT = numeric.transpose(X);
        const XTX = numeric.dot(XT, X);
        const XTY = numeric.dot(XT, y);
        const coeffs = numeric.solve(XTX, XTY);
        return coeffs;
    },

    _setupUIListeners() {
        const degreeSlider = document.getElementById('poly-degree-slider');
        const clearBtn = document.getElementById('clear-points-btn');

        if(degreeSlider) {
            degreeSlider.addEventListener('input', (e) => {
                degree = parseInt(e.target.value);
                this._updateCurve();
            });
        }
        
        if(clearBtn) {
            clearBtn.addEventListener('click', () => {
                controlPoints.forEach(p => scene.remove(p));
                controlPoints.forEach(p => {
                    p.geometry.dispose();
                    p.material.dispose();
                });
                controlPoints = [];
                this._updateCurve();
            });
        }
    },
    
    _onCanvasClick: (event) => {
        if (dragControls && dragControls.object) return;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, world.camera);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersectPoint);
        PolynomialFunction._addControlPoint(intersectPoint);
    }
};

PolynomialFunction._onCanvasClick = PolynomialFunction._onCanvasClick.bind(PolynomialFunction);