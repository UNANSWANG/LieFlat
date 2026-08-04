import { _decorator, Node, sp, tween, Tween, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import type { enemyBaseController } from '../enemy/enemyBaseController';
import { uiMgr } from '../../manager/UIManager';
import { poolMgr } from '../../manager/poolManager';
import { ccTools } from '../../extention/generalTools';
import { spinePath } from '../../manager/pathConfig';
import { doorProps } from './doorProps';
const { ccclass } = _decorator;

@ccclass('alarmProps')
export class alarmProps extends gamePropsBase {
    /**触发时的房门血量比例阈值 */
    alarmDoorHpThreshold: number = 0.5;
    /**是否已经触发 */
    private hasTriggered: boolean = false;
    /**警示铃spine节点 */
    private alarmNode: Node = null;

    clearData() {
        this.clearAlarmNode();
        super.clearData();
    }

    /**初始化道具的图片 */
    initPropsImg() {
        this.createAlarmNode();
    }

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.alarmDoorHpThreshold = commonConfig.getValueNumber("alarmThresholdHealth") / 100;
    }

    /**创建警示铃spine节点 */
    private createAlarmNode() {
        this.clearAlarmNode();
        if (!uiMgr.gameSpineItemPrefab || !this.img1?.node) {
            return;
        }

        this.alarmNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
        this.alarmNode.name = "alarmSpine";
        this.addSpineToImg(this.img1, this.alarmNode);

        let skeleton = poolMgr.getGameNodeSkeleton(this.alarmNode);
        if (skeleton) {
            this.playAlarmAnim(skeleton);
        }
    }

    /**播放警示铃animation循环动画 */
    private async playAlarmAnim(skeleton: sp.Skeleton) {
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.alarm);
        if (!isLoaded || !skeleton || !skeleton.isValid) {
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**清理警示铃spine节点 */
    private clearAlarmNode() {
        if (this.alarmNode && this.alarmNode.isValid) {
            poolMgr.putGameSpineNode(this.alarmNode);
        }

        this.alarmNode = null;
    }

    /**道具开始生效 */
    startProps() {
        this.hasTriggered = false;
    }

    /**道具结束生效 */
    endProps() {
        this.clearAlarmNode();
        super.endProps();
        this.hasTriggered = false;
    }

    /**尝试触发指定房间内的警示铃 */
    static tryTriggerRoomAlarm(gameComp: any, roomIdx: number, target: enemyBaseController) {
        let alarmComp = alarmProps.getRoomAlarmComp(gameComp, roomIdx);
        let doorComp = alarmProps.getRoomDoorComp(gameComp, roomIdx);
        if (!alarmComp || alarmComp.hasTriggered || !doorComp
            || !target || !target.node || !target.node.isValid
            || doorComp.hpPercent >= alarmComp.alarmDoorHpThreshold) {
            return false;
        }

        if (!target.forceChooseTargetExcludeRoom(roomIdx)) {
            return false;
        }

        alarmComp.hasTriggered = true;
        alarmComp.playUseAnim();
        return true;
    }

    /**播放警示铃使用动画：1秒内放大两倍，后0.5秒淡出 */
    private playUseAnim() {
        if (!this.scaleNode || !this.uiOpacity || !this.tileItemComp) {
            this.tileItemComp?.removeProps();
            return;
        }

        let startScale = this.scaleNode.scale.clone();
        let targetScale = new Vec3(startScale.x * 2, startScale.y * 2, startScale.z);
        this.uiOpacity.opacity = 255;
        Tween.stopAllByTarget(this.scaleNode);
        Tween.stopAllByTarget(this.uiOpacity);

        tween(this.scaleNode)
            .to(1, { scale: targetScale })
            .start();
        tween(this.uiOpacity)
            .delay(1)
            .to(1, { opacity: 0 })
            .call(() => {
                this.onDisappear();
                this.tileItemComp?.removeProps();
            })
            .start();
    }

    /**获取指定房间内正在生效的警示铃 */
    private static getRoomAlarmComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.alarm && propComp.isPropsActive) {
                return propComp as alarmProps;
            }
        }

        return null;
    }

    /**获取指定房间当前的房门 */
    private static getRoomDoorComp(gameComp: any, roomIdx: number) {
        let doorPos = gameComp?.roomMap?.[roomIdx]?.doorPos;
        if (!doorPos || roomIdx <= 0) {
            return null;
        }

        let tileItem = gameComp?.tileMap?.[doorPos.x]?.[doorPos.y]?.item;
        if (!tileItem || tileItem.tileType != tilePropsType.door) {
            return null;
        }

        return tileItem.propsComp as doorProps;
    }

}
