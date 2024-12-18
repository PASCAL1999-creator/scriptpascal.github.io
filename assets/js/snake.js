class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Basis instellingen
        this.tileSize = 25;
        this.tileCount = 20;
        this.canvas.width = this.tileSize * this.tileCount;
        this.canvas.height = this.tileSize * this.tileCount;
        
        // Game elementen
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.speed = { x: 0, y: 0 };
        this.food = this.generateFood();
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.isPaused = false;
        
        // Speciale effecten
        this.particles = [];
        this.powerUps = [];
        this.powerUpTimer = 0;
        this.powerUpActive = false;
        this.speedMultiplier = 1;
        
        // Kleuren en stijlen
        this.colors = {
            background: '#2E3440',
            snake: {
                head: '#88C0D0',
                body: '#81A1C1',
                outline: '#5E81AC'
            },
            food: '#BF616A',
            powerUp: '#A3BE8C',
            particles: ['#B48EAD', '#EBCB8B', '#A3BE8C', '#88C0D0'],
            grid: '#3B4252'
        };
        
        this.init();
    }
    
    init() {
        // Event listeners
        document.addEventListener('keydown', (e) => this.handleInput(e));
        this.canvas.addEventListener('click', () => {
            if (!this.gameStarted) {
                this.startGame();
            } else if (this.gameOver) {
                this.resetGame();
            }
        });
        
        // Start scherm tekenen
        this.drawStartScreen();
    }
    
    handleInput(e) {
        if (this.gameOver) return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (this.speed.y !== 1 && this.gameStarted) {
                    this.speed = { x: 0, y: -1 };
                }
                break;
            case 'ArrowDown':
                if (this.speed.y !== -1 && this.gameStarted) {
                    this.speed = { x: 0, y: 1 };
                }
                break;
            case 'ArrowLeft':
                if (this.speed.x !== 1 && this.gameStarted) {
                    this.speed = { x: -1, y: 0 };
                }
                break;
            case 'ArrowRight':
                if (this.speed.x !== -1 && this.gameStarted) {
                    this.speed = { x: 1, y: 0 };
                }
                break;
            case ' ':
                if (this.gameStarted && !this.gameOver) {
                    this.isPaused = !this.isPaused;
                }
                break;
        }
    }
    
    startGame() {
        this.gameStarted = true;
        this.speed = { x: 1, y: 0 };
        this.gameLoop();
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                type: Math.random() < 0.2 ? 'powerUp' : 'normal'
            };
        } while (this.snake.some(segment => 
            segment.x === newFood.x && segment.y === newFood.y));
        return newFood;
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x * this.tileSize + this.tileSize / 2,
                y: y * this.tileSize + this.tileSize / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: color || this.colors.particles[Math.floor(Math.random() * this.colors.particles.length)],
                life: 1
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.size *= 0.95;
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    update() {
        if (!this.gameStarted || this.gameOver || this.isPaused) return;
        
        // Update slang positie
        const newHead = {
            x: this.snake[0].x + this.speed.x,
            y: this.snake[0].y + this.speed.y
        };
        
        // Check voor game over
        if (
            newHead.x < 0 || newHead.x >= this.tileCount ||
            newHead.y < 0 || newHead.y >= this.tileCount ||
            this.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
            this.gameOver = true;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
            }
            return;
        }
        
        // Voeg nieuwe kop toe
        this.snake.unshift(newHead);
        
        // Check voor eten
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += this.food.type === 'powerUp' ? 20 : 10;
            this.createParticles(this.food.x, this.food.y, this.food.type === 'powerUp' ? this.colors.powerUp : this.colors.food);
            
            if (this.food.type === 'powerUp') {
                this.activatePowerUp();
            }
            
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }
        
        // Update power-up timer
        if (this.powerUpActive) {
            this.powerUpTimer--;
            if (this.powerUpTimer <= 0) {
                this.deactivatePowerUp();
            }
        }
        
        // Update particles
        this.updateParticles();
    }
    
    activatePowerUp() {
        this.powerUpActive = true;
        this.powerUpTimer = 200;
        this.speedMultiplier = 1.5;
    }
    
    deactivatePowerUp() {
        this.powerUpActive = false;
        this.speedMultiplier = 1;
    }
    
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.canvas.width, i * this.tileSize);
            this.ctx.stroke();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Teken grid
        this.drawGrid();
        
        if (!this.gameStarted) {
            this.drawStartScreen();
            return;
        }
        
        // Teken slang
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.tileSize;
            const y = segment.y * this.tileSize;
            
            // Lichaam met gradient
            const gradient = this.ctx.createRadialGradient(
                x + this.tileSize/2, 
                y + this.tileSize/2, 
                0,
                x + this.tileSize/2, 
                y + this.tileSize/2, 
                this.tileSize/1.5
            );
            
            if (index === 0) {
                gradient.addColorStop(0, this.colors.snake.head);
                gradient.addColorStop(1, this.colors.snake.outline);
            } else {
                gradient.addColorStop(0, this.colors.snake.body);
                gradient.addColorStop(1, this.colors.snake.outline);
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.roundRect(
                x + 1, 
                y + 1, 
                this.tileSize - 2, 
                this.tileSize - 2,
                index === 0 ? 8 : 4
            );
            this.ctx.fill();
            
            // Ogen voor de kop
            if (index === 0) {
                this.ctx.fillStyle = '#FFF';
                const eyeSize = 3;
                const eyeOffset = 6;
                
                // Positie van de ogen aanpassen op basis van richting
                let leftEyeX = x + eyeOffset;
                let rightEyeX = x + this.tileSize - eyeOffset - eyeSize;
                let eyeY = y + eyeOffset;
                
                if (this.speed.x === -1) {
                    leftEyeX = x + eyeOffset;
                    rightEyeX = x + this.tileSize - eyeOffset - eyeSize;
                    eyeY = y + this.tileSize/2 - eyeSize/2;
                } else if (this.speed.x === 1) {
                    leftEyeX = x + eyeOffset;
                    rightEyeX = x + this.tileSize - eyeOffset - eyeSize;
                    eyeY = y + this.tileSize/2 - eyeSize/2;
                } else if (this.speed.y === -1) {
                    leftEyeX = x + this.tileSize/2 - eyeSize * 2;
                    rightEyeX = x + this.tileSize/2 + eyeSize;
                    eyeY = y + eyeOffset;
                } else if (this.speed.y === 1) {
                    leftEyeX = x + this.tileSize/2 - eyeSize * 2;
                    rightEyeX = x + this.tileSize/2 + eyeSize;
                    eyeY = y + this.tileSize - eyeOffset - eyeSize;
                }
                
                this.ctx.fillRect(leftEyeX, eyeY, eyeSize, eyeSize);
                this.ctx.fillRect(rightEyeX, eyeY, eyeSize, eyeSize);
            }
        });
        
        // Teken voedsel met glow effect
        const foodX = this.food.x * this.tileSize + this.tileSize/2;
        const foodY = this.food.y * this.tileSize + this.tileSize/2;
        
        // Glow effect
        this.ctx.shadowColor = this.food.type === 'powerUp' ? this.colors.powerUp : this.colors.food;
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.arc(foodX, foodY, this.tileSize/3, 0, Math.PI * 2);
        this.ctx.fillStyle = this.food.type === 'powerUp' ? this.colors.powerUp : this.colors.food;
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Teken particles
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Teken score
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Highscore: ${this.highScore}`, 10, 60);
        
        // Power-up indicator
        if (this.powerUpActive) {
            this.ctx.fillStyle = this.colors.powerUp;
            this.ctx.fillRect(10, 70, (this.powerUpTimer / 200) * 100, 5);
        }
        
        // Game Over scherm
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width/2, this.canvas.height/2 - 40);
            
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.canvas.width/2, this.canvas.height/2 + 10);
            if (this.score === this.highScore) {
                this.ctx.fillStyle = '#A3BE8C';
                this.ctx.fillText('Nieuwe Highscore!', this.canvas.width/2, this.canvas.height/2 + 40);
            }
            
            this.ctx.fillStyle = '#88C0D0';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Klik om opnieuw te spelen', this.canvas.width/2, this.canvas.height/2 + 80);
        }
        
        // Pauze scherm
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUZE', this.canvas.width/2, this.canvas.height/2);
            
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Druk op spatie om verder te gaan', this.canvas.width/2, this.canvas.height/2 + 40);
        }
    }
    
    drawStartScreen() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SNAKE', this.canvas.width/2, this.canvas.height/2 - 60);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Gebruik de pijltjestoetsen om te bewegen', this.canvas.width/2, this.canvas.height/2);
        this.ctx.fillText('Spatie om te pauzeren', this.canvas.width/2, this.canvas.height/2 + 30);
        
        this.ctx.fillStyle = '#88C0D0';
        this.ctx.fillText('Klik om te starten', this.canvas.width/2, this.canvas.height/2 + 80);
        
        if (this.highScore > 0) {
            this.ctx.fillStyle = '#A3BE8C';
            this.ctx.fillText(`Highscore: ${this.highScore}`, this.canvas.width/2, this.canvas.height/2 + 120);
        }
    }
    
    resetGame() {
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.speed = { x: 1, y: 0 };
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = true;
        this.isPaused = false;
        this.particles = [];
        this.powerUpActive = false;
        this.powerUpTimer = 0;
        this.speedMultiplier = 1;
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (!this.gameOver) {
            setTimeout(() => {
                requestAnimationFrame(() => this.gameLoop());
            }, 1000 / (10 * this.speedMultiplier));
        }
    }
} 