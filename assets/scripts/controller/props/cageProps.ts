import { _decorator, instantiate, UITransform, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { tilePropsType } from '../tileItemController';
import type { enemyBaseController } from '../enemy/enemyBaseController';
import { uiMgr } from '../../manager/UIManager';
import { cageController } from '../cageController';
import { imgPath } from '../../manager/pathConfig';
const { ccclass } = _decorator;

@ccclass('cageProps')
export class cageProps extends gamePropsBase {
    /**控制时长 */
    static cageControlDuration: number = 3;
    /**道具淡出动画时长 */
    private static disappearDuration: number = 0.2;
    /**铁笼控制目标 */
    private targetEnemy: enemyBaseController = null;
    /**是否已经触发 */
    private hasTriggered: boolean = false;
    /**临时本地坐标 */
    private tempLocalPos: Vec3 = new Vec3();

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        cageProps.cageControlDuration = commonConfig.getValueNumber("cageControlDuration");
    }

    /**指定房间内铁笼是否触发控制 */
    static checkControlEnemy(gameComp: any, roomIdx: number, target: enemyBaseController) {
        if (!gameComp || roomIdx <= 0 || cageProps.cageControlDuration <= 0) {
            return false;
        }

        let cageComp = cageProps.getRoomCageComp(gameComp, roomIdx);
        if (!cageComp || cageComp.hasTriggered || !target || !target.node || !target.node.isValid) {
            return false;
        }

        cageComp.hasTriggered = true;
        cageComp.targetEnemy = target;
        cageComp.playDisappearAnim();
        return true;
    }

    /**获取指定房间内的铁笼道具 */
    private static getRoomCageComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == tilePropsType.cage && propComp.isPropsActive) {
                return propComp as cageProps;
            }
        }

        return null;
    }

    /**获取铁笼控制时长 */
    static getControlDuration() {
        return cageProps.cageControlDuration;
    }

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
    }

    /**消失时在敌人头顶生成铁笼 */
    onDisappear() {
        this.createEnemyCage();
    }

    /**生成控制敌人的铁笼 */
    private createEnemyCage() {
        if (!this.targetEnemy || !this.targetEnemy.node || !this.targetEnemy.node.isValid || !uiMgr.gameItemPrefab) {
            return;
        }

        let cageNode = instantiate(uiMgr.gameItemPrefab);
        this.gameComp.gameUINode.addChild(cageNode);

        let parentTransform = cageNode.parent?.getComponent(UITransform);
        if (parentTransform) {
            parentTransform.convertToNodeSpaceAR(this.targetEnemy.node.worldPosition, this.tempLocalPos);
        } else {
            this.tempLocalPos.set(this.targetEnemy.node.worldPosition);
        }

        cageNode.setPosition(this.tempLocalPos);

        let cageComp = cageNode.getComponent(cageController);
        if (!cageComp) {
            cageComp = cageNode.addComponent(cageController);
        }

        let duration = Math.max(0, cageProps.cageControlDuration - cageProps.disappearDuration);
        cageComp.init(this.targetEnemy, duration, imgPath.gamePprops + this.propsType);
        this.targetEnemy = null;
    }
}
