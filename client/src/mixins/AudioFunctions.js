import Vue from 'vue';
import _ from 'lodash';
import { Howl, Howler } from 'howler';
export const AudioFunctions = {
    methods: {
        playBeat(componentContext) {
            Howler.stop()
            const methodsReference = this;
            if (componentContext.currentLevel.soundObject) {
            componentContext.currentLevel.soundObject.volume(1);
            componentContext.currentLevel.soundObject.play();
            } else {
                methodsReference.loadSound(componentContext);
            }
        },
        stopSound(componentContext) {

            // Fade out then stop
            const fadeOutTime = 500;
            componentContext.currentLevel.soundObject.fade(1, 0, 500);
            componentContext.currentLevel.fadeTimer = setTimeout(function(){
                componentContext.currentLevel.soundObject.stop();
            }, fadeOutTime);
            
        },
        pauseSound(componentContext) {
            componentContext.currentLevel.soundObject.play();
        },
        updateCurrentTime(componentContext) {
            var currentTime = componentContext.currentLevel.soundObject.seek() || 0;
        },
        loadSound(componentContext) {
            var data = {
                methodsReference: this
            };
            
            // Clear fade timer
            if (componentContext.currentLevel.fadeTimer) {
                clearTimout(componentContext.currentLevel.fadeTimer);
            }

            // Create sound object
            Vue.set(componentContext.currentLevel, 'soundObject', new Howl({
                src: './audio/'+ componentContext.currentLevel.filename + '.mp3',
                volume: 1,

                // Events
                onplay: function () {
                    data.methodsReference.updateCurrentTime(componentContext, componentContext.currentLevel.soundObject);
                    componentContext.soundObjectRAF = requestAnimationFrame(updateProgress.bind(componentContext.currentLevel.soundObject));
                },
                onload: function () {
                    Vue.set(componentContext.currentLevel, 'duration', componentContext.currentLevel.soundObject._duration);
                    data.methodsReference.playBeat(componentContext);
                },
                onend: function () {
                    cancelAnimationFrame(componentContext.soundObjectRAF);
                    var nextIndex = componentContext.levels.findIndex(song => song._id === componentContext.currentLevel._id) + 1;
                    if (nextIndex === componentContext.levels.length) {
                        componentContext.endGame();
                    } else {
                        componentContext.currentLevel = componentContext.levels[nextIndex]; // Set next level
                        componentContext.startLevel(); // Start level
                    }
                },
                onpause: function () {
                    cancelAnimationFrame(componentContext.soundObjectRAF);
                },
                onstop: function () {
                    cancelAnimationFrame(componentContext.soundObjectRAF);
                },
                onseek: function () {
                    data.methodsReference.updateCurrentTime(componentContext, componentContext.currentLevel.soundObject);
                    componentContext.soundObjectRAF = requestAnimationFrame(updateProgress.bind(componentContext.currentLevel.soundObject));
                }
            }));

            // Effects
            // Create an analyser node in the Howler WebAudio context
            var context = Howler.ctx;
            const audioSourceNode = context.createBufferSource(componentContext.currentLevel.soundObject);
            var analyser = context.createAnalyser();
            analyser.fftSize = 1024;
            const bufferLength = analyser.frequencyBinCount;

            var dataArray;
            var mode = 2;
            if (mode === 1) {
                dataArray = new Float32Array(analyser.fftSize);
            } else {
                dataArray = new Uint8Array(analyser.fftSize);
            }

            audioSourceNode.connect(analyser);
            Howler.masterGain.connect(analyser);

            // Get levels
            function getLevels() {
                var levelsHertz = [];
                var levelsPerc = [];
                var sectionSplit = 16;
                var sections = bufferLength / sectionSplit;
                if (mode === 1 || mode === 2) {
                    var finalArray = dataArray;
                    if (mode === 2) {
                        finalArray = Float32Array.from(dataArray)
                    }

                    for (let sec = 0; sec < sections; sec++) {
                        const minBin = (sec * sectionSplit);
                        const maxBin = ((sec + 1) * sectionSplit);
                        const numOfBins = maxBin - minBin;
                        let binItems = 0;
                        for (let i = minBin; i < maxBin; i++) {
                            var calcNum = finalArray[i];
                            if (mode === 2) {
                                calcNum = (calcNum - 128) / 128;
                            }

                            binItems += calcNum ** 2;
                        }
                        const hertz = 10 * Math.log10(binItems / numOfBins);
                        const perc = (100 + (hertz)).toFixed();
                        levelsHertz.push(hertz);
                        levelsPerc.push(perc);
                    }
                }

                // Update levels
                var levels = {
                    'hertz': levelsHertz,
                    'perc': levelsPerc
                }
                Vue.set(componentContext.audio, 'levels', levels);
                return levels;
            }
            function detectLevel(options) {
                var hertzTest = true;
                var levels = getLevels();

                if (options.mode === 'any') {
                    if (options.aboveLevel) {
                        var anyAbove = false;
                        for (let levelIndex = options.aboveLevel; levelIndex < levels.hertz.length; levelIndex++) {
                            if (levels.hertz[levelIndex] > (options.threshold)) { anyAbove = true }
                        }
                        if (options.excludeBelow) {
                            for (let levelIndex = 0; levelIndex < options.excludeBelow; levelIndex++) {
                                if (levels.hertz[levelIndex] > (options.threshold)) {
                                    anyAbove = false
                                }
                            }
                        }
                        if (anyAbove === false) {
                            hertzTest = false;
                        }
                    }
                }
                else {
                    var numOfLevels = options.maxLevel - options.minLevel;
                    var levelItems = 0;
                    for (let levelIndex = options.minLevel; levelIndex < options.maxLevel; levelIndex++) {
                        levelItems += levels.hertz[levelIndex];
                    }
                    const includeHertz = (levelItems / numOfLevels);
                    var excludeHertz;
                    if (options.minExclude) {
                        var numOfExLevels = options.maxExclude - options.minExclude;
                        var exLevelItems = 0;
                        for (let exLevelIndex = options.minExclude; exLevelIndex < options.maxExclude; exLevelIndex++) {
                            exLevelItems += levels.hertz[exLevelIndex];
                        }
                        excludeHertz = (exLevelItems / numOfExLevels);
                    }

                    if (includeHertz < (options.threshold)) { hertzTest = false }
                    if (excludeHertz && excludeHertz > (options.exThreshold)) { hertzTest = false }
                }
                if (hertzTest === true) {
                    Vue.set(componentContext.audio, options.name, true);
                    const songTimer = options.name + 'Timer';
                    if (componentContext.audio[songTimer]) {
                        clearTimeout(componentContext.audio[songTimer]);
                    }
                    Vue.set(componentContext.audio, songTimer, setTimeout(function () {
                        Vue.set(componentContext.audio, options.name, false);
                        Vue.set(componentContext.audio, songTimer, "");
                    }, options.release));

                    // Bass steps
                    if (options.bassSteps) {
                        if (1 === 1 /*componentContext.currentLevel.bassSteps && componentContext.currentLevel.bassSteps.current !== false*/) {
                            if (1 === 1 /*componentContext.bassSteps['trigger'] === true*/) {
                                Vue.set(componentContext.audio.bassSteps, 'trigger', false); // Trigger off

                                // Next step
                                var newStep = componentContext.audio.bassSteps.current + 1 > options.bassSteps.count ? 0 :
                                    componentContext.audio.bassSteps.current + 1;
                                Vue.set(componentContext.audio.bassSteps, 'current', newStep);

                                // Trigger timer
                                Vue.set(componentContext.audio.bassSteps, 'timer', setTimeout(function () {
                                    Vue.set(componentContext.audio.bassSteps, 'trigger', true); // Trigger on
                                }, '100'));
                            }
                        } else {
                            Vue.set(componentContext, 'audio.bassSteps.trigger', false); // Trigger off
                            Vue.set(componentContext, 'audio.bassSteps', { 'current': 0 }); // Initial step

                            // Trigger timer
                            Vue.set(componentContext.audio.bassSteps, 'timer', setTimeout(function () {
                                Vue.set(componentContext.audio.bassSteps, 'trigger', true); // Trigger on
                            }, '87.5'));
                        }
                    }
                }
            }
            var previousDelta = 0,
                fpsLimit = 60;
            function updateProgress(currentDelta) {
                var object = this;
                var delta = currentDelta - previousDelta;
                if (fpsLimit && delta < 1000 / fpsLimit) {
                    // Wait
                } else {
                    // If sound node exists in this moment
                    if (object._sounds[0]) {
                        data.methodsReference.updateCurrentTime(componentContext, object);

                            // Frequency animate
                            if (mode === 1) {
                                analyser.getFloatTimeDomainData(dataArray)
                            } else if (mode === 2) {
                                analyser.getByteTimeDomainData(dataArray);
                            }
                            getLevels();

                            // Deep Bass
                            detectLevel({
                                name: 'deepBass',
                                minLevel: 1,
                                maxLevel: 7,
                                threshold: -5,
                                release: 250,
                                bassSteps: {
                                    power: true,
                                    count: 6
                                }
                            });

                            // Crazy Bass
                            detectLevel({
                                name: 'crazyBass',
                                minLevel: 1,
                                maxLevel: 4,
                                threshold: -3,
                                release: 250
                            });

                            // Mid Bass
                            detectLevel({
                                name: 'midBass',
                                minLevel: 5,
                                maxLevel: 10,
                                threshold: -10,
                                release: 250
                            });

                            // Trebel
                            detectLevel({
                                name: 'treble',
                                mode: 'any',
                                aboveLevel: 25,
                                threshold: -10,
                                excludeBelow: 20,
                                exThreshold: -40,
                                release: 50
                            });

                    }
                    previousDelta = currentDelta;
                }
                if (object.playing()) {
                    componentContext.soundObjectRAF = requestAnimationFrame(updateProgress.bind(object));
                }
            }
        }
    }
}