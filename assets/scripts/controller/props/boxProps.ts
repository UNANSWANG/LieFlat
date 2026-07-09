import { _decorator } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { JsonPropsData, propsConfig } from '../../json/jsonProps';
import { tilePropsType } from '../tileItemController';
const { ccclass } = _decorator;

@ccclass('boxProps')
export class boxProps extends gamePropsBase {
    /**等待时间（不读表） */
    waitTime: number = 2;
    /**剩余等待时间 */
    private disappearTimer: number = 0;

    /**道具开始生效 */
    startProps() {
        this.disappearTimer = this.waitTime;
    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.disappearTimer = 0;
    }

    protected update(dt: number): void {
        if (!this.isPropsActive || this.disappearTimer <= 0) {
            return;
        }

        this.disappearTimer = Math.max(0, this.disappearTimer - dt);
        if (this.disappearTimer <= 0) {
            this.playDisappearAnim();
        }
    }

    /**消失时随机生成道具替代魔盒 */
    onDisappear() {
        let tileItemComp = this.tileItemComp;
        let propsData = this.getRandomBuildablePropsData();
        if (!tileItemComp || !propsData) {
            return;
        }

        setTimeout(() => {
            tileItemComp.addProps(propsData.propsType as tilePropsType, this.getCreateLevelByPropsData(propsData));
        }, 0);
    }

    /**随机道具表等级从1开始，道具组件等级从0开始 */
    private getCreateLevelByPropsData(propsData: JsonPropsData) {
        return Math.max(0, (Number(propsData?.level) || 1) - 1);
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
