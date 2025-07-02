/**
 * Player class - handles player movement, physics, and interactions
 */

class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        
        // Physics properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.position = new THREE.Vector3(0, 5, 0);
        this.rotation = 0;
        
        // Movement properties
        this.speed = 0.15;
        this.jumpForce = 0.4;
        this.gravity = -0.02;
        
        // State
        this.isGrounded = false;
        this.isJumping = false;
        this.lives = 3;
        this.isAlive = true;
        
        // Input state
        this.keys = {
            left: false,
            right: false,
            forward: false,
            backward: false,
            space: false,
            shift: false
        };
        
        // Camera reference (will be set by game)
        this.camera = null;
        
        this.init();
        this.setupInput();
    }
    
    init() {
        // Create player geometry (capsule-like character)
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x4CAF50,
            transparent: true,
            opacity: 0.9
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add a simple face indicator
        const faceGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const faceMaterial = new THREE.MeshBasicMaterial({ color: 0x2196F3 });
        this.face = new THREE.Mesh(faceGeometry, faceMaterial);
        this.face.position.set(0, 0.3, 0.4);
        this.mesh.add(this.face);
        
        this.scene.add(this.mesh);
    }
    
    setupInput() {
        // Keyboard event listeners
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // Prevent default behavior for game keys
        document.addEventListener('keydown', (event) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
                event.preventDefault();
            }
        });
    }
    
    handleKeyDown(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.space = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.shift = true;
                break;
        }
    }
    
    handleKeyUp(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.space = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.shift = false;
                break;
        }
    }
    
    update(platforms = [], collectibles = [], hazards = []) {
        if (!this.isAlive) return;
        
        this.updateMovement();
        this.updatePhysics();
        this.checkPlatformCollisions(platforms);
        this.checkCollectibleCollisions(collectibles);
        this.checkHazardCollisions(hazards);
        this.checkBoundaries();
        this.updateMesh();
    }
    
    updateMovement() {
        const currentSpeed = this.keys.shift ? this.speed * 1.5 : this.speed;
        
        // Horizontal movement
        if (this.keys.left) {
            this.velocity.x = -currentSpeed;
        } else if (this.keys.right) {
            this.velocity.x = currentSpeed;
        } else {
            this.velocity.x *= 0.8; // Friction
        }
        
        // Forward/backward movement
        if (this.keys.forward) {
            this.velocity.z = -currentSpeed;
        } else if (this.keys.backward) {
            this.velocity.z = currentSpeed;
        } else {
            this.velocity.z *= 0.8; // Friction
        }
        
        // Jumping
        if (this.keys.space && this.isGrounded && !this.isJumping) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.isJumping = true;
        }
        
        // Limit horizontal speed
        const maxSpeed = currentSpeed * 1.2;
        this.velocity.x = Utils.clamp(this.velocity.x, -maxSpeed, maxSpeed);
        this.velocity.z = Utils.clamp(this.velocity.z, -maxSpeed, maxSpeed);
    }
    
    updatePhysics() {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity;
        }
        
        // Update position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;
        
        // Ground collision (basic floor)
        if (this.position.y <= 1) {
            this.position.y = 1;
            this.velocity.y = 0;
            this.isGrounded = true;
            this.isJumping = false;
        }
    }
    
    checkPlatformCollisions(platforms) {
        let onPlatform = false;
        
        platforms.forEach(platform => {
            if (Utils.isOnPlatform(this, platform)) {
                // Check if player is falling onto the platform
                if (this.velocity.y <= 0) {
                    this.position.y = platform.position.y + 2;
                    this.velocity.y = 0;
                    this.isGrounded = true;
                    this.isJumping = false;
                    onPlatform = true;
                }
            }
        });
        
        // If not on any platform and above ground, player is in air
        if (!onPlatform && this.position.y > 1.1) {
            this.isGrounded = false;
        }
    }
    
    checkCollectibleCollisions(collectibles) {
        collectibles.forEach(collectible => {
            if (!collectible.userData.collected && Utils.isColliding(this, collectible, 1.5)) {
                this.collectItem(collectible);
            }
        });
    }
    
    checkHazardCollisions(hazards) {
        hazards.forEach(hazard => {
            if (Utils.isColliding(this, hazard, 1.5)) {
                this.takeDamage();
            }
        });
    }
    
    collectItem(collectible) {
        collectible.userData.collected = true;
        collectible.visible = false;
        
        // Create particle effect
        Utils.createParticleEffect(this.scene, collectible.position.clone(), 0xFFD700);
        
        // Update game state based on item type
        const type = collectible.userData.type || 'coin';
        
        switch(type) {
            case 'coin-gold':
                game.addScore(100);
                game.addCoin();
                break;
            case 'coin-silver':
                game.addScore(50);
                game.addCoin();
                break;
            case 'coin-bronze':
                game.addScore(25);
                game.addCoin();
                break;
            case 'heart':
                this.addLife();
                game.addScore(200);
                break;
            case 'jewel':
                game.addScore(500);
                break;
            case 'key':
                game.addScore(300);
                // Key collection could unlock doors in future
                break;
            default:
                game.addScore(50);
                game.addCoin();
                break;
        }
    }
    
    takeDamage() {
        if (!this.isAlive) return;
        
        this.lives--;
        Utils.updateUI('lives', this.lives);
        
        // Create damage effect
        Utils.createParticleEffect(this.scene, this.position.clone(), 0xFF0000);
        
        // Knockback effect
        this.velocity.y = 0.2;
        this.velocity.x *= -2;
        this.velocity.z *= -2;
        
        if (this.lives <= 0) {
            this.die();
        } else {
            // Temporary invincibility and visual feedback
            this.mesh.material.color.setHex(0xFF0000);
            setTimeout(() => {
                this.mesh.material.color.setHex(0x4CAF50);
            }, 500);
        }
    }
    
    addLife() {
        this.lives++;
        Utils.updateUI('lives', this.lives);
    }
    
    die() {
        this.isAlive = false;
        this.mesh.material.color.setHex(0x666666);
        this.mesh.material.opacity = 0.5;
        
        // Game over handling
        setTimeout(() => {
            game.playerDied();
        }, 1000);
    }
    
    checkBoundaries() {
        // Fall off the world
        if (this.position.y < -20) {
            this.takeDamage();
            this.respawn();
        }
        
        // Optional: limit world boundaries
        const maxDistance = 100;
        this.position.x = Utils.clamp(this.position.x, -maxDistance, maxDistance);
        this.position.z = Utils.clamp(this.position.z, -maxDistance, maxDistance);
    }
    
    respawn() {
        // Reset to spawn position
        this.position.set(0, 5, 0);
        this.velocity.set(0, 0, 0);
        this.isGrounded = false;
        this.isJumping = false;
    }
    
    updateMesh() {
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            
            // Rotate player based on movement direction
            if (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01) {
                const angle = Math.atan2(this.velocity.x, this.velocity.z);
                this.mesh.rotation.y = Utils.lerp(this.mesh.rotation.y, angle, 0.1);
            }
            
            // Slight bobbing animation when moving
            if (this.isGrounded && (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01)) {
                this.mesh.position.y += Math.sin(Date.now() * 0.01) * 0.05;
            }
        }
    }
    
    updateCamera(camera) {
        if (!camera) return;
        
        // Smooth camera follow
        const idealCameraPosition = new THREE.Vector3(
            this.position.x,
            this.position.y + 8,
            this.position.z + 12
        );
        
        camera.position.lerp(idealCameraPosition, 0.05);
        
        // Look slightly ahead of the player
        const lookAtPosition = new THREE.Vector3(
            this.position.x + this.velocity.x * 2,
            this.position.y + 1,
            this.position.z + this.velocity.z * 2
        );
        
        camera.lookAt(lookAtPosition);
    }
    
    // Reset player for new level
    reset(spawnPosition = new THREE.Vector3(0, 5, 0)) {
        this.position.copy(spawnPosition);
        this.velocity.set(0, 0, 0);
        this.isGrounded = false;
        this.isJumping = false;
        this.isAlive = true;
        
        if (this.mesh) {
            this.mesh.material.color.setHex(0x4CAF50);
            this.mesh.material.opacity = 0.9;
            this.mesh.position.copy(this.position);
        }
    }
    
    // Get player status for game state
    getStatus() {
        return {
            position: this.position.clone(),
            lives: this.lives,
            isAlive: this.isAlive,
            isGrounded: this.isGrounded
        };
    }
}