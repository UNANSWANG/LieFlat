import { _decorator, AssetManager, AudioClip, AudioSource, Component, Node } from 'cc';
import { audioPath } from './pathConfig';
import { uiMgr } from './UIManager';
import { ccStorageTools } from '../extention/storageTools';
import { SaveKey } from './configData';
const { ccclass, property } = _decorator;

@ccclass('audioManager')
export class audioManager {
    /**音频组件 */
    private audios: AudioSource[] = null;
    /**背景音乐组件 */
    private musicSource: AudioSource = null;
    /**当前音频索引 */
    private _curAudioSource: number = 0;
    /**已加载完的音频 */
    private _dic: Map<string, AudioClip> = new Map();
    /**正在加载的音频 */
    private dic_loading: Map<string, number> = new Map();
    /**默认音效使用的音频组件 */
    private _audioSource: AudioSource = null;
    /**音效开关 */
    private _isEffect: boolean = true;
    /**背景音乐开关 */
    private _isMusic: boolean = true;
    /**振动开关 */
    private _isVibrat: boolean = true;
    /**正在播放的背景音乐 */
    private _curMusicPath: string = audioPath.background;

    /**初始化音频管理 */
    initAudio(node) {
        this.audios = [];
        for (let i = 0; i < 10; i++) {
            let audio = node.addComponent(AudioSource);
            this.audios.push(audio);
        }
        this.musicSource = node.addComponent(AudioSource);
        this.musicSource.loop = true;

        this.initStorageData();

        //获取一个音频组件并打断所有语音
        this._audioSource = this.getOneSoundAudio(false);
    }

    /**初始化内存的存储数据 */
    initStorageData() {
        let effectSave = ccStorageTools.getData(SaveKey.effect);
        let musicSave = ccStorageTools.getData(SaveKey.music);
        let vibratSave = ccStorageTools.getData(SaveKey.vibrat);

        if (effectSave != null) {
            this._isEffect = effectSave;
        }

        if (musicSave != null) {
            this._isMusic = musicSave;
        }

        if (vibratSave != null) {
            this._isVibrat = vibratSave;
        }
    }

    get isEffect() {
        return this._isEffect;
    }

    get isMusic() {
        return this._isMusic;
    }

    get isVibrat() {
        return this._isVibrat;
    }

    /**关闭所有音频 */
    closeAllSound() {
        for (let i = 0; i < this.audios.length; i++) {
            this.audios[i].stop();
        }
    }

    /**切换音效开关 */
    switchEffect($isEffect: boolean) {
        this._isEffect = $isEffect;
        ccStorageTools.setData(SaveKey.effect, $isEffect);
        if (!this._isEffect) {
            this.closeAllSound();
        }
    }

    /**切换背景音乐开关 */
    switchMusic($isMusic: boolean) {
        this._isMusic = $isMusic;
        ccStorageTools.setData(SaveKey.music, $isMusic);
        if (!this._isMusic) {
            this.closeBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
    }

    /**关闭背景音乐 */
    closeBackgroundMusic() {
        this.musicSource.stop();
    }

    /**切换振动开关 */
    switchVibrat($isVibrat: boolean) {
        this._isVibrat = $isVibrat;
        ccStorageTools.setData(SaveKey.vibrat, $isVibrat);
    }

    /**获取一个音频组件 */
    getOneSoundAudio(closeSound = true) {
        // 先打断所有的语音
        if (closeSound) this.closeAllSound();
        let cur = this._curAudioSource;
        this._curAudioSource++;
        if (this._curAudioSource >= this.audios.length) {
            this._curAudioSource = 0;
        }
        return this.audios[cur];
    }

    /**播放音效（单次音效播放（互不干涉） */
    playEffect($name: string, bundle: AssetManager.Bundle = uiMgr.resBundle) {
        if (!this._isEffect || !bundle) {
            return;
        }
        let key = $name;
        //正在加载则直接返回
        if (this.dic_loading.has(key)) {
            return;
        }
        if (this._dic.has(key)) {
            this._audioSource.playOneShot(this._dic.get(key));
            return;
        } else {
            this.dic_loading.set(key, 1);
            bundle.load($name, AudioClip, (err, res) => {
                if (!res) {
                    console.error("没有找到声音资源>>>", $name);
                    return;
                }
                this.dic_loading.delete(key);
                this._dic.set(key, res);
                this._audioSource.playOneShot(res);
            });
        }
    }

    /**播放背景音乐（单次播放，互不干涉） */
    playBackgroundMusic($name: string = this._curMusicPath, bundle: AssetManager.Bundle = uiMgr.resBundle) {
        if (!this._isMusic || !bundle) {
            return;
        }
        let key = $name;
        if (this.dic_loading.has(key)) {
            return;
        }
        if (this._dic.has(key)) {
            this.musicSource.clip = this._dic.get(key);
            this.musicSource.play();
            this._curMusicPath = $name;
            return;
        } else {
            this.dic_loading.set(key, 1);
            bundle.load($name, AudioClip, (err, res) => {
                if (!res) {
                    console.error("没有找到声音资源>>>", $name);
                    return;
                }
                this.dic_loading.delete(key);
                this._dic.set(key, res);

                this.musicSource.clip = res;
                this.musicSource.play();
                this._curMusicPath = $name;
            });
        }
    }

    /**播放音频（单次播放，互不干涉） */
    playMusic($name: string = this._curMusicPath, bundle: AssetManager.Bundle = uiMgr.resBundle) {
        if (!this._isMusic || !bundle) {
            return;
        }
        let key = $name;
        if (this.dic_loading.has(key)) {
            return;
        }
        if (this._dic.has(key)) {
            let audio = this.getOneSoundAudio(false);
            audio.clip = this._dic.get(key);
            audio.play();
            return;
        } else {
            this.dic_loading.set(key, 1);
            bundle.load($name, AudioClip, (err, res) => {
                if (!res) {
                    console.error("没有找到声音资源>>>", $name);
                    return;
                }
                this.dic_loading.delete(key);
                this._dic.set(key, res);
                //获取一个音频组件并打断所有语音
                let audio = this.getOneSoundAudio(false);
                audio.clip = res;
                audio.play();
            });
        }
    }

    /**播放音频时打断上一个（适用于语音）*/
    playOnceMusic($name: string, bundle: AssetManager.Bundle = uiMgr.resBundle) {
        if (!this._isMusic || !bundle) {
            return;
        }
        let key = $name;
        if (this.dic_loading.has(key)) {
            return;
        }
        if (this._dic.has(key)) {
            let audio = this.getOneSoundAudio();
            audio.clip = this._dic.get(key);
            audio.play();
            return;
        } else {
            this.dic_loading.set(key, 1);
            bundle.load($name, AudioClip, (err, res) => {
                if (!res) {
                    console.error("没有找到声音资源>>>", $name);
                    return;
                }
                this.dic_loading.delete(key);
                this._dic.set(key, res);
                //获取一个音频组件并打断所有语音
                let audio = this.getOneSoundAudio();
                audio.clip = res;
                audio.play();
            });
        }
    }
}
export let audioMgr = new audioManager();