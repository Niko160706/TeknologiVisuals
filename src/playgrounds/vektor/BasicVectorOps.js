let world, scene, dragControls;
let vectors = []; 
let resultantVector = null;
const snapThreshold = 0.4;
let animationState = {
    isAnimating: false,
    isSummed: false,
    progress: 0,
    targets: [] 
};

export const BasicVectorOps = {
    panelId: 'vector-ops-panel',
    actionBarId: 'vector-action-bar',
    isActive: false,

    init(worldContext) {
        world = worldContext; 
        scene = world.scene;
        this.addEventListeners();
    },
    
    activate() {
        this.isActive = true;
        if (vectors.length === 0) {
            this.addVector(new THREE.Vector3(5, 5, 0), 0xffff00);
        }
        vectors.forEach(v => { v.arrow.visible = true; v.handle.visible = true; });
        if (resultantVector) resultantVector.visible = true;
        
        this.setupDragControls();
        this.updateInfo();
    },

    deactivate() {
        this.isActive = false;
        vectors.forEach(v => { v.arrow.visible = false; v.handle.visible = false; });
        if (resultantVector) resultantVector.visible = false;
        if (dragControls) dragControls.enabled = false;
    },

    update(delta) {
        if (animationState.isAnimating) {
            animationState.progress = Math.min(animationState.progress + delta * 1.5, 1);
            for (let i = 1; i < vectors.length; i++) {
                if (animationState.targets[i] && vectors[i]) {
                    vectors[i].arrow.position.lerp(animationState.targets[i], animationState.progress);
                }
            }
            if (animationState.progress >= 1) {
                animationState.isAnimating = false;
            }
        }
    },

    addVector(position, color) {
        const origin = new THREE.Vector3(0, 0, 0);
        const arrow = new THREE.ArrowHelper(position.clone().normalize(), origin, position.length(), color, 0.5, 0.25);
        const handleGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const handleMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.copy(position);
        
        vectors.push({ arrow, handle });
        scene.add(arrow, handle);
    },

    setupDragControls() {
        if (dragControls) dragControls.dispose();
        const draggableObjects = vectors.map(v => v.handle);
        dragControls = new THREE.DragControls(draggableObjects, world.camera, world.renderer.domElement);
        if(dragControls) dragControls.enabled = true;
        
        dragControls.addEventListener('dragstart', (event) => {
            world.controls.enabled = false;
            event.object.material.opacity = 1.0;
            if (animationState.isSummed) {
                this.toggleSummation();
            }
        });

        // PERBAIKAN LOGIKA DI SINI
        dragControls.addEventListener('drag', (event) => {
            const draggedHandle = event.object;

            // 1. Logika Magnetik
            const raw = draggedHandle.position.clone();
            const snapped = raw.clone().round();
            if (raw.distanceTo(snapped) < snapThreshold) {
                draggedHandle.position.copy(snapped);
            }
            
            // 2. Cari objek vektor yang sesuai
            const vectorObject = vectors.find(v => v.handle === draggedHandle);
            if (vectorObject) {
                // 3. Update panahnya secara eksplisit
                const pos = vectorObject.handle.position;
                vectorObject.arrow.setLength(pos.length(), 0.5, 0.25);
                vectorObject.arrow.setDirection(pos.clone().normalize());
            }
            
            // 4. Update UI dan Resultan
            if (animationState.isSummed) {
                this.updateResultant();
            }
            this.updateInfo();
        });

        dragControls.addEventListener('dragend', (event) => {
            world.controls.enabled = true;
            event.object.material.opacity = 0.7;
        });
    },

    addEventListeners() {
        const actionBar = document.getElementById('vector-action-bar');
        if (!actionBar) return;
        const addBtn = actionBar.querySelector('#add-vector-btn');
        const sumBtn = actionBar.querySelector('#sum-vectors-btn');
        const deleteBtn = actionBar.querySelector('#delete-vector-btn');
        const toggleBtn = actionBar.querySelector('#mode-toggle-btn');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (vectors.length < 3) {
                    const colors = [0xffff00, 0x00ffff, 0xff00ff];
                    this.addVector(new THREE.Vector3(-3 * vectors.length, 4, 0), colors[vectors.length]);
                    this.setupDragControls();
                    this.updateButtonVisibility();
                    this.updateInfo();
                }
            });
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteLastVector());
        }
        if (sumBtn) sumBtn.addEventListener('click', () => this.toggleSummation());
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleMode());
    },

    // FUNGSI INI DIPERBAIKI SECARA KRITIS
    deleteLastVector() {
        if (vectors.length > 1) {
            const lastVector = vectors.pop();
            
            // Hapus dari scene
            scene.remove(lastVector.arrow);
            scene.remove(lastVector.handle);
            
            // Hapus dari memori dengan cara yang benar
            lastVector.arrow.line.geometry.dispose();
            lastVector.arrow.line.material.dispose();
            lastVector.arrow.cone.geometry.dispose();
            lastVector.arrow.cone.material.dispose();
            lastVector.handle.geometry.dispose();
            lastVector.handle.material.dispose();
            
            this.setupDragControls();
            this.updateButtonVisibility(); // Baris ini sekarang akan berjalan
            this.updateInfo();
        }
    },
    
    // FUNGSI BARU UNTUK MENGELOLA TOMBOL
    updateButtonVisibility() {
        const addBtn = document.getElementById('add-vector-btn');
        const sumBtn = document.getElementById('sum-vectors-btn');
        const deleteBtn = document.getElementById('delete-vector-btn');

        if (vectors.length >= 3) addBtn.style.display = 'none';
        else addBtn.style.display = 'inline-block';
        
        if (vectors.length >= 2) {
            sumBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'inline-block';
        } else {
            sumBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
        }
    },


    toggleSummation() {
        if (vectors.length < 2) return;
        const sumButton = document.getElementById('sum-vectors-btn');
        animationState.isSummed = !animationState.isSummed;
        if (animationState.isSummed) {
            sumButton.textContent = 'Lepaskan Vektor';
            this.updateResultant(true);
        } else {
            if (resultantVector) {
                scene.remove(resultantVector);
                resultantVector = null;
            }
            animationState.targets = vectors.map(() => new THREE.Vector3(0,0,0));
            animationState.isAnimating = true;
            animationState.progress = 0;
            sumButton.textContent = 'Jumlahkan Vektor';
        }
        this.updateInfo();
    },

    updateResultant(animate = false) {
        if (vectors.length < 2) return;
        const totalPosition = new THREE.Vector3();
        vectors.forEach(v => totalPosition.add(v.handle.position));
        if (resultantVector) {
            resultantVector.position.set(0,0,0);
            resultantVector.setLength(totalPosition.length(), 1, 0.5);
            resultantVector.setDirection(totalPosition.clone().normalize());
        } else {
            resultantVector = new THREE.ArrowHelper(totalPosition.clone().normalize(), new THREE.Vector3(0,0,0), totalPosition.length(), 0xFAFAFA, 1, 0.5);
            scene.add(resultantVector);
        }
        if (animate) {
            const cumulativePosition = new THREE.Vector3();
            animationState.targets = [null];
            for (let i = 1; i < vectors.length; i++) {
                cumulativePosition.add(vectors[i-1].handle.position);
                animationState.targets.push(cumulativePosition.clone());
            }
            animationState.isAnimating = true;
            animationState.progress = 0;
        } else {
            const cumulativePosition = new THREE.Vector3();
            for (let i = 1; i < vectors.length; i++) {
                cumulativePosition.add(vectors[i-1].handle.position);
                vectors[i].arrow.position.copy(cumulativePosition);
            }
        }
    },
      toggleMode() {
        if (resultantVector) {
            scene.remove(resultantVector);
            resultantVector = null;
        }
        if (vectors.length > 1) {
            vectors[1].arrow.position.set(0,0,0);
            document.getElementById('sum-vectors-btn').textContent = 'Jumlahkan Vektor';
            animationState.isSummed = false;
        }

        const btn = document.getElementById('mode-toggle-btn');
        if (world.camera.isPerspectiveCamera) {
            world.switchTo2D();
            if(btn) btn.textContent = 'Switch to 3D';
        } else {
            world.switchTo3D();
            if(btn) btn.textContent = 'Switch to 2D';
        }
        
        this.setupDragControls();
        this.updateInfo();
    },
        
   // FUNGSI INI DIPERBAIKI (MENGHAPUS DUPLIKASI KODE)
    updateInfo() {
        const infoPanel = document.getElementById('vector-ops-panel');
        if (!infoPanel) return;
        infoPanel.innerHTML = '';

        vectors.forEach((v, index) => {
            const p = v.handle.position;
            const color = `#${v.handle.material.color.getHexString()}`;
            const id = index + 1;
            const columnHTML = `
                <div class="vector-column" id="vector-${id}-info">
                    <h4 style="color: ${color};">Vektor ${id}</h4>
                    <div class="vector-values">
                        <span>${p.x.toFixed(2)}</span>
                        <span>${p.y.toFixed(2)}</span>
                        <span>${world.camera.isPerspectiveCamera ? p.z.toFixed(2) : '–'}</span>
                    </div>
                    <div class="vector-magnitude">|v| = <span>${p.length().toFixed(2)}</span></div>
                </div>
            `;
            infoPanel.innerHTML += columnHTML;
        });

        if (resultantVector) {
            const resultPos = new THREE.Vector3();
            // Hanya jumlahkan 2 vektor pertama untuk kejelasan
            if(vectors.length >= 2) resultPos.add(vectors[0].handle.position).add(vectors[1].handle.position);
            const color = `#${resultantVector.line.material.color.getHexString()}`;
            const resultantColumnHTML = `
                <div class="vector-column">
                    <h4 style="color: ${color};">Hasil</h4>
                    <div class="vector-values">
                        <span>${resultPos.x.toFixed(2)}</span>
                        <span>${resultPos.y.toFixed(2)}</span>
                        <span>${world.camera.isPerspectiveCamera ? resultPos.z.toFixed(2) : '–'}</span>
                    </div>
                    <div class="vector-magnitude">|R| = <span>${resultPos.length().toFixed(2)}</span></div>
                </div>
            `;
            infoPanel.innerHTML += resultantColumnHTML;
        }
    }
};













