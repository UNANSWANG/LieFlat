import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import type { enemyBaseController } from '../enemy/enemyBaseController';
import { uiMgr } from '../../manager/UIManager';
import { netController } from '../netController';
import { imgPath } from '../../manager/pathConfig';
import { tilePropsType } from '../tileItemController';
import { poolMgr } from '../../manager/poolManager';
const { ccclass, property } = _decorator;

@ccclass('netProps')
export class netProps extends gamePropsBase {
    /**网住敌人的时间 */
    netDuration: number = 2;
    /**渔网发射目标 */
    private targetEnemy: enemyBaseController = null;
    /**是否已经触发 */
    private hasTriggered: boolean = false;
    /**临时本地坐标 */
    private tempLocalPos: Vec3 = new Vec3();

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.netDuration = commonConfig.getValueNumber("netDuration");
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.targetEnemy = null;
        this.hasTriggered = false;
    }

    /**消失时向敌人发射渔网 */
    onDisappear() {
        this.shootNet();
    }

    /**触发指定房间内渔网 */
    static tryTriggerRoomNet(gameComp: any, roomIdx: number, target: enemyBaseController) {
        let netComp = netProps.getRoomNetComp(gameComp, roomIdx);
        if (!netComp || netComp.hasTriggered || !target || !target.node || !target.node.isValid) {
            return false;
        }

        netComp.hasTriggered = true;
        netComp.targetEnemy = target;
        netComp.playDisappearAnim();
        return true;
    }

    /**获取指定房间内正在生效的渔网 */
    private static getRoomNetComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.net && propComp.isPropsActive) {
                return propComp as netProps;
            }
        }

        return null;
    }

    /**发射渔网 */
    private shootNet() {
        if (!this.targetEnemy || !this.targetEnemy.node || !this.targetEnemy.node.isValid || !uiMgr.gameSpriteItemPrefab) {
            return;
        }

        let netNode = poolMgr.getGameSpriteNode(uiMgr.gameSpriteItemPrefab);
        this.gameComp.gameUINode.addChild(netNode);

        let parentTransform = netNode.parent?.getComponent(UITransform);
        if (parentTransform) {
            parentTransform.convertToNodeSpaceAR(this.node.worldPosition, this.tempLocalPos);
        } else {
            this.tempLocalPos.set(this.node.worldPosition);
        }
        netNode.setPosition(this.tempLocalPos);

        let netComp = netNode.getComponent(netController);
        if (!netComp) {
            netComp = netNode.addComponent(netController);
        }
        netComp.enabled = true;

        netComp.init(this.targetEnemy, this.netDuration, imgPath.gamePprops + this.propsType + "_" + this.level);
        this.targetEnemy = null;
    }
}
