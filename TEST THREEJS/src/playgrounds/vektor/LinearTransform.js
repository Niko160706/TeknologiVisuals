let world, scene;

const visuals = {
    staticGrid: null,
    transformGroup: null,
    unitSquare: null,
    transformedSquare: null
};
const transformState = { rotation: 0, scaleX: 1, scaleY: 1, shearX: 0, shearY: 0 };
const uiElements = {};


export const LinearTransform = {
    panelId: 'matrix-transform-panel',
    isActive: false,

    init(worldContext) {
        world = worldContext;
        scene = world.scene;

        visuals.staticGrid = this._createXYGrid(0x444444);
        
        // Buat "baki" untuk semua objek yang bergerak
        visuals.transformGroup = new THREE.Group();
        
        const dynamicGrid = this._createXYGrid('#3B82F6');
        const iHat = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1, 0xff4136, 0.4, 0.2);
        const jHat = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 1, 0x2ecc40, 0.4, 0.2);
        
        const squareGeometry = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
        visuals.unitSquare = new THREE.Mesh(squareGeometry, new THREE.MeshBasicMaterial({
            color: 0x888888, side: THREE.DoubleSide, transparent: true, opacity: 0.4
        }));
        visuals.transformedSquare = new THREE.Mesh(squareGeometry, new THREE.MeshBasicMaterial({
            color: 0xFFFFFF, side: THREE.DoubleSide, transparent: true, opacity: 0.5
        }));
        
        visuals.transformGroup.add(dynamicGrid, iHat, jHat, visuals.transformedSquare);
        
        visuals.transformGroup.position.z = 0.1;
        visuals.transformGroup.matrixAutoUpdate = false;

        scene.add(visuals.staticGrid, visuals.transformGroup, visuals.unitSquare);
        
        this._setupUIListeners();
        this.deactivate();
    },

    _createXYGrid(color) {
        const size = 25;
        const points = [];
        for (let i = -size; i <= size; i++) {
            points.push(new THREE.Vector3(-size, i, 0), new THREE.Vector3(size, i, 0));
            points.push(new THREE.Vector3(i, -size, 0), new THREE.Vector3(i, size, 0));
        }
        return new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.5 })
        );
    },

    activate() {
        this.isActive = true;
        world.switchTo2D();
        Object.values(visuals).forEach(v => { if(v) v.visible = true; });
        this._applyTransform();
    },

    deactivate() {
        this.isActive = false;
        Object.values(visuals).forEach(v => { if(v) v.visible = false; });
    },

    update(delta) {},

    _setupUIListeners() {
         const ids = [
            'rotation-slider', 'scale-x-slider', 'scale-y-slider', 'shear-x-slider', 'shear-y-slider',
            'rotation-value', 'scale-x-value', 'scale-y-value', 'shear-x-value', 'shear-y-value', 
            'mat-00', 'mat-01', 'mat-10', 'mat-11', 'determinant-value'
        ];
        ids.forEach(id => uiElements[id] = document.getElementById(id));

        const addListener = (sliderId, valueId, stateKey) => {
            if (uiElements[sliderId] && uiElements[valueId]) {
                uiElements[sliderId].addEventListener('input', (e) => {
                    transformState[stateKey] = parseFloat(e.target.value);
                    uiElements[valueId].textContent = (stateKey === 'rotation') ? transformState[stateKey] : transformState[stateKey].toFixed(2);
                    this._applyTransform();
                });
            }
        };

        addListener('rotation-slider', 'rotation-value', 'rotation');
        addListener('scale-x-slider', 'scale-x-value', 'scaleX');
        addListener('scale-y-slider', 'scale-y-value', 'scaleY');
        // PENAMBAHAN: Pasang listener untuk slider shear
        addListener('shear-x-slider', 'shear-x-value', 'shearX');
        addListener('shear-y-slider', 'shear-y-value', 'shearY');
    },

    _applyTransform() {
       if (!visuals.transformGroup) return;

        const rot = transformState.rotation * (Math.PI / 180);
        const { scaleX, scaleY, shearX, shearY } = transformState; // Ambil nilai shear
        
        // PENAMBAHAN: Logika matriks sekarang mencakup shear
        // Urutan: Skala -> Geser (Shear) -> Rotasi
        const scaleMatrix = new THREE.Matrix4().makeScale(scaleX, scaleY, 1);
        const shearMatrix = new THREE.Matrix4().set(
            1,      shearX, 0, 0,
            shearY, 1,      0, 0,
            0,      0,      1, 0,
            0,      0,      0, 1
        );
        const rotationMatrix = new THREE.Matrix4().makeRotationZ(rot);

        // Gabungkan matriks
        const transformMatrix = new THREE.Matrix4()
            .multiply(rotationMatrix)
            .multiply(shearMatrix)
            .multiply(scaleMatrix);

        // Terapkan matriks pada grup
        visuals.transformGroup.matrix.copy(transformMatrix);
        visuals.transformGroup.matrixWorldNeedsUpdate = true;

        // Update nilai matriks di UI
        const me = transformMatrix.elements;
        if (uiElements['mat-00']) {
            uiElements['mat-00'].textContent = me[0].toFixed(2);
            uiElements['mat-01'].textContent = me[4].toFixed(2);
            uiElements['mat-10'].textContent = me[1].toFixed(2);
            uiElements['mat-11'].textContent = me[5].toFixed(2);
        }
        
        // Hitung dan tampilkan determinan
        const det = transformMatrix.determinant();
        if (uiElements['determinant-value']) {
            uiElements['determinant-value'].textContent = det.toFixed(2);
        }

        if (visuals.transformedSquare) {
            visuals.transformedSquare.material.color.set(det < 0 ? 0xff4136 : 0xFFFFFF);
        }
    }
};