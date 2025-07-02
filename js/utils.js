/**
 * Utility functions for the 3D Platformer game
 */

const Utils = {
    // Asset management
    loadedModels: {},
    
    /**
     * Load a GLB model from the assets folder
     * @param {string} path - Path to the GLB file
     * @param {THREE.GLTFLoader} loader - GLTF loader instance
     * @returns {Promise} Promise that resolves with the loaded model
     */
    loadModel(path, loader) {
        return new Promise((resolve, reject) => {
            loader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;
                    // Enable shadows for all meshes in the model
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    this.loadedModels[path] = model;
                    resolve(model);
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load model: ${path}`, error);
                    reject(error);
                }
            );
        });
    },

    /**
     * Clone a loaded model
     * @param {string} path - Path to the loaded model
     * @returns {THREE.Object3D} Cloned model
     */
    cloneModel(path) {
        if (!this.loadedModels[path]) {
            console.warn(`Model not loaded: ${path}`);
            return null;
        }
        return this.loadedModels[path].clone();
    },

    /**
     * Create a basic geometric object as fallback
     * @param {string} type - Type of geometry (box, sphere, cylinder)
     * @param {number} color - Hex color
     * @param {Array} size - Size parameters [width, height, depth]
     * @returns {THREE.Mesh} Created mesh
     */
    createFallbackGeometry(type = 'box', color = 0x4CAF50, size = [1, 1, 1]) {
        let geometry;
        
        switch(type) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(size[0], 16, 16);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(size[0], size[1], size[2], 16);
                break;
            case 'box':
            default:
                geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
                break;
        }
        
        const material = new THREE.MeshLambertMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    },

    /**
     * Calculate distance between two 3D points
     * @param {THREE.Vector3} pos1 - First position
     * @param {THREE.Vector3} pos2 - Second position
     * @returns {number} Distance
     */
    distance(pos1, pos2) {
        return pos1.distanceTo(pos2);
    },

    /**
     * Check if two objects are colliding (simple sphere collision)
     * @param {THREE.Object3D} obj1 - First object
     * @param {THREE.Object3D} obj2 - Second object
     * @param {number} threshold - Collision threshold
     * @returns {boolean} True if colliding
     */
    isColliding(obj1, obj2, threshold = 2) {
        return this.distance(obj1.position, obj2.position) < threshold;
    },

    /**
     * Check if player is on a platform
     * @param {THREE.Object3D} player - Player object
     * @param {THREE.Object3D} platform - Platform object
     * @param {number} threshold - Distance threshold
     * @returns {boolean} True if player is on platform
     */
    isOnPlatform(player, platform, threshold = 3) {
        const horizontalDistance = Math.sqrt(
            Math.pow(player.position.x - platform.position.x, 2) +
            Math.pow(player.position.z - platform.position.z, 2)
        );
        
        const verticalDistance = player.position.y - platform.position.y;
        
        return horizontalDistance < threshold && 
               verticalDistance > 0.5 && 
               verticalDistance < 3;
    },

    /**
     * Interpolate between two values
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} factor - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees
     * @returns {number} Radians
     */
    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    /**
     * Convert radians to degrees
     * @param {number} radians - Radians
     * @returns {number} Degrees
     */
    radToDeg(radians) {
        return radians * (180 / Math.PI);
    },

    /**
     * Generate a random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * Get a random element from an array
     * @param {Array} array - Array to choose from
     * @returns {*} Random element
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Animation helper for floating/bobbing objects
     * @param {THREE.Object3D} object - Object to animate
     * @param {number} speed - Animation speed
     * @param {number} amplitude - Animation amplitude
     * @param {number} offset - Time offset
     */
    animateFloat(object, speed = 0.005, amplitude = 0.3, offset = 0) {
        const time = Date.now() * speed + offset;
        object.position.y += Math.sin(time) * amplitude * 0.016; // 60fps approximation
    },

    /**
     * Animation helper for rotating objects
     * @param {THREE.Object3D} object - Object to rotate
     * @param {number} speedX - X rotation speed
     * @param {number} speedY - Y rotation speed
     * @param {number} speedZ - Z rotation speed
     */
    animateRotate(object, speedX = 0, speedY = 0.02, speedZ = 0) {
        object.rotation.x += speedX;
        object.rotation.y += speedY;
        object.rotation.z += speedZ;
    },

    /**
     * Update UI element text content
     * @param {string} id - Element ID
     * @param {string|number} value - New value
     */
    updateUI(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    },

    /**
     * Show a game message
     * @param {string} title - Message title
     * @param {string} text - Message text
     * @param {string} buttonText - Button text
     * @param {Function} callback - Button callback
     */
    showMessage(title, text, buttonText = 'Continue', callback = null) {
        const messageDiv = document.getElementById('gameMessage');
        const titleElement = document.getElementById('messageTitle');
        const textElement = document.getElementById('messageText');
        const buttonElement = document.getElementById('messageButton');

        titleElement.textContent = title;
        textElement.textContent = text;
        buttonElement.textContent = buttonText;
        
        if (callback) {
            buttonElement.onclick = callback;
        }

        messageDiv.classList.remove('hidden');
    },

    /**
     * Hide the game message
     */
    hideMessage() {
        const messageDiv = document.getElementById('gameMessage');
        messageDiv.classList.add('hidden');
    },

    /**
     * Show/hide pause menu
     * @param {boolean} show - Whether to show the menu
     */
    togglePauseMenu(show) {
        const pauseMenu = document.getElementById('pauseMenu');
        if (show) {
            pauseMenu.classList.remove('hidden');
        } else {
            pauseMenu.classList.add('hidden');
        }
    },

    /**
     * Update loading progress
     * @param {number} progress - Progress percentage (0-100)
     */
    updateLoadingProgress(progress) {
        const fillElement = document.getElementById('loadingFill');
        const percentElement = document.getElementById('loadingPercent');
        
        if (fillElement) {
            fillElement.style.width = progress + '%';
        }
        if (percentElement) {
            percentElement.textContent = Math.round(progress) + '%';
        }
    },

    /**
     * Hide loading screen and show game UI
     */
    showGameUI() {
        const loadingDiv = document.getElementById('loading');
        const gameUI = document.getElementById('gameUI');
        
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
        if (gameUI) {
            gameUI.style.display = 'block';
            gameUI.classList.add('fade-in');
        }
    },

    /**
     * Simple particle effect for collectibles
     * @param {THREE.Scene} scene - Three.js scene
     * @param {THREE.Vector3} position - Position to create particles
     * @param {number} color - Particle color
     */
    createParticleEffect(scene, position, color = 0xFFD700) {
        const particles = [];
        const particleCount = 10;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({ color })
            );
            
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            particle.life = 1.0;
            
            particles.push(particle);
            scene.add(particle);
        }
        
        // Animate particles
        const animateParticles = () => {
            particles.forEach((particle, index) => {
                particle.position.add(particle.velocity);
                particle.velocity.y -= 0.01; // Gravity
                particle.life -= 0.02;
                particle.material.opacity = particle.life;
                
                if (particle.life <= 0) {
                    scene.remove(particle);
                    particles.splice(index, 1);
                }
            });
            
            if (particles.length > 0) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    },

    /**
     * Load a JSON file
     * @param {string} url - URL to the JSON file
     * @returns {Promise} Promise that resolves with the JSON data
     */
    async loadJSON(url) {
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error(`Failed to load JSON: ${url}`, error);
            throw error;
        }
    }
};