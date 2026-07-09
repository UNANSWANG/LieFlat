import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { ccTools } from '../../extention/generalTools';
import { imgPath } from '../../manager/pathConfig';
import { configData } from '../../manager/configData';
import { playerMgr } from '../../manager/playerManager';
import { pData } from '../../manager/playerData';
import { produceType } from '../../UIPage/tips/produceTips';
import { propsConfig } from '../../json/jsonProps';
import { tilePropsType } from '../tileItemController';
import { gm } from '../../manager/gm';
import { roleState } from '../roleController';
const { ccclass, property } = _decorator;

@ccclass('bedProps')
export class bedProps extends gamePropsBase {
    /**床是否被占用 */
    isOccupied: boolean = false;
    /**是否被机器人占用（玩家可以正常使用） */
    isRobotOccupied: boolean = false;
    /**是否正在生产金币 */
    isProduceCoin: boolean = false;

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.isProduceCoin = false;
        this.stopProduceCoin();
    }

    /**操作床 */
    operateProps() {
        this.isOccupied = true;
        return this.isOccupied;
    }

    /**显示角色 */
    showRole(skinId: number) {
        this.isRobotOccupied = true;
        this.isOccupied = true;

        //TODO 临时写的角色皮肤
        ccTools.loadImg(this.img2, imgPath.roleSkin + 0);
        this.img2.node.scale = new Vec3(0.5, 0.5, 1);

        //生产金币
        this.isProduceCoin = true;
        this.startProduceCoin();
    }

    /**检测是否重新开始生产金币 */
    checkReProduceCoin() {
        if (this.isProduceCoin) {
            this.startProduceCoin();
        }
    }

    /**开始生产金币 */
    startProduceCoin() {
        this.stopProduceCoin();
        this.schedule(this.produceCoin, configData.produceCoinFreq);
    }

    /**停止生产金币 */
    stopProduceCoin() {
        this.unschedule(this.produceCoin);
    }

    get addNum() {
        if (this.level >= this.maxLevel || this.level < 0) {
            return 0;
        }
        return this.propsDatas[this.level].produceCoin;
    }

    /**生产金币 */
    produceCoin() {
        if (gm.isGamePause) {
            return;
        }

        this.playScaleDownAnim();
        this.produceItem(produceType.coin, this.addNum);

        //是当前游戏玩家的床则增加游戏金币
        if (this.roomIdx == playerMgr.playerComp.roomIdx && playerMgr.playerComp.state == roleState.bed) {
            pData.fixGameCoin(this.addNum);
        }
    }

    /**初始化道具的图片(可重写，默认固定只有一个图片) */
    initPropsImg() {
        super.initPropsImg();
        ccTools.loadImg(this.img3, imgPath.gamePprops + "quilt_" + this.level);
    }
}


