import { _decorator, tween, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import { playerMgr } from '../../manager/playerManager';
import { pData } from '../../manager/playerData';
import { produceType } from '../../UIPage/tips/produceTips';
const { ccclass } = _decorator;

@ccclass('printerProps')
export class printerProps extends gamePropsBase {
    /**获取金币倍率 */
    printerCoinMultiplier: number = 1;
    /**偷钱缩放动画是否播放中 */
    private isStealScalePlaying: boolean = false;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.printerCoinMultiplier = commonConfig.getValueNumber("printerCoinMultiplier");
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        this.isStealScalePlaying = false;
        super.endProps();
    }

    /**播放偷钱缩放动画，播放中不打断也不补播 */
    private playStealScaleAnim() {
        if (this.isStealScalePlaying || !this.scaleNode) {
            return;
        }

        this.isStealScalePlaying = true;
        tween(this.scaleNode)
            .set({ scale: new Vec3(1, 1, 1) })
            .to(0.05, { scale: new Vec3(0.9, 0.9, 1) })
            .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: "backOut" })
            .call(() => {
                this.isStealScalePlaying = false;
            })
            .start();
    }

    /** 获取指定房间内印钞机的金币倍率 */
    static getRoomCoinMultiplier(gameComp: any, roomIdx: number) {
        let printerComp = printerProps.getRoomPrinterComp(gameComp, roomIdx);
        if (!printerComp) {
            return 0;
        }

        return printerComp.printerCoinMultiplier;
    }

    /**炮台攻击时，通过房间内印钞机产出金币 */
    static produceCoinByCannonLevel(gameComp: any, roomIdx: number, cannonLevel: number) {
        if (roomIdx != playerMgr.playerComp?.roomIdx) {
            return;
        }

        let printerComp = printerProps.getRoomPrinterComp(gameComp, roomIdx);
        if (!printerComp || printerComp.printerCoinMultiplier <= 0) {
            return;
        }

        let coin = (cannonLevel + 1) * printerComp.printerCoinMultiplier;
        printerComp.playStealScaleAnim();
        printerComp.produceItem(produceType.coin, coin);
        pData.fixGameCoin(coin);
    }

    /** 获取指定房间内正在生效的印钞机 */
    private static getRoomPrinterComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.printer && propComp.isPropsActive) {
                return propComp as printerProps;
            }
        }

        return null;
    }

}
