import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { propsConfig } from '../../json/jsonProps';
import { tilePropsType } from '../tileItemController';
import { configData } from '../../manager/configData';
import { pData } from '../../manager/playerData';
import { playerMgr } from '../../manager/playerManager';
import { produceType } from '../../UIPage/tips/produceTips';
import { gm } from '../../manager/gm';
const { ccclass, property } = _decorator;

@ccclass('generatorProps')
export class generatorProps extends gamePropsBase {

    /**道具开始生效 */
    startProps() {
        this.startProducePower();
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
        if (this.roomIdx == playerMgr.playerComp.roomIdx) {
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


