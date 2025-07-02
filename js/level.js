/**
 * Level class - handles level loading, object creation, and management
 */

class Level {
    constructor(scene, gltfLoader) {
        this.scene = scene;
        this.gltfLoader = gltfLoader;
        
        // Level objects
        this.platforms = [];
        this.collectibles = [];
        this.hazards = [];
        this.environment = [];
        this.interactive = [];
        
        // Level data
        this.currentLevel = 1;
        this.levelData = null;
        this.totalCoins = 0;
        
        // Asset paths
        this.assetPaths = {
            platforms: {
                'grass': 'assets/models/platforms/block-grass.glb',
                'grass-large': 'assets/models/platforms/block-grass-large.glb',
                'grass-corner': 'assets/models/platforms/block-grass-corner.glb',
                'grass-curve': 'assets/models/platforms/block-grass-curve.glb',
                'platform': 'assets/models/platforms/platform.glb',
                'platform-ramp': 'assets/models/platforms/platform-ramp.glb'
            },
            collectibles: {
                'coin-gold': 'assets/models/collectibles/coin-gold.glb',
                'coin-silver': 'assets/models/collectibles/coin-silver.glb',
                'coin-bronze': 'assets/models/collectibles/coin-bronze.glb',
                'heart': 'assets/models/collectibles/heart.glb',
                'jewel': 'assets/models/collectibles/jewel.glb',
                'key': 'assets/models/collectibles/key.glb'
            },
            environment: {
                'tree': 'assets/models/environment/tree.glb',
                'tree-pine': 'assets/models/environment/tree-pine.glb',
                'rocks': 'assets/models/environment/rocks.glb',
                'grass': 'assets/models/environment/grass.glb',
                'flowers': 'assets/models/environment/flowers.glb'
            },
            interactive: {
                'crate': 'assets/models/interactive/crate.glb',
                'chest': 'assets/models/interactive/chest.glb',
                'button': 'assets/models/interactive/button-round.glb',
                'door': 'assets/models/interactive/door-rotate.glb',
                'lever': 'assets/models/interactive/lever.glb',
                'flag': 'assets/models/interactive/flag.glb'
            },
            hazards: {
                'spike': 'assets/models/hazards/spike-block.glb',
                'saw': 'assets/models/hazards/saw.glb',
                'trap': 'assets/models/hazards/trap-spikes.glb',
                'bomb': 'assets/models/hazards/bomb.glb'
            },
            structures: {
                'fence': 'assets/models/structures/fence-low-straight.glb',
                'ladder': 'assets/models/structures/ladder.glb',
                'poles': 'assets/models/structures/poles.glb'
            }
        };
    }
    
    async loadLevel(levelNumber) {
        try {
            // Clear current level
            this.clearLevel();
            
            // Load level data
            this.levelData = await Utils.loadJSON(`levels/level${levelNumber}.json`);
            this.currentLevel = levelNumber;
            
            // Create level objects
            await this.createPlatforms();
            await this.createCollectibles();
            await this.createHazards();
            await this.createEnvironment();
            await this.createInteractive();
            
            // Count total coins for UI
            this.countTotalCoins();
            
            console.log(`Level ${levelNumber} loaded successfully`);
            return true;
            
        } catch (error) {
            console.error(`Failed to load level ${levelNumber}:`, error);
            return false;
        }
    }
    
    clearLevel() {
        // Remove all level objects from scene
        [...this.platforms, ...this.collectibles, ...this.hazards, 
         ...this.environment, ...this.interactive].forEach(obj => {
            this.scene.remove(obj);
        });
        
        // Clear arrays
        this.platforms = [];
        this.collectibles = [];
        this.hazards = [];
        this.environment = [];
        this.interactive = [];
        this.totalCoins = 0;
    }
    
    async createPlatforms() {
        if (!this.levelData.platforms) return;
        
        for (const platformData of this.levelData.platforms) {
            const platform = await this.createObject('platforms', platformData);
            if (platform) {
                this.platforms.push(platform);
                this.scene.add(platform);
            }
        }
    }
    
    async createCollectibles() {
        if (!this.levelData.collectibles) return;
        
        for (const collectibleData of this.levelData.collectibles) {
            const collectible = await this.createObject('collectibles', collectibleData);
            if (collectible) {
                collectible.userData = {
                    type: collectibleData.type,
                    collected: false,
                    originalPosition: collectible.position.clone()
                };
                this.collectibles.push(collectible);
                this.scene.add(collectible);
            }
        }
    }
    
    async createHazards() {
        if (!this.levelData.hazards) return;
        
        for (const hazardData of this.levelData.hazards) {
            const hazard = await this.createObject('hazards', hazardData);
            if (hazard) {
                hazard.userData = {
                    type: hazardData.type,
                    damage: hazardData.damage || 1
                };
                this.hazards.push(hazard);
                this.scene.add(hazard);
            }
        }
    }
    
    async createEnvironment() {
        if (!this.levelData.environment) return;
        
        for (const envData of this.levelData.environment) {
            const envObject = await this.createObject('environment', envData);
            if (envObject) {
                this.environment.push(envObject);
                this.scene.add(envObject);
            }
        }
    }
    
    async createInteractive() {
        if (!this.levelData.interactive) return;
        
        for (const interactiveData of this.levelData.interactive) {
            const interactive = await this.createObject('interactive', interactiveData);
            if (interactive) {
                interactive.userData = {
                    type: interactiveData.type,
                    action: interactiveData.action || 'none'
                };
                this.interactive.push(interactive);
                this.scene.add(interactive);
            }
        }
    }
    
    async createObject(category, objectData) {
        const assetPath = this.assetPaths[category][objectData.type];
        
        if (!assetPath) {
            console.warn(`Asset path not found for ${category}:${objectData.type}`);
            return this.createFallbackObject(objectData);
        }
        
        try {
            // Try to clone if already loaded
            let object = Utils.cloneModel(assetPath);
            
            // If not loaded, load it
            if (!object) {
                const loadedModel = await Utils.loadModel(assetPath, this.gltfLoader);
                object = loadedModel.clone();
            }
            
            // Apply transformations
            this.applyTransformations(object, objectData);
            
            return object;
            
        } catch (error) {
            console.warn(`Failed to load ${assetPath}, using fallback`);
            return this.createFallbackObject(objectData);
        }
    }
    
    createFallbackObject(objectData) {
        const size = objectData.scale ? 
            [objectData.scale.x || 1, objectData.scale.y || 1, objectData.scale.z || 1] : 
            [1, 1, 1];
            
        const color = this.getFallbackColor(objectData.type);
        const geometry = this.getFallbackGeometry(objectData.type);
        
        const object = Utils.createFallbackGeometry(geometry, color, size);
        this.applyTransformations(object, objectData);
        
        return object;
    }
    
    getFallbackColor(type) {
        const colorMap = {
            // Platforms
            'grass': 0x4CAF50,
            'platform': 0x9E9E9E,
            
            // Collectibles
            'coin-gold': 0xFFD700,
            'coin-silver': 0xC0C0C0,
            'coin-bronze': 0xCD7F32,
            'heart': 0xFF69B4,
            'jewel': 0x9C27B0,
            'key': 0xFFC107,
            
            // Hazards
            'spike': 0xFF5722,
            'saw': 0xF44336,
            'trap': 0xFF1744,
            'bomb': 0x000000,
            
            // Environment
            'tree': 0x2E7D32,
            'rocks': 0x5D4037,
            'grass': 0x4CAF50,
            'flowers': 0xE91E63
        };
        
        return colorMap[type] || 0x808080;
    }
    
    getFallbackGeometry(type) {
        const geometryMap = {
            'heart': 'sphere',
            'coin-gold': 'cylinder',
            'coin-silver': 'cylinder',
            'coin-bronze': 'cylinder',
            'tree': 'cylinder',
            'saw': 'cylinder'
        };
        
        return geometryMap[type] || 'box';
    }
    
    applyTransformations(object, objectData) {
        // Position
        if (objectData.position) {
            object.position.set(
                objectData.position.x || 0,
                objectData.position.y || 0,
                objectData.position.z || 0
            );
        }
        
        // Rotation
        if (objectData.rotation) {
            object.rotation.set(
                Utils.degToRad(objectData.rotation.x || 0),
                Utils.degToRad(objectData.rotation.y || 0),
                Utils.degToRad(objectData.rotation.z || 0)
            );
        }
        
        // Scale
        if (objectData.scale) {
            object.scale.set(
                objectData.scale.x || 1,
                objectData.scale.y || 1,
                objectData.scale.z || 1
            );
        }
    }
    
    countTotalCoins() {
        this.totalCoins = this.collectibles.filter(item => 
            item.userData.type && item.userData.type.includes('coin')
        ).length;
        
        Utils.updateUI('totalCoins', this.totalCoins);
    }
    
    update() {
        // Animate collectibles
        this.collectibles.forEach(collectible => {
            if (!collectible.userData.collected) {
                Utils.animateRotate(collectible, 0, 0.02, 0);
                Utils.animateFloat(collectible, 0.005, 0.02);
            }
        });
        
        // Animate hazards
        this.hazards.forEach(hazard => {
            if (hazard.userData.type === 'saw') {
                Utils.animateRotate(hazard, 0, 0, 0.1);
            }
        });
        
        // Animate environment objects
        this.environment.forEach(envObj => {
            // Gentle swaying for trees and grass
            if (envObj.userData && (envObj.userData.type === 'tree' || envObj.userData.type === 'grass')) {
                envObj.rotation.z = Math.sin(Date.now() * 0.001) * 0.02;
            }
        });
    }
    
    getPlayerSpawnPosition() {
        if (this.levelData && this.levelData.spawn) {
            return new THREE.Vector3(
                this.levelData.spawn.x || 0,
                this.levelData.spawn.y || 5,
                this.levelData.spawn.z || 0
            );
        }
        return new THREE.Vector3(0, 5, 0);
    }
    
    getLevelGoal() {
        if (this.levelData && this.levelData.goal) {
            return this.levelData.goal;
        }
        return { type: 'collect_all_coins' };
    }
    
    checkLevelComplete() {
        const goal = this.getLevelGoal();
        
        switch (goal.type) {
            case 'collect_all_coins':
                const collectedCoins = this.collectibles.filter(item => 
                    item.userData.type && 
                    item.userData.type.includes('coin') && 
                    item.userData.collected
                ).length;
                return collectedCoins >= this.totalCoins;
                
            case 'reach_flag':
                // Check if player is near flag
                const flag = this.interactive.find(obj => obj.userData.type === 'flag');
                if (flag && game.player) {
                    return Utils.distance(game.player.position, flag.position) < 3;
                }
                return false;
                
            case 'collect_hearts':
                const collectedHearts = this.collectibles.filter(item => 
                    item.userData.type === 'heart' && item.userData.collected
                ).length;
                return collectedHearts >= (goal.count || 1);
                
            default:
                return false;
        }
    }
    
    resetCollectibles() {
        this.collectibles.forEach(collectible => {
            collectible.userData.collected = false;
            collectible.visible = true;
            collectible.position.copy(collectible.userData.originalPosition);
        });
    }
    
    // Get level objects for collision detection
    getPlatforms() {
        return this.platforms;
    }
    
    getCollectibles() {
        return this.collectibles;
    }
    
    getHazards() {
        return this.hazards;
    }
    
    getInteractive() {
        return this.interactive;
    }
    
    // Get level info
    getLevelInfo() {
        return {
            number: this.currentLevel,
            totalCoins: this.totalCoins,
            platforms: this.platforms.length,
            hazards: this.hazards.length,
            goal: this.getLevelGoal()
        };
    }
}