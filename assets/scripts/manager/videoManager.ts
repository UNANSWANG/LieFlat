import { _decorator, Component, Node } from 'cc';
import { gm, PlatType } from './gm';
const { ccclass, property } = _decorator;

@ccclass('videoManager')
export class videoManager {
    /**是否有广告 */
    isAd: boolean = true;

    /**观看广告 */
    watchVideo(complete?: (...arg: any[]) => void, noComplete?: (...arg: any[]) => void): void {
        let adCall = ()=>{
            complete && complete();
        }

        if (gm.platType != PlatType.h5 && this.isAd) {
            gm.API.watchVideo(adCall, noComplete);
        } else {
            console.log("没有广告平台,直接返回成功");
            adCall();
        }
    }
}
export let videoMgr = new videoManager();


