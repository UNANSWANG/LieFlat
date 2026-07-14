import { _decorator, tween, Tween, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { ccTools } from '../../extention/generalTools';
import { imgPath } from '../../manager/pathConfig';
const { ccclass } = _decorator;

@ccclass('machineProps')
export class machineProps extends gamePropsBase {
    /**每个修复台为同房间门增加的修复速度（每秒修复百分比） */
    static machineRepairSpeedAdd: number = 2;
    /**图2左右摇晃角度 */
    private swingAngle: number = 8;
    /**图2单次摇晃时长 */
    private swingDuration: number = 0.2;

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        machineProps.machineRepairSpeedAdd = commonConfig.getValueNumber("machineRepairSpeedAdd");
    }

    /**初始化道具图片 */
    initPropsImg() {
        super.initPropsImg();
        ccTools.loadImg(this.img2, imgPath.gamePprops + this.propsType);
        this.img2.node.position = new Vec3(0, 3, 0);
    }

    /**获取指定房间内修复台提供的门修复速度加成 */
    static getDoorRepairSpeedAdd(gameComp: any, roomIdx: number) {
        if (!gameComp || roomIdx <= 0) {
            return 0;
        }

        let machineCount = gameComp.getRoomPropsCountByType(roomIdx, "machine");
        return machineCount * machineProps.machineRepairSpeedAdd;
    }

    /**道具开始生效 */
    startProps() {
        super.startProps();
        this.playSwingAnim();
    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.stopSwingAnim();
    }

    /**播放图2循环左右摇晃动画 */
    private playSwingAnim() {
        if (!this.img2?.node) {
            return;
        }

        Tween.stopAllByTarget(this.img2.node);
        tween(this.img2.node)
            .set({ angle: 0 })
            .to(this.swingDuration, { angle: -this.swingAngle })
            .to(this.swingDuration * 2, { angle: this.swingAngle })
            .to(this.swingDuration, { angle: 0 })
            .union()
            .repeatForever()
            .start();
    }

    /**停止图2摇晃动画并恢复状态 */
    private stopSwingAnim() {
        if (!this.img2?.node) {
            return;
        }

        Tween.stopAllByTarget(this.img2.node);
        this.img2.node.angle = 0;
        this.img2.node.position = Vec3.ZERO;
    }
}
