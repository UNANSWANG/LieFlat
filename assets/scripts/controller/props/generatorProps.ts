import { _decorator, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { configData } from '../../manager/configData';
import { pData } from '../../manager/playerData';
import { playerMgr } from '../../manager/playerManager';
import { produceType } from '../../UIPage/tips/produceTips';
import { gm } from '../../manager/gm';
import { roleState } from '../roleController';
import { ccTools } from '../../extention/generalTools';
import { imgPath } from '../../manager/pathConfig';
const { ccclass } = _decorator;

@ccclass('generatorProps')
export class generatorProps extends gamePropsBase {
    /**当前是否显示底图 */
    private isShowBaseImg: boolean = true;

    /**初始化道具图片 */
    initPropsImg() {
        super.initPropsImg();
        ccTools.loadImg(this.img2, imgPath.gamePprops + this.propsType + "_" + this.level + "_1");
        this.showBaseImg();

        this.scaleNode.position = new Vec3(0, 5, 0);
    }

    /**道具开始生效 */
    startProps() {
        super.startProps();
        this.startSwitchImg();
        this.startProducePower();
    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.stopProducePower();
        this.showBaseImg();
    }

    /**开始循环切换图1和图2显隐 */
    private startSwitchImg() {
        this.unschedule(this.switchImg);
        this.schedule(this.switchImg, configData.propsImgSwitchSpeed);
    }

    /**切换图1和图2显隐 */
    private switchImg() {
        this.isShowBaseImg = !this.isShowBaseImg;
        this.img1.node.active = this.isShowBaseImg;
        this.img2.node.active = !this.isShowBaseImg;
    }

    /**显示底图 */
    private showBaseImg() {
        this.isShowBaseImg = true;
        this.img1.node.active = true;
        this.img2.node.active = false;
    }

    /**开始生产电能 */
    startProducePower() {
        this.stopProducePower();
        let interval = configData.producePowerFreq;
        if(this.level == 0){
            interval *= 2;
        }
        this.schedule(this.producePower, interval);
    }

    /**停止生产电能 */
    stopProducePower() {
        this.unschedule(this.producePower);
    }

    get addNum() {
        if (this.level >= this.maxLevel || this.level < 0) {
            return 0;
        }
        return this.propsDatas[this.level].producePower;
    }

    /**生产电能 */
    producePower() {
        if (gm.isGamePause) {
            return;
        }

        this.playScaleDownAnim();
        this.produceItem(produceType.power, this.addNum);

        //是当前游戏玩家的发电机则增加游戏电能
        if (this.roomIdx == playerMgr.playerComp.roomIdx && playerMgr.playerComp.state == roleState.bed) {
            pData.fixGamePower(this.addNum);
        }
    }

    upgradeProps(): void {
        super.upgradeProps();
        if(this.level == 1){
            this.startProducePower();
        }
    }
}


