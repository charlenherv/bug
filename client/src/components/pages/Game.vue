<template>
  <div id="BUG"
      data-background="navy">
    <div
      v-if="currentPage === 'dashboard'"
      id="Dashboard"
      class="Page"
      data-background="navy"
    >
      <img src="@/assets/bug-logo.svg" class="Logo" />
      <div v-if="!playedBefore" id="Name_Input">
        <div class="Name_Input_Instructions">What's your name?</div>
        <input
          name="playerName"
          v-model="playerName"
          placeholder=""
        />
      </div>
      <div class="Controls" v-if="playerReady">
        
        <div class="Button" data-color="magenta" @click="changePage('game')">
          start
        </div>
        <div
          class="Button"
          data-color="purple"
          @click="changePage('leaderboard')"
        >
          leaderboard
        </div>
      </div>
    </div>

    <div
      v-if="currentPage === 'level-select'"
      id="LevelSelect"
      class="Page"
      data-background="navy"
    >
      <div class="Controls">
        <div class="Button" data-color="purple" @click="changePage('game')">
          go!
        </div>
      </div>
    </div>

    <div
      v-if="currentPage === 'leaderboard'"
      id="Leaderboard"
      class="Page"
      data-background="navy"
    >


    <!-- leaderboard table -->
    <div class="LeaderBoard_Table">
      <div class="LeaderBoard_TableHeader">top 10 worldwide</div>
      <div class="LeaderBoard_TableBody">
        <table>
          <tr class="LeaderBoard_Table_Entry" v-for="(entry, index) in leaderBoardEntries" :key="index">
            <td class="LeaderBoard_Player">{{ entry.player }}</td><td class="LeaderBoard_Score">{{ entry.score }}</td>
          </tr>
        </table>
      </div>
    </div>

      <div class="Controls">
        <div
          v-if="gameStatus === 'over' || gameStatus === 'complete'"
          class="Button"
          data-color="magenta"
          @click="changePage('game')"
        >
          go again!
        </div>
        <div
          class="Button"
          data-color="purple"
          @click="changePage('dashboard')"
        >
          dashboard
        </div>
      </div>
    </div>

    <div
      v-if="currentPage === 'game'"
      id="Game"
      :class="{
        Page: true,
        shake: shakeScreenNow && currentLevel.shakeScreen === true
      }"
      :data-status="gameStatus"
      :data-background="gameBackground"
      :data-audio-step="currentAudioStep"
    >
      <!-- Game background -->
      <div class="Audio_Background" v-if="gameBackground === 'fx'">
          <!-- Frequency level bocks-->
          <div v-for="(level,index) in audio.levels.perc" :key="index" :data-level="index" :style="{opacity: audio.levels.perc[index] >= 80 ? audio.levels.perc[index] * 0.01 : 0.25}"></div>
      </div>

      <!-- Phaser -->
      <!--<ion-phaser :game.prop="gameConfig" :initialize.prop="gameInitialization"/>-->
      <div id="PhaserGame"></div>

      <div class="PostGame_Overlay" v-if="gameStatus === 'over' || gameStatus === 'complete'">
        <div class="PostGame_Message" v-if="gameMessage">
          <div>{{ gameMessage }}</div>
          <div v-if="highScore" data-text-color="yellow">{{ totalScore }}</div>
        </div>
        <div class="PostGame_Controls">
          <div class="Button" data-color="magenta" @click="initializeGame(true)">
            go again!
          </div>

          <div v-if="highScore" 
            class="Button"
            data-color="purple"
            @click="changePage('leaderboard')"
          >
            leaderboard
          </div>

          <div v-if="!highScore" 
            class="Button"
            data-color="purple"
            @click="changePage('dashboard')"
          >
            dashboard
          </div>

        </div>
      </div>

      <div class="HUD">
        <div class="HUD_Bottom">
          <div class="HUD_Bottom_Left">

            <div class="HUD_Life">
              <div
                class="HUD_Lives"
                v-for="(live, index) in lives"
                :key="index"
              ></div>
              <div class="HUD_LifeBar" :data-level="lifeLevel">
                <div class="HUD_LifeBar_Fill" :style="{
                  width: life + '%'
                }"></div>
              </div>
            </div>

          
          </div>
          <div class="HUD_Bottom_Right">
            <div class="TotalScore">{{ totalScore }}</div>
          </div>
        </div>
      </div>
    </div>

    <audio style="display:none" ref="soundPlayer"></audio>
  </div>
</template>

<script>
import Vue from "vue";
import Phaser from "phaser";
import { AudioFunctions } from "../../mixins/AudioFunctions.js";

export default {
  name: "Game",
  mixins: [AudioFunctions],
  computed: {
    playerName: {
      set(playerName) {
        this.$store.commit("setPlayer", playerName);
      },
      get() {
        // Or remove mapState and use this.$store.state.values.example
        return this.$store.state.currentPlayer;
      }
    },
    playerReady() {
      return this.$store.state.currentPlayer.length > 0 
    },
    highScore() {
      const gotAHighScore = false;
      return gotAHighScore;
    },
    shipAlive() {
      return this.life > 0;
    },
    lifeLevel() {
      const level = 
        this.life >= 75 ? 'high':
        this.life >= 50 ? 'med':
        'low';
      return level;
    },
    totalScore() {
      return this.$store.state.totalScore;
    },
    gameMessage() {
      const message =
        this.gameStatus === "paused"
          ? "paused"
          : this.gameStatus === "error"
          ? "error - refresh to start over"
          : this.gameStatus === "over"
          ? "you dead"
          : this.gameStatus === "complete" && this.highScore
          ? "high score"
          : this.gameStatus === 'complete' ?
            "more coming soon"
          : false;
      return message;
    },
    leaderBoardEntries() {
      const entries = this.$store.state.leaderBoardEntries;
      return entries;
    },
    gameBackground() {
      const color =
        this.gameStatus === "over"
          ? "burgundy"
        : this.gameStatus === "complete"
          ? "navy"
          : this.currentLevel.background
          ? this.currentLevel.background
          : "navy";
      return color;
    },
    currentAudioStep() {
      return this.audio.bassSteps.current || 1;
    },
    shakeScreenNow () {
      return this.audio.crazyBass === true
    }
  },
  data() {
    return {
      playedBefore: false,
      currentPage: "dashboard",
      gameInitialization: false,
      gameConfig: {},
      gameStatus: "loading",
      gameAttempts: [],
      life: 100,
      lives: 3,

      audio: {
        bassSteps: {
          current: 0,
          count: 0,
        },
        levels: {}
      },
      levels: [
        {
          _id: 1,
          filename: "1",
          background: "navy",
          gravity:50
        },
        {
          _id: 2,
          filename: "2",
          background: "purple",
          gravity:125
        },

        {
          _id: 3,
          filename: "3",
          background: "jazz",
          gravity:250,
          shakeScreen: true
        },

        {
          _id: 4,
          filename: "4",
          background: "black",
          gravity: 200
        },

        {
          _id: 5,
          filename: "5",
          background: "steps",
          gravity:750
        },
        /*
        {
          _id: 6,
          filename: "test",
          background: "steps",
          gravity:1000
        }*/
      ],
      

      currentLevel: {},
      currentDeathObjects: [],
      currentPointStars: [],
      bulletSpeed: 750,
      goodObjects: [
        {
          name: "point-star",
          width: 23,
          height: 46 / 2,
          points: 5,
          prob: 1
        },
      ],
      deathObjects: [
        {
          name: "spiral",
          width: 47,
          height: 45,
          prob: 0.025
        },
        {
          name: "comet",
          width: 40,
          height: 92 / 2,
          points: 500,
          prob: 0.3
        },
        {
          name: "stroid",
          width: 42,
          height: 80 / 2,
          points: 250,
          prob: 0.5
        },
        {
          name: "star",
          width: 23,
          height: 46 / 2,
          points: 100,
          prob: 1
        },
      ],
      x: window.innerWidth / 2,
      y: window.innerHeight - 50,
      updateTime: 25,
      updateTimer: 0,
    };
  },
  methods: {
    randomItemProbablity(options) {
      const weightedOptions = options.sort(({prob:a}, {prob:b}) => a - b);
      const randomNumber = Math.random();
      let obj;
      for (let i = 0; i < weightedOptions.length; i++) {
        const prevWeight = i > 0 ? weightedOptions[i - 1].prob: 0;
        if (
          randomNumber > prevWeight && randomNumber <= weightedOptions[i].prob
        ) {
          obj = options[i] 
          break;
        }
      }
      return obj;
    },
    randomNumber(min, max) {
      return Math.random() * (max - min) + min;
    },
    systemSound(key) {
      const sound = this.$refs.soundPlayer;
      sound.src = 'audio/effects/'+key+'.mp3';
      sound.play();
    },
    changePage(page) {
      const componentContext = this;
      this.currentPage = page;
      componentContext.systemSound('button-select');

      this.$nextTick(function () {
        if (
          componentContext.gameStatus === "started" ||
          componentContext.gameStatus === "over" || 
          componentContext.gameStatus === "complete"
        ) {
          if (page !== "game") {
          } else {
            // Restart game
            componentContext.initializeGame();
          }
        } else {
          // First game
          if (page === "game") {
            componentContext.initializeGame();
          }
        }
      });
    },

    removeAllObjects() {
      const componentContext = this;
        componentContext.currentDeathObjects.forEach(function (obj) {
          obj.object.setActive(false).setVisible(false);
          obj.object.destroy();
        });
        componentContext.currentDeathObjects = [];

        componentContext.currentPointStars.forEach(function (obj) {
          obj.object.setActive(false).setVisible(false);
          obj.object.destroy();
        });
        componentContext.currentPointStars = [];
    },
    initializeGame(again) {
      const componentContext = this;

      if (again) {
        componentContext.systemSound('button-select');
      }

      if (componentContext.destroyGame) {
        componentContext.destroyGame.func();
      }
      this.gameStatus = "loading";
      componentContext.currentLevel = componentContext.levels[0];
      componentContext.updateScore("reset");
      componentContext.lives = 3;
      componentContext.life = 100;

      componentContext.phaserGame = new Phaser.Game(
        componentContext.gameConfig
      );
      componentContext.gameInitialization = true;
    },
    endGame() {
      const componentContext = this;
      componentContext.removeAllObjects();
      componentContext.stopSound(componentContext);
      componentContext.gameStatus = "complete";
      componentContext.addScore();
    },
    updateScore(points) {
      this.$store.dispatch("updateScore", points);
    },
    animateShip(gameContext, animation, override = false) {
      const componentContext = this;
      const animationReady =
        override === true
          ? true
          : componentContext.shipAlive && gameContext.vulnerable
          ? true
          : animation === "death"
          ? true
          : false;
      if (animationReady) {
        gameContext.ship.play(animation);
      }
    },
    shipFloat(gameContext) {
      const componentContext = this;
      if (componentContext.shipAlive) {
        componentContext.animateShip(gameContext, "float");
      }
    },
    destroyPointStar(id) {
      const componentContext = this;
      const obj = componentContext.currentPointStars.filter(pointStar => pointStar.id === id);
      const index = componentContext.currentPointStars.findIndex(
        (pointStar) => pointStar.id === id
      );
      if (index > -1) {
        obj[0].object.setActive(false);
        obj[0].object.setVisible(false);
        obj[0].object.destroy();

        componentContext.currentPointStars.splice(index, 1);
      }
      },
    destroyObject(obj) {
      const componentContext = this;
      componentContext.gameContext.sounds.destroy[obj.name].play();

      if (obj.name === "stroid") {
        obj.object.clearTint();
      }
      obj.object.play("destroy-" + obj.name);
      obj.object.notAThreat = true;
      setTimeout(function () {
        componentContext.removeObject(obj);
      }, 500);
    },
    removeObject(obj) {
      const componentContext = this;
      const index = componentContext.currentDeathObjects.findIndex(
        (deathObject) => deathObject.id === obj.id
      );
      if (index > -1) {
        obj.object.setActive(false);
        obj.object.setVisible(false);
        obj.object.destroy();
        componentContext.currentDeathObjects.splice(index, 1);
      }
    },
    shipLife(gameContext, amount, objectName) {
      const componentContext = this;
      function resetVulnerability() {
        clearTimeout(gameContext.vulnerabilityTimer);
        gameContext.vulnerable = false;
        gameContext.vulnerabilityTimer = setTimeout(function () {
          gameContext.vulnerable = true;
        }, 1500);
      }
      function lifeCheck() {
        componentContext.lives -= 1;
        if (componentContext.lives < 1) {
          componentContext.stopSound(componentContext);
          componentContext.gameStatus = "over";
          componentContext.addScore();
        } else {
          componentContext.addShip(gameContext);
        }
      }
      
      if (amount === "restore") {
        componentContext.life = 100;
        componentContext.animateShip(gameContext, "restore");
      } else {
        if (gameContext.vulnerable) {
          if (amount !== "death") {
            // Take damage
            if (amount < 0) {
              if (objectName && gameContext.sounds.damage[objectName]) {
                gameContext.sounds.damage[objectName].play();
              }

              componentContext.life -= amount * -1;
              componentContext.animateShip(gameContext, "damage");
            }

            // Add life
            else if (amount > 0) {
              componentContext.life += amount;
            }
          }

          // If dead
          if (amount === "death" || !componentContext.shipAlive) {
            if (objectName) {
              gameContext.sounds.death[objectName].play();
            }

            gameContext.vulnerable = false;
            clearTimeout(gameContext.vulnerabilityTimer);
            componentContext.life = 0;
            componentContext.animateShip(gameContext, "death");
            setTimeout(function () {
              componentContext.removeAllObjects();
              lifeCheck();
            }, 2000);
          } else {
            resetVulnerability();
          }
        }
      }
    },
    addShip(gameContext) {
      const componentContext = this;
      componentContext.systemSound('ship-entrance');

      if (componentContext.gameContext.ship) {
        componentContext.gameContext.ship.setActive(false).setVisible(false);
        componentContext.gameContext.ship.destroy();
        componentContext.gameContext.ship = {};
      }
      gameContext.ship = gameContext.physics.add
        .sprite(componentContext.x, componentContext.y, "ship")
        .setDepth(1);
      gameContext.ship.body.setAllowGravity(false);
      componentContext.life = 100;
      gameContext.vulnerable = true;
      componentContext.shipFloat(gameContext);

      gameContext.physics.add.overlap(
        gameContext.bullets,
        gameContext.ship,
        function (object, bullet) {
          if (bullet.friendlyFire) {
            componentContext.shipLife(gameContext, -25, "bullet");
            bullet.setActive(false).setVisible(false);
          }
        }
      );
    },

    startLevel() {
      const componentContext = this;

      // Set level gravity
      console.log(componentContext.currentLevel.gravity);
      if (componentContext.currentLevel.gravity) {
        componentContext.gameContext.physics.world.gravity.y = componentContext.currentLevel.gravity;
      }

      // Play beat
      componentContext.playBeat(componentContext);
    },
    getLeaderBoard() {
      var componentContext = this;
      componentContext.$store.dispatch('getLeaderBoard');
    },
    addScore() {
      var componentContext = this;
      const data = {
        player: this.$store.state.currentPlayer,
        score : componentContext.totalScore
      };
      componentContext.$store.dispatch("addScore", data);
    }
  },
  mounted() {
    const componentContext = this;
    componentContext.gameConfig = {
      parent: "PhaserGame",
      width: window.innerWidth,
      height: window.innerHeight,
      transparent: true,
      type: Phaser.AUTO,
      scene: {
        physics: {
          arcade: {
            debug: false,
            gravity: { x: 0, y: 50 },
          },
          matter: {
            gravity: { y: 0 },
          },
        },
        init() {
          // Init game
        },
        preload() {
          const context = this;
          componentContext.gameContext = this;

          // LOAD ARTWORK

          // Ship and Weapons
          context.load.spritesheet("ship", "image/ship.svg", {
            frameWidth: 50,
            height: 50,
          });
          context.load.image("bullet", "image/ship-bullet.svg");

          // Life Objects
          context.load.image("lifebase", "image/lifebase.svg", {
            frameWidth: 60,
            height: 40,
          });

          // Death objects
          componentContext.deathObjects.forEach(function (objectObj, index) {
            const objectName = "death-" + objectObj.name;
            
            context.load.spritesheet(
              objectName,
              "image/" + objectName + ".svg",
              {
                frameWidth: objectObj.width,
                frameHeight: objectObj.height,
              }
            );
            
          });

          // Good objects
          componentContext.goodObjects.forEach(function (objectObj, index) {
            const objectName = objectObj.name;
            context.load.spritesheet(
              objectName,
              "image/" + objectName + ".svg",
              {
                frameWidth: objectObj.width,
                frameHeight: objectObj.height,
              }
            );
          });

          // Sound Effects
          /*context.load.audio("continue", [
            "audio/effects/continue.ogg",
            "audio/effects/continue.mp3",
          ]);
          context.load.audio("go", [
            "audio/effects/go.ogg",
            "audio/effects/go.mp3",
          ]);*/

          // Weapons
          context.load.audio("gun-1", [
            "audio/effects/gun-1.ogg",
            "audio/effects/gun-1.mp3",
          ]);
          context.load.audio("gun-2", [
            "audio/effects/gun-2.ogg",
            "audio/effects/gun-2.mp3",
          ]);

          // Damage
          context.load.audio("damage-star", [
            "audio/effects/damage-star.ogg",
            "audio/effects/damage-star.mp3",
          ]);
          context.load.audio("damage-bullet", [
            "audio/effects/damage-bullet.ogg",
            "audio/effects/damage-bullet.mp3",
          ]);

          // Death
          context.load.audio("destroy-comet", [
            "audio/effects/destroy-comet.ogg",
            "audio/effects/destroy-comet.mp3",
          ]);
          context.load.audio("destroy-stroid", [
            "audio/effects/destroy-stroid.ogg",
            "audio/effects/destroy-stroid.mp3",
          ]);
          context.load.audio("destroy-star", [
            "audio/effects/destroy-star.ogg",
            "audio/effects/destroy-star.mp3",
          ]);
          context.load.audio("spiral-ricochet", [
            "audio/effects/spiral-ricochet.ogg",
            "audio/effects/spiral-ricochet.mp3",
          ]);

          // Death
          context.load.audio("death-comet", [
            "audio/effects/death-comet.ogg",
            "audio/effects/death-comet.mp3",
          ]);
          context.load.audio("death-stroid", [
            "audio/effects/death-stroid.ogg",
            "audio/effects/death-stroid.mp3",
          ]);
          context.load.audio("death-star", [
            "audio/effects/death-star.ogg",
            "audio/effects/death-star.mp3",
          ]);
          context.load.audio("death-spiral", [
            "audio/effects/death-spiral.ogg",
            "audio/effects/death-spiral.mp3",
          ]);
          context.load.audio("death-bullet", [
            "audio/effects/death-bullet.ogg",
            "audio/effects/death-bullet.mp3",
          ]);

          // Good
          /*
          context.load.audio("lifebase", [
            "audio/effects/lifebase.ogg",
            "audio/effects/lifebase.mp3",
          ]);*/
          context.load.audio("point-star-1", [
            "audio/effects/point-star-1.ogg",
            "audio/effects/point-star-1.mp3",
          ]);
          context.load.audio("point-star-2", [
            "audio/effects/point-star-2.ogg",
            "audio/effects/point-star-2.mp3",
          ]);
          context.load.audio("point-star-3", [
            "audio/effects/point-star-3.ogg",
            "audio/effects/point-star-3.mp3",
          ]);
          context.load.audio("point-star-4", [
            "audio/effects/point-star-4.ogg",
            "audio/effects/point-star-4.mp3",
          ]);
          context.load.audio("point-star-destroy", [
            "audio/effects/point-star-destroy.ogg",
            "audio/effects/point-star-destroy.mp3",
          ]);

        },
        create() {
          const context = this;
          
          // Store reset function
          componentContext.playedBefore = true;
          componentContext.destroyGame = {
            func: function () {
              context.sys.game.destroy(true);
            },
          };

          // Animations
          context.anims.create({
            key: "float",
            frameRate: 5,
            frames: this.anims.generateFrameNumbers("ship", {
              start: 2,
              end: 2,
            }),
            repeat: -0,
          });
          context.anims.create({
            key: "go",
            frameRate: 5,
            frames: this.anims.generateFrameNumbers("ship", {
              start: 3,
              end: 3,
            }),
            repeat: -1,
          });
          context.anims.create({
            key: "restore",
            frameRate: 10,
            frames: this.anims.generateFrameNumbers("ship", { frames: [0, 2] }),
            repeat: 3,
          });
          context.anims.create({
            key: "damage",
            frameRate: 10,
            frames: this.anims.generateFrameNumbers("ship", { frames: [1, 2] }),
            repeat: 3,
          });
          context.anims.create({
            key: "death",
            frameRate: 5,
            frames: this.anims.generateFrameNumbers("ship", {
              start: 4,
              end: 4,
            }),
            repeat: -0,
          });

          // Weapons
          context.bullets = new Bullets(context);
          context.input.on("pointerdown", (pointer) => {
            if (componentContext.shipAlive) {
              this.bullets.fireBullet(this.ship.x, this.ship.y - 20);
            }
          });

          // Add ship
          componentContext.addShip(context);

          // Good objects
          componentContext.goodObjects.forEach(function (objectObj, index) {
            const objectName = objectObj.name;
              context.anims.create({
                key: objectName,
                frameRate: 1,
                frames: context.anims.generateFrameNumbers(objectName, {
                  start: 1,
                  end: 1,
                }),
                repeat: -0,
              });
          });

          // Death objects
          componentContext.deathObjects.forEach(function (objectObj, index) {
            const objectName = "death-" + objectObj.name;
            if (objectObj.name != "spiral") {
              context.anims.create({
                key: "destroy-" + objectObj.name,
                frameRate: 1,
                frames: context.anims.generateFrameNumbers(objectName, {
                  start: 1,
                  end: 1,
                }),
                repeat: -0,
              });
            }
          });


          // Load sound effects
          context.sounds = {
            button: {
              // select: context.sound.add("select"),
              //continue: context.sound.add("continue"),
              //go: context.sound.add("go")
            },
            'point-star': [context.sound.add("point-star-1"), context.sound.add("point-star-2"),context.sound.add("point-star-3"),context.sound.add("point-star-4")],
            gun: [context.sound.add("gun-1"), context.sound.add("gun-2")],
            death: {
              comet: context.sound.add("death-comet"),
              stroid: context.sound.add("death-stroid"),
              star: context.sound.add("death-star"),
              spiral: context.sound.add("death-spiral"),
              bullet: context.sound.add("death-bullet"),
            },
            destroy: {
              comet: context.sound.add("destroy-comet"),
              stroid: context.sound.add("destroy-stroid"),
              star: context.sound.add("destroy-star"),
              "spiral-ricochet": context.sound.add("spiral-ricochet"),
              "point-star-destroy": context.sound.add("point-star-destroy"),
            },
            damage: {
              star: context.sound.add("damage-star"),
              bullet: context.sound.add("damage-bullet"),
            },
          };

          // Start music 🎵🎵🎵
          componentContext.startLevel();
          componentContext.gameStatus = "started";
        },
        update(time, delta) {
          const context = this;
          let { width, height } = context.sys.game.canvas;

          if (componentContext.gameStatus !== "over" && componentContext.gameStatus !== "complete") {
            while (
              !componentContext.updateTimer ||
              time > componentContext.updateTimer + componentContext.updateTime
            ) {
              const spawnPadding = 20;
              
              
              // Point stars
              if (
                componentContext.currentPointStars.length <= 20
              ) {
                  const pointStarX = Phaser.Math.Between(
                    spawnPadding,
                    context.game.config.width - spawnPadding
                  );
                  let pointStar = new PointStar(
                    context,
                    pointStarX,
                    0
                  );
              }
              

              // Death objects
              if (
                componentContext.audio.midBass &&
                componentContext.currentDeathObjects.length < 15
              ) {
                const objectType = componentContext.randomItemProbablity(componentContext.deathObjects);
                const objectName = objectType.name;                
                const xPosition = Phaser.Math.Between(
                  spawnPadding,
                  context.game.config.width - spawnPadding
                );

                // Send object
                let deathObject = new DeathObject(
                  context,
                  xPosition,
                  0,
                  objectName
                );
              }
              
              componentContext.updateTimer = time; // Reset timer
            }

            // Death spirals
            componentContext.currentDeathObjects
              .filter((object) => object.name === "spiral")
              .forEach(function (spiral) {
                spiral.object.rotation += 0.125;
              });

            // Death by spiral
            if (
              componentContext.life === 0 &&
              context.deathBySpiral &&
              context.deathBySpiral.object
            ) {
              context.ship.setOrigin(0.5, 0.5);
              context.ship.angle += 25;
              context.physics.moveToObject(
                context.ship,
                context.deathBySpiral.object,
                500
              );
              if (context.ship.scale > 0) {
                context.ship.scale -= 0.1;
              } else {
                context.ship.scale = 0;
                componentContext.shipLife(context, "death");
                context.deathBySpiral = false;
              }
            }

            // Process point stars
            componentContext.currentPointStars.forEach(function (
              pointStar
            ) {
              if (pointStar) {
                const objectPosition = {
                  x: pointStar.object.x,
                  y: pointStar.object.y,
                };
                if (
                  objectPosition.y >
                    componentContext.gameContext.game.config.height ||
                  objectPosition.y < 0
                ) {
                  componentContext.destroyPointStar(pointStar.id);                  
                }
              }
            });
          

            // Process Death objects
            componentContext.currentDeathObjects.forEach(function (
              deathObject
            ) {
              if (deathObject) {
                const objectPosition = {
                  x: deathObject.object.x,
                  y: deathObject.object.y,
                };
                if (
                  objectPosition.y >
                    componentContext.gameContext.game.config.height ||
                  objectPosition.y < 0
                ) {
                  componentContext.removeObject(deathObject);
                  if (
                    componentContext.shipAlive &&
                    context.movementScoreTrigger
                  ) {
                    componentContext.updateScore(10);
                  }
                }
              }
            });
          }
        },
      },
    };

    const bottomPadding = 50;
    function shipMovement(evt) {
      var coords = evt.touches ? {
        x: evt.touches[0].pageX,
        y: evt.touches[0].pageY
      }: 
      evt.changedTouches ? 
      {
        x: evt.changedTouches[0].pageX,
        y: evt.changedTouches[0].pageY
      }:
      {
        x: evt.clientX,
        y: evt.clientY
      };
      
     if (componentContext.gameContext) { // Game ready
        // Animation
        const stallTime = 500;
        componentContext.animateShip(componentContext.gameContext, "go"); // Acceleration animation
        setTimeout(function () {
          componentContext.shipFloat(componentContext.gameContext); // Float after stall time
        }, stallTime);

        // Follow mouse
        if (componentContext.gameContext.ship && componentContext.shipAlive) {
          const flyConfig = {
            targets: componentContext.gameContext.ship,
            x: coords.x,
            duration: 250,
            ease: "Sine.easeOut",
          };

          if (componentContext.gameStatus === 'complete' || coords.y >= componentContext.gameContext.game.config.height / 2 && coords.y <= componentContext.gameContext.game.config.height - bottomPadding
          ) {
            flyConfig.y = coords.y;
          }
          componentContext.gameContext.tweens.add(flyConfig, this);

          // Movement score control
          const campingTime = 5000;
          clearTimeout(componentContext.gameContext.movementScoreTimer);
          componentContext.gameContext.movementScoreTrigger = true;
          componentContext.gameContext.movementScoreTimer = setTimeout(
            function () {
              componentContext.gameContext.movementScoreTrigger = false;
            },
            campingTime
          );
        }
      }
    };
    document.addEventListener("touchmove", function (evt) {
      shipMovement(evt);
    });
    document.addEventListener("mousemove", function (evt) {
      shipMovement(evt)
    });
    class Bullet extends Phaser.Physics.Arcade.Sprite {
      constructor(scene, x, y) {
        super(scene, x, y, "bullet");
      }

      fire(x, y) {
        this.rotation = 0;
        this.friendlyFire = false;
        this.richochetDecided = false;
        this.body.reset(x, y);

        this.setActive(true);
        this.setVisible(true);

        this.setVelocityY(componentContext.bulletSpeed * -1);
      }

      preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (
          this.y < 0 ||
          this.y > componentContext.gameContext.game.config.height
        ) {
          this.setActive(false);
          this.setVisible(false);
          this.y = -100;
          this.x = -100;
        }
      }
    }
    class Bullets extends Phaser.Physics.Arcade.Group {
      constructor(scene) {
        super(scene.physics.world, scene);

        this.createMultiple({
          frameQuantity: 7,
          key: "bullet",
          active: false,
          visible: false,
          classType: Bullet,
        });
      }

      fireBullet(x, y) {
        let bullet = this.getFirstDead(false);
        if (bullet) {
          // Play random gun sound
          componentContext.gameContext.sounds.gun[
            Math.floor(
              Math.random() * componentContext.gameContext.sounds.gun.length
            )
          ].play();

          bullet.fire(x, y);
        }
      }
    }
    class DeathObject extends Phaser.Physics.Arcade.Sprite {
      constructor(scene, x, y, name) {
        const objectName = "death-" + name;
        const id = Date.now();
        const depth = name === 'spiral' ? -1: 0;
        super(scene, x, y, objectName);
        const object = this.scene.physics.add
          .sprite(x, y, objectName)
          .setDepth(depth);
        const finalObject = {
          object: object,
          name: name,
          id: id,
        };

        // Comet
        if (name === "comet") {
          // Heat seaking at random
          const heatSeek = Math.random() < 0.1;
          if (heatSeek) {
            finalObject.heatSeek = true;
            const rotation = componentContext.gameContext.physics.accelerateTo(
              object,
              componentContext.gameContext.ship.x,
              componentContext.gameContext.ship.y,
              componentContext.randomNumber(250, 750)
            );
            object.rotation = rotation - 90; // Hack to fix incorrect rotation;
            finalObject.points = 1500;
          } else {
            object.setVelocityY(componentContext.randomNumber(100, 650));
          }
        }

        if (name === "stroid") {
          var randomScale = componentContext.randomNumber(0.75, 1.25)
          object.scale = randomScale;
          const randomColor = Math.random() * 0xffffff;
          object.setTint(randomColor,randomColor,randomColor,randomColor);
        }

        if (name === "spiral") {
          object.scale = 1.5;
        }

        // Bullet collision
        componentContext.gameContext.physics.add.overlap(
          componentContext.gameContext.bullets,
          object,
          function (object, bullet) {
            if (!object.notAThreat) {
              if (name === "spiral") {
                if (!bullet.richochetDecided) {
                  var randomRicochet = Math.random() < 0.5;
                  bullet.richochetDecided = true;
                  if (randomRicochet) {
                    componentContext.gameContext.sounds.destroy[
                      "spiral-ricochet"
                    ].play();
                    bullet.friendlyFire = true;
                    bullet.rotation += 0.5;
                    bullet.setVelocityY(componentContext.bulletSpeed * 0.75);
                  }
                }
              } else {
                const pointsEarned = finalObject.points
                  ? finalObject.points
                  : componentContext.deathObjects.filter(
                      (obj) => obj.name === name
                    )[0].points;
                componentContext.updateScore(pointsEarned);
                componentContext.destroyObject(finalObject);

                // Dispose bullet
                bullet.setActive(false).setVisible(false);
                bullet.y = -100;
                bullet.x = -100;
              }
            }
          }
        );

        // Ship collision
        componentContext.gameContext.physics.add.overlap(
          componentContext.gameContext.ship,
          object,
          function (ship, object) {
            if (!object.notAThreat && componentContext.gameContext.vulnerable) {
              if (name === "spiral") {
                componentContext.gameContext.sounds.death.spiral.play();
                componentContext.life = 0;
                componentContext.gameContext.deathBySpiral = {
                  object: object,
                };
              } else {
                if (name === "star") {
                  componentContext.shipLife(
                    componentContext.gameContext,
                    -10,
                    name
                  );
                } 
                else if (name === "comet" && !finalObject.heatSeek) {
                  componentContext.shipLife(
                    componentContext.gameContext,
                    -50,
                    name
                  );
                } else {
                  componentContext.gameContext.sounds.death[name].play();
                  componentContext.shipLife(
                    componentContext.gameContext,
                    "death"
                  );
                }
                componentContext.destroyObject(finalObject);
              }
            }
          }
        );

        componentContext.currentDeathObjects.push(finalObject);
      }
    }

    class PointStar extends Phaser.Physics.Arcade.Sprite {
      constructor(scene, x, y,) {
        const objectName = 'point-star';
        const id = Date.now();
        super(scene, x, y);
        const object = this.scene.physics.add
          .sprite(x, y, 'point-star')
          .setDepth(0);
        const finalObject = {
          object: object,
          name: name,
          id: id,
        };        

        // Bullet collision
        componentContext.gameContext.physics.add.overlap(
          componentContext.gameContext.bullets,
          object,
          function (object, bullet) {
            componentContext.gameContext.sounds.destroy['point-star-destroy'].play();

            componentContext.destroyPointStar(id);

            // Dispose bullet
            bullet.setActive(false).setVisible(false);
            bullet.y = -100;
            bullet.x = -100;
          }
        );

        // Ship collision
        componentContext.gameContext.physics.add.overlap(
          componentContext.gameContext.ship,
          object,
          function (ship, object) {
            
            componentContext.updateScore(componentContext.goodObjects.filter(obj => obj.name === 'point-star')[0].points);

            componentContext.gameContext.sounds['point-star'][
            Math.floor(
              Math.random() * componentContext.gameContext.sounds['point-star'].length
            )
            ].play({volume: 0.2});
            
            componentContext.destroyPointStar(id);
          }
        );

        componentContext.currentPointStars.push(finalObject);
      }
    }

    // Load leaderboard data
    componentContext.getLeaderBoard();    
  },
};
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@600&display=swap");

@font-face {
  font-family: "MAG-Font";
  src: url("~@/assets/fonts/MAG-Font.woff2") format("woff2"),
    url("~@/assets/fonts/MAG-Font.woff") format("woff"),
    url("~@/assets/fonts/MAG-Font.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "MAG-Font";
  src: url("~@/assets/fonts/MAG-Font_1.woff2") format("woff2"),
    url("~@/assets/fonts/MAG-Font_1.woff") format("woff"),
    url("~@/assets/fonts/MAG-Font_1.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

// Game
#BUG {
  position: relative;
  height: 100%;
  width: 100%;
  transition: background-color 2.5s;
  font-family: "Roboto Mono", monospace;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.Page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  text-align: center;
  transition: background-color 2.5s;
}
#Dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.Logo {
  display: block;
  margin: 0 auto;
  margin-bottom: 40px;
  width: 100%;
  max-width: 340px;
}
#PhaserGame {
  cursor: crosshair;
}

// HUD
.PostGame_Overlay {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  text-align: center;
}
.PostGame_Message {
  font-family: "MAG-Font";
  font-size: 7.5em;
  color: white;
}
.HUD_Bottom {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  .HUD_Bottom_Left {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-grow: 1;
    text-align: left;
  }
  .HUD_Bottom_Right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-grow: 1;
    text-align: right;
  }

  .HUD_Life {
    padding: 0 10px;
  }
  .HUD_LifeBar {
    height: 5px;
    .HUD_LifeBar_Fill{
      transition: all 0.1s;
      height: 100%;
    }
    &[data-level="high"] {
      .HUD_LifeBar_Fill{
        background: rgba(255, 255, 255, 0.45);
      }
    }
    &[data-level="med"] {
      .HUD_LifeBar_Fill{
        background: #FCE00A;
      }
    }
    &[data-level="low"] {
      .HUD_LifeBar_Fill{
        background: #EF3A65;
      }
    }
  }
  .HUD_Lives {
    width: 25px;
    height: 20px;
    background: url("~@/assets/hud-life.svg");
    display: inline-block;
    margin: 0 5px;
  }
}
.TotalScore {
  font-family: "MAG-Font";
  font-size: 100px;
  color: #fce00a;
}

.Controls {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}
.Button {
  cursor: pointer;
  width: 100%;
  font-family: "Roboto Mono";
  font-size: 20px;
  font-weight: 600;
  box-shadow: -4px 4px 0px 3px #00b7ff;
  background: blue;
  color: white;
  padding: 12.5px 20px;
  margin-bottom: 15px;
  transition: transform 0.1s;

  &[data-color="magenta"] {
    background-color: #8b0975;
  }
  &[data-color="purple"] {
    background-color: #380762;
  }

  &:hover {
    transform: scale(1.05);
  }
}

[data-background="violet"] {
  background-color: #202a51;
}
[data-background="navy"] {
  background-color: #1e2235;
}
[data-background="jazz"] {
  background-color: #16235b;
}
[data-background="purple"] {
  background-color: #341c47;
}
[data-background="black"] {
  background-color: #000;
}
[data-background="fx"] {
  background-color: rgba(0, 0, 0, 0.692);
}
[data-background="steps"] {
  transition: background-color 0.1s;
  &[data-audio-step="1"] {
    background: #160C1E;
  }
  &[data-audio-step="2"] {
    background: #060F2D;
  }
  &[data-audio-step="3"] {
    background: #031723;
  }
  &[data-audio-step="4"] {
    background: #060321;
  }
  &[data-audio-step="5"] {
    background: #001151;
  }
  &[data-audio-step="6"] {
    background: #1F0438;
  }
}

.Audio_Background {
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  transition: all 0.5s;
  -webkit-transition: all 0.5s;
  z-index: -1;

  flex-wrap: wrap;
  [data-level] {
    opacity: 0;
    flex-grow: 1;
    min-width: 50px;
  }
  [data-level="0"],
  [data-level="1"],
  [data-level="2"] {
    background: #ff7887;
  }
  [data-level="2"],
  [data-level="3"],
  [data-level="4"],
  [data-level="5"],
  [data-level="6"],
  [data-level="7"] {
    background: #ffa371;
  }
  [data-level="8"],
  [data-level="9"],
  [data-level="10"],
  [data-level="11"],
  [data-level="12"],
  [data-level="13"] {
    background: #fff06d;
  }
  [data-level="9"],
  [data-level="10"],
  [data-level="11"],
  [data-level="12"],
  [data-level="13"],
  [data-level="14"] {
    background: #d8ff83;
  }
  [data-level="15"],
  [data-level="16"],
  [data-level="17"],
  [data-level="18"],
  [data-level="19"],
  [data-level="20"] {
    background: #73c0ff;
  }
  [data-level="21"],
  [data-level="22"],
  [data-level="23"],
  [data-level="24"],
  [data-level="25"],
  [data-level="26"] {
    background: #bc88ff;
  }
  [data-level="27"],
  [data-level="28"],
  [data-level="29"],
  [data-level="30"],
  [data-level="31"],
  [data-level="32"] {
    background: #ff8be6;
  }
}

[data-background="burgundy"] {
  background-color: #42061a;
  transition: background-color 0.5s;
  .Button {
    &[data-color="magenta"] {
      background-color: #cc3154;
    }
    &[data-color="purple"] {
      background-color: #380762;
    }
    box-shadow: -4px 4px 0px 3px #fce00a;
  }
}

[data-text-color="yellow"] {
  color: #fce00a;
}

.shake {
	-webkit-animation: shake 0.05s linear infinite both;
	        animation: shake 0.05s linear infinite both;
}
@keyframes shake {
  0% {
    -webkit-transform: translate(0);
            transform: translate(0);
  }
  20% {
    -webkit-transform: translate(-5px, 5px);
            transform: translate(-5px, 5px);
  }
  40% {
    -webkit-transform: translate(-5px, 5px);
            transform: translate(-5px, 5px);
  }
  60% {
    -webkit-transform: translate(5px, 5px);
            transform: translate(5px, 5px);
  }
  80% {
    -webkit-transform: translate(5px, 5px);
            transform: translate(5px, 5px);
  }
  100% {
    -webkit-transform: translate(0);
            transform: translate(0);
  }
}

.LeaderBoard_Table {
  font-family: "Roboto Mono";
  background: #1E2235;
  color: white;
  margin: 20px;

}
.LeaderBoard_TableHeader {
  background: #2D3B70;
  font-family: "MAG-Font";
  font-size: 60px;
  padding: 5px 10px;
}
.LeaderBoard_TableBody {
 background: #370C45;
 table {
   width: 100%;
   border-collapse: collapse;
 }
}
.LeaderBoard_Table_Entry {
  padding: 5px 10px;
  &:nth-child(odd) {background: #3A4F93;}
  &:nth-child(even) {background: #2D3B70;}
  &[data-user-entry] {
    color: #fce00a;
  }
  font-size: 20px;
}
.LeaderBoard_Player {

}
.LeaderBoard_Score {

}
#Name_Input {
  color: white;
  margin-bottom: 10px;
  .Name_Input_Instructions {
    color: white;
    font-size: 22px;
    margin-bottom: 10px;
    text-align: left;
    color: white;
  }
  input {
    background: white;
    font-size: 32px;
    padding: 10px;
    border: none;
    outline: none;
    font-family: "Roboto Mono", monospace;
    color: #1e2235;
  }
}
</style>
