import { _decorator, UITransform, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { enemyMgr } from '../../manager/enemyManager';
import { configData } from '../../manager/configData';
import { gm } from '../../manager/gm';
import type { enemyBaseController } from '../enemy/enemyBaseController';
import { uiMgr } from '../../manager/UIManager';
import { poolMgr } from '../../manager/poolManager';
import { sawController } from '../sawController';
import { imgPath } from '../../manager/pathConfig';
const { ccclass } = _decorator;

@ccclass('sawProps')
export class sawProps extends gamePropsBase {
    /**触发的生命阈值 */
    sawThreshold: number = 0.1;
    /**检测范围（格数） */
    sawRange: number = 10;
    /**检测间隔 */
    private checkInterval: number = 0.2;
    /**检测计时 */
    private checkTimer: number = 0;
    /**是否已经触发斩杀 */
    private hasKillEnemy: boolean = false;
    /**当前斩杀目标 */
    private targetEnemy: enemyBaseController = null;
    /**临时本地坐标 */
    private tempLocalPos: Vec3 = new Vec3();

    /**初始化专属数据 */
    initPropsData() {
        super.initPropsData();
        this.sawThreshold = commonConfig.getValueNumber("sawThreshold") / 100;
        this.sawRange = commonConfig.getValueNumber("sawRange");
    }

    /**道具开始生效 */
    startProps() {
        this.checkTimer = this.checkInterval;
        this.hasKillEnemy = false;
    }

    protected update(dt: number): void {
        if (gm.isGamePause || !this.isPropsActive || this.hasKillEnemy) {
            return;
        }

        this.checkTimer += dt;
        if (this.checkTimer < this.checkInterval) {
            return;
        }

        this.checkTimer = 0;
        this.checkKillEnemy();
    }

    /**检测并斩杀范围内低血量敌人 */
    private checkKillEnemy() {
        if (this.hasKillEnemy || this.sawRange <= 0 || this.sawThreshold <= 0) {
            return;
        }

        let range = this.sawRange * configData.tileSize;
        let rangeSqr = range * range;
        let selfWorldPos = this.node.worldPosition;
        let targetEnemy: enemyBaseController = null;
        let minDistanceSqr = Number.MAX_VALUE;

        for (let i = 0; i < enemyMgr.enemyArr.length; i++) {
            let enemyComp = enemyMgr.enemyArr[i];
            if (!enemyComp || !enemyComp.node || !enemyComp.node.isValid || enemyComp.hp <= 0 || enemyComp.maxHp <= 0) {
                continue;
            }

            if (enemyComp.hpPercent >= this.sawThreshold) {
                continue;
            }

            let enemyWorldPos = enemyComp.node.worldPosition;
            let offsetX = enemyWorldPos.x - selfWorldPos.x;
            let offsetY = enemyWorldPos.y - selfWorldPos.y;
            let distanceSqr = offsetX * offsetX + offsetY * offsetY;
            if (distanceSqr > rangeSqr || distanceSqr >= minDistanceSqr) {
                continue;
            }

            minDistanceSqr = distanceSqr;
            targetEnemy = enemyComp;
        }

        if (!targetEnemy) {
            return;
        }

        this.hasKillEnemy = true;
        this.targetEnemy = targetEnemy;
        this.playDisappearAnim();
    }

    /**消失后在敌人头顶生成铡刀 */
    onDisappear() {
        this.createEnemySaw();
    }

    /**生成斩杀敌人的铡刀 */
    private createEnemySaw() {
        if (!this.targetEnemy || !this.targetEnemy.node || !this.targetEnemy.node.isValid) {
            return;
        }

        if (!uiMgr.gameItemPrefab) {
            this.targetEnemy.executeBySaw();
            this.targetEnemy = null;
            return;
        }

        let sawNode = poolMgr.getGameNode(uiMgr.gameItemPrefab);
        this.gameComp.gameUINode.addChild(sawNode);

        let parentTransform = sawNode.parent?.getComponent(UITransform);
        if (parentTransform) {
            parentTransform.convertToNodeSpaceAR(this.targetEnemy.node.worldPosition, this.tempLocalPos);
        } else {
            this.tempLocalPos.set(this.targetEnemy.node.worldPosition);
        }

        sawNode.setPosition(this.tempLocalPos);

        let sawComp = sawNode.getComponent(sawController);
        if (!sawComp) {
            sawComp = sawNode.addComponent(sawController);
        }
        sawComp.enabled = true;

        sawComp.init(this.targetEnemy, imgPath.gamePprops + this.propsType);
        this.targetEnemy = null;
    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.checkTimer = 0;
        this.hasKillEnemy = false;
        this.targetEnemy = null;
    }

}
