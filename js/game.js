/**
 * Main Game class - handles scene setup, game loop, and state management
 */

class Game {
    constructor() {
        // Three.js core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Loaders
        this.loadingManager = null;
        this.gltfLoader = null;
        
        // Game objects
        this.player = null;
        this.level = null;
        
        // Game state
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            isLoading: true,
            currentLevel: 1,
            score: 0,
            coins: 0,
            lives: 3,
            assetsLoaded: 0,
            totalAssets: 0
        };
        
        // Assets to preload
        this.requiredAssets = [
            // Platforms
            'assets/models/platforms/block-grass.glb',
            'assets/models/platforms/block-grass-large.glb',
            'assets/models/platforms/block-grass-corner.glb',
            'assets/models/platforms/block-grass-curve.glb',
            'assets/models/platforms/platform.glb',
            'assets/models/platforms/platform-ramp.glb',
            
            // Collectibles
            'assets/models/collectibles/coin-gold.glb',
            'assets/models/collectibles/coin-silver.glb',
            'assets/models/collectibles/coin-bronze.glb',
            'assets/models/collectibles/heart.glb',
            'assets/models/collectibles/jewel.glb',
            'assets/models/collectibles/key.glb',
            
            // Environment
            'assets/models/environment/tree.glb',
            'assets/models/environment/tree-pine.glb',
            'assets/models/environment/rocks.glb',
            'assets/models/environment/grass.glb',
            'assets/models/environment/flowers.glb',
            
            // Interactive
            'assets/models/interactive/crate.glb',
            'assets/models/interactive/chest.glb',
            'assets/models/interactive/button-round.glb',
            'assets/models/interactive/door-rotate.glb',
            'assets/models/interactive/lever.glb',
            'assets/models/interactive/flag.glb',
            
            // Hazards
            'assets/models/hazards/spike-block.glb',
            'assets/models/hazards/saw.glb',
            'assets/models/hazards/trap-spikes.glb',
            'assets/models/hazards/bomb.glb',
            
            // Structures
            'assets/models/structures/fence-low-straight.glb',
            'assets/models/structures/ladder.glb',
            'assets/models/structures/poles.glb'
        ];
        
        // Animation frame ID
        this.animationId = null;
    }
    
    async init() {
        console.log('Initializing 3D Platformer...');
        
        try {
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupLighting();
            this.setupLoading();
            
            // Load assets
            await this.loadAssets();
            
            // Initialize game objects
            this.player = new Player(this.scene);
            this.level = new Level(this.scene, this.gltfLoader);
            
            // Setup game
            this.setupInput();
            this.setupUI();
            
            // Load first level
            await this.loadLevel(1);
            
            // Start game
            this.startGame();
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load game. Please refresh and try again.');
        }
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 10, 15);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        
        // Shadow camera settings
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        
        this.scene.add(directionalLight);
        
        // Additional fill light
        const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
        fillLight.position.set(-30, 20, -30);
        this.scene.add(fillLight);
    }
    
    setupLoading() {
        this.loadingManager = new THREE.LoadingManager();
        this.gltfLoader = new THREE.GLTFLoader(this.loadingManager);
        
        this.gameState.totalAssets = this.requiredAssets.length;
        
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            Utils.updateLoadingProgress(progress);
        };
        
        this.loadingManager.onLoad = () => {
            console.log('All assets loaded');
            this.gameState.isLoading = false;
        };
        
        this.loadingManager.onError = (url) => {
            console.warn(`Failed to load: ${url}`);
        };
    }
    
    async loadAssets() {
        console.log(`Loading ${this.requiredAssets.length} assets...`);
        
        const loadPromises = this.requiredAssets.map(assetPath => {
            return Utils.loadModel(assetPath, this.gltfLoader).catch(error => {
                console.warn(`Asset load failed: ${assetPath}`, error);
                return null; // Continue loading other assets
            });
        });
        
        await Promise.allSettled(loadPromises);
        console.log('Asset loading complete');
    }
    
    setupInput() {
        // Game controls
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyR':
                    this.restartLevel();
                    break;
                case 'KeyN':
                    this.nextLevel();
                    break;
                case 'KeyP':
                case 'Escape':
                    this.togglePause();
                    break;
                case 'KeyM':
                    this.toggleMusic();
                    break;
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    setupUI() {
        this.updateUI();
        Utils.showGameUI();
    }
    
    async loadLevel(levelNumber) {
        console.log(`Loading level ${levelNumber}...`);
        
        try {
            const success = await this.level.loadLevel(levelNumber);
            
            if (success) {
                this.gameState.currentLevel = levelNumber;
                
                // Reset player
                const spawnPos = this.level.getPlayerSpawnPosition();
                this.player.reset(spawnPos);
                
                // Reset game state for new level
                this.gameState.coins = 0;
                
                this.updateUI();
                
                console.log(`Level ${levelNumber} loaded successfully`);
                return true;
            } else {
                throw new Error(`Failed to load level ${levelNumber}`);
            }
            
        } catch (error) {
            console.error(`Error loading level ${levelNumber}:`, error);
            this.showError(`Failed to load level ${levelNumber}`);
            return false;
        }
    }
    
    startGame() {
        this.gameState.isPlaying = true;
        this.gameState.isPaused = false;
        
        // Start game loop
        this.animate();
        
        console.log('Game started!');
    }
    
    animate() {
        if (!this.gameState.isPlaying) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (!this.gameState.isPaused) {
            this.update();
            this.render();
        }
    }
    
    update() {
        if (!this.player || !this.level) return;
        
        // Update player
        this.player.update(
            this.level.getPlatforms(),
            this.level.getCollectibles(),
            this.level.getHazards()
        );
        
        // Update camera
        this.player.updateCamera(this.camera);
        
        // Update level
        this.level.update();
        
        // Check level completion
        if (this.level.checkLevelComplete()) {
            this.levelComplete();
        }
        
        // Update UI
        this.updateUI();
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    levelComplete() {
        const nextLevel = this.gameState.currentLevel + 1;
        
        // Check if there's a next level
        if (nextLevel <= 3) {
            Utils.showMessage(
                'Level Complete!',
                `Great job! Ready for level ${nextLevel}?`,
                'Next Level',
                () => {
                    Utils.hideMessage();
                    this.loadLevel(nextLevel);
                }
            );
        } else {
            // Game complete
            Utils.showMessage(
                'Game Complete!',
                `Congratulations! You've completed all levels!\\nFinal Score: ${this.gameState.score}`,
                'Play Again',
                () => {
                    Utils.hideMessage();
                    this.loadLevel(1);
                    this.gameState.score = 0;
                }
            );
        }
    }
    
    playerDied() {
        if (this.gameState.lives <= 0) {
            // Game over
            Utils.showMessage(
                'Game Over',
                `Better luck next time!\\nFinal Score: ${this.gameState.score}`,
                'Restart',
                () => {
                    Utils.hideMessage();
                    this.restartGame();
                }
            );
        } else {
            // Respawn player
            this.restartLevel();
        }
    }
    
    restartLevel() {
        console.log('Restarting level...');
        
        // Reset player
        const spawnPos = this.level.getPlayerSpawnPosition();
        this.player.reset(spawnPos);
        this.player.lives = this.gameState.lives;
        
        // Reset level collectibles
        this.level.resetCollectibles();
        
        // Reset coins count
        this.gameState.coins = 0;
        
        this.updateUI();
    }
    
    restartGame() {
        // Reset game state
        this.gameState.score = 0;
        this.gameState.coins = 0;
        this.gameState.lives = 3;
        this.gameState.currentLevel = 1;
        
        // Reset player
        this.player.lives = 3;
        this.player.isAlive = true;
        
        // Load first level
        this.loadLevel(1);
    }
    
    nextLevel() {
        const nextLevel = this.gameState.currentLevel + 1;
        if (nextLevel <= 3) {
            this.loadLevel(nextLevel);
        }
    }
    
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        Utils.togglePauseMenu(this.gameState.isPaused);
        
        if (this.gameState.isPaused) {
            console.log('Game paused');
        } else {
            console.log('Game resumed');
        }
    }
    
    resumeGame() {
        this.gameState.isPaused = false;
        Utils.togglePauseMenu(false);
    }
    
    addScore(points) {
        this.gameState.score += points;
    }
    
    addCoin() {
        this.gameState.coins++;
    }
    
    updateUI() {
        Utils.updateUI('score', this.gameState.score);
        Utils.updateUI('lives', this.player ? this.player.lives : this.gameState.lives);
        Utils.updateUI('coins', this.gameState.coins);
        Utils.updateUI('currentLevel', this.gameState.currentLevel);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    showError(message) {
        Utils.showMessage(
            'Error',
            message,
            'OK',
            () => Utils.hideMessage()
        );
    }
    
    hideMessage() {
        Utils.hideMessage();
    }
    
    toggleMusic() {
        // Placeholder for music toggle
        console.log('Music toggle (not implemented - no audio files)');
    }
    
    // Cleanup
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('resize', this.onWindowResize);
    }
}

// Create global game instance
const game = new Game();