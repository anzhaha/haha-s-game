const config = {
    type: Phaser.AUTO,
    // 修改为适应手机屏幕的尺寸，这里以常见的手机屏幕宽度为例
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);
let score = 0;
let scoreText;
let timerText;
let balloons;
let gameOver = false;
const GAME_TIME = 30000;      // 30秒倒计时
const BASE_SPEED = -100;      // 基础速度
const SPAWN_INTERVAL = 1000;  // 每1秒生成一批新气球
let speedMultiplier = 1;      // 速度倍率
let startTime;
let timerEvent;

function preload() {
    this.load.image('balloon', 'assets/balloon.png');
    this.load.image('background', 'assets/background.png');
}

function create() {
    // 记录游戏开始时间
    startTime = this.time.now;
    // 根据屏幕尺寸调整背景图片位置
    this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'background');
    // 初始化气球组
    balloons = this.physics.add.group();

    // 显示得分和倒计时，调整文字位置和大小以适应手机屏幕
    scoreText = this.add.text(10, 10, '得分: 0', { fontSize: '20px', fill: '#000' });
    timerText = this.add.text(this.cameras.main.width - 100, 10, '时间: 30', { fontSize: '20px', fill: '#000' });

    // 点击气球事件
    this.input.on('gameobjectdown', (pointer, gameObject) => {
        if (gameOver) return;
        gameObject.destroy();
        score += 1;
        scoreText.setText('得分: ' + score);
    });

    // 启动倒计时
    timerEvent = this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });

    // 定期生成气球（每1秒）
    this.time.addEvent({
        delay: SPAWN_INTERVAL,
        callback: () => {
            if (!gameOver) spawnBalloons(this);
        },
        callbackScope: this,
        loop: true
    });
}

function update() {
    if (gameOver) return;

    // 更新速度倍率（剩余时间越少，速度越快）
    const elapsedTime = this.time.now - startTime;
    const remainingTime = GAME_TIME - elapsedTime;
    speedMultiplier = 1 + (2 * (1 - remainingTime / GAME_TIME)); // 1x ~ 3x

    // 检查是否有气球飞出顶部
    balloons.getChildren().forEach(balloon => {
        if (balloon.y < -50) {
            endGame(this, false); // 气球逃出，游戏失败
        }
    });
}

// 生成随机气球
function spawnBalloons(scene) {
    const elapsedTime = scene.time.now - startTime;
    const balloonCount = Math.floor(elapsedTime / 5000) + 1; // 每5秒增加一个气球
    for (let i = 0; i < balloonCount; i++) {
        // 根据屏幕宽度调整气球生成的随机位置
        let x = Phaser.Math.Between(20, scene.cameras.main.width - 20);
        let balloon = balloons.create(x, scene.cameras.main.height, 'balloon');
        balloon.setInteractive();
        // 可以根据需要调整气球的缩放比例以适应手机屏幕
        balloon.setScale(0.3);
        scene.physics.add.existing(balloon);
        balloon.body.setVelocityY(BASE_SPEED * speedMultiplier); // 动态速度
    }
}

// 更新倒计时
function updateTimer() {
    if (gameOver) return;
    const remainingTime = GAME_TIME - (this.time.now - startTime);
    const seconds = Math.ceil(remainingTime / 1000);
    timerText.setText(`时间: ${seconds}\n速度: x${speedMultiplier.toFixed(1)}`);

    if (remainingTime <= 0 && !gameOver) {
        endGame(this, true); // 时间到且无气球逃出，胜利
    }
}

// 游戏结束逻辑
function endGame(scene, isWin) {
    gameOver = true;
    if (timerEvent) {
        timerEvent.destroy(); // 停止倒计时
    }
    balloons.clear(true, true); // 清除所有气球

    const resultText = scene.add.text(
        scene.cameras.main.centerX,
        scene.cameras.main.centerY,
        isWin ? '抢到啦！' : '你没票！',
        {
            fontSize: '40px',
            fill: isWin ? '#00ff00' : '#ff0000'
        }
    );
    resultText.setOrigin(0.5);
}    