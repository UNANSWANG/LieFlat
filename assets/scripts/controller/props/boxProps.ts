import { _decorator } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { JsonPropsData, propsConfig } from '../../json/jsonProps';
import { tilePropsType } from '../tileItemController';
const { ccclass } = _decorator;

@ccclass('boxProps')
export class boxProps extends gamePropsBase {
    /**等待时间（不读表） */
    waitTime: number = 2;

    /**道具开始生效 */
    startProps() {
        this.scheduleOnce(this.playDisappearAnim, this.waitTime);
    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

    /**消失时随机生成道具替代魔盒 */
    onDisappear() {
        let tileItemComp = this.tileItemComp;
        let propsData = this.getRandomBuildablePropsData();
        if (!tileItemComp || !propsData) {
            return;
        }

        setTimeout(() => {
            tileItemComp.addProps(propsData.propsType as tilePropsType, propsData.level - 1);
        }, 0);
    }

    /**获取未达到房间生成上限的随机道具 */
    private getRandomBuildablePropsData() {
        let randomPropsData = propsConfig.getRandomPropsData();
        let result: JsonPropsData[] = [];

        for (let i = 0; i < randomPropsData.length; i++) {
            let propsData = randomPropsData[i];
            if (this.isBuildNumLimit(propsData)) {
                continue;
            }

            result.push(propsData);
        }

        if (result.length == 0) {
            return null;
        }

        let randomIdx = Math.floor(Math.random() * result.length);
        return result[randomIdx];
    }

    /**是否达到当前房间建造数量上限 */
    private isBuildNumLimit(propsData: JsonPropsData) {
        if (!propsData?.builNumMax || propsData.builNumMax <= 0) {
            return false;
        }

        let buildCount = this.gameComp?.getRoomPropsCountByType(this.roomIdx, propsData.propsType) || 0;
        return buildCount >= propsData.builNumMax;
    }

}


