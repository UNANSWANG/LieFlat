import { _decorator, Node, sp } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import type { enemyBaseController } from '../enemy/enemyBaseController';
import { uiMgr } from '../../manager/UIManager';
import { poolMgr } from '../../manager/poolManager';
import { ccTools } from '../../extention/generalTools';
import { spinePath } from '../../manager/pathConfig';
const { ccclass } = _decorator;

@ccclass('alarmProps')
export class alarmProps extends gamePropsBase {
    /**触发生命阈值 */
    alarmThresholdHealth: number = 0.5;
    /**是否已经触发 */
    private hasTriggered: boolean = false;
    /**警示铃spine节点 */
    private alarmNode: Node = null;

    /**初始化道具的图片 */
    initPropsImg() {
        this.createAlarmNode();
    }

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.alarmThresholdHealth = commonConfig.getValueNumber("alarmThresholdHealth") / 100;
    }

    /**创建警示铃spine节点 */
    private createAlarmNode() {
        this.clearAlarmNode();
        if (!uiMgr.gameItemPrefab || !this.img1?.node) {
            return;
        }

        this.alarmNode = poolMgr.getGameNode(uiMgr.gameItemPrefab);
        this.alarmNode.name = "alarmSpine";
        this.img1.node.addChild(this.alarmNode);

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
            poolMgr.putGameNode(this.alarmNode);
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
        if (!alarmComp || alarmComp.hasTriggered || !target || !target.node || !target.node.isValid || target.hpPercent >= alarmComp.alarmThresholdHealth) {
            return false;
        }

        alarmComp.hasTriggered = true;
        alarmComp.playDisappearAnim();
        target.forceChooseTargetExcludeRoom(roomIdx);
        return true;
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

}

