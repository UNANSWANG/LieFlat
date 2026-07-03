import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { configData } from '../../manager/configData';
import { pData } from '../../manager/playerData';
import { playerMgr } from '../../manager/playerManager';
import { produceType } from '../../UIPage/tips/produceTips';
import { gm } from '../../manager/gm';
const { ccclass, property } = _decorator;

@ccclass('printerProps')
export class printerProps extends gamePropsBase {
    /**道具开始生效 */
    startProps() {
        this.startProduceCoin();
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

        //是当前游戏玩家的印钞机则增加游戏金币
        if (this.roomIdx == playerMgr.playerComp.roomIdx) {
            pData.fixGameCoin(this.addNum);
        }
    }
}


