import { _decorator, Component, Node, tween, Tween, UITransform, Vec2, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { configData } from '../../manager/configData';
import { propsConfig } from '../../json/jsonProps';
import { tilePropsType } from '../tileItemController';
import { gm } from '../../manager/gm';
import { enemyMgr } from '../../manager/enemyManager';
import { machineProps } from './machineProps';
const { ccclass, property } = _decorator;

@ccclass('doorProps')
export class doorProps extends gamePropsBase {
    rootPos: Vec3 = null;

    /**门是否关闭 */
    isClose: boolean = false;
    /**使用修复按钮后的剩余加速修复时间 */
    private repairAddTime: number = 0;

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.repairAddTime = 0;
        Tween.stopAllByTarget(this.img1.node);
    }

    /**初始化门 */
    initDoor(offsetDir: number, dir: number) {
        this.isClose = false;
        this.setDoorRootPos(offsetDir);
        this.setDoorDir(dir);
    }

    /**设置门的初始位置 */
    setDoorRootPos(offsetDir) {
        this.rootPos = new Vec3(0, 0, 0);
        if (offsetDir == 0) {
            //上
            this.rootPos.y = configData.tileSize;
        } else if (offsetDir == 1) {
            //下
            this.rootPos.y = -configData.tileSize;
        } else if (offsetDir == 2) {
            //左
            this.rootPos.x = -configData.tileSize;
        } else if (offsetDir == 3) {
            //右
            this.rootPos.x = configData.tileSize;
        }

        this.img1.node.setPosition(this.rootPos);
    }

    /**设置门的方向 */
    setDoorDir(dir: number) {
        if (dir == 0) {
            //上
            this.img1.node.angle = 0;
        } else if (dir == 1) {
            //下
            this.img1.node.angle = 180;
        } else if (dir == 2) {
            //左
            this.img1.node.angle = 90;
        } else if (dir == 3) {
            //右
            this.img1.node.angle = 270;
        }
    }

    /**操作门 */
    operateProps() {
        let firstPos = this.isClose ? new Vec3(0, 0, 0) : this.rootPos;
        let secondPos = this.isClose ? this.rootPos : new Vec3(0, 0, 0);

        Tween.stopAllByTarget(this.img1.node);
        tween(this.img1.node)
            .set(firstPos)
            .to(0.5, { position: secondPos })
            .start();

        this.isClose = !this.isClose;
        return this.isClose;
    }

    protected update(dt: number): void {
        if (gm.isGamePause || !this.isPropsActive) {
            return;
        }

        this.repairDoor(dt);
    }

    /**开启加速修复 */
    startRepairAdd(time: number) {
        this.repairAddTime = Math.max(this.repairAddTime, time);
    }

    /**门自然修复 */
    private repairDoor(dt: number) {
        if (this.maxHp <= 0 || this.hp >= this.maxHp) {
            this.updateRepairAddTime(dt);
            return;
        }

        let repairSpeed = configData.doorRepairSpeed;
        if (this.repairAddTime > 0) {
            repairSpeed += configData.doorRepairSpeedAdd;
        }
        repairSpeed += machineProps.getDoorRepairSpeedAdd(this.gameComp, this.roomIdx);

        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * repairSpeed / 100 * dt);
        this.hpBar.fillRange = this.hp / this.maxHp;
        this.hpNode.active = this.hp < this.maxHp;

        this.updateRepairAddTime(dt);
    }

    /**刷新加速修复剩余时间 */
    private updateRepairAddTime(dt: number) {
        if (this.repairAddTime <= 0) {
            return;
        }

        this.repairAddTime = Math.max(0, this.repairAddTime - dt);
    }

    /**重置血量 */
    resetHp() {
        this.maxHp = this.propsDatas[this.level].hp;
        this.hp = this.maxHp;
        this.hpBar.fillRange = 1;
        this.hpNode.active = false;
    }

    /**初始化血量 */
    initMaxHp() {
        this.resetHp();
    }

    /**升级道具 */
    upgradeProps(): void {
        let levelBefore = this.level;
        super.upgradeProps();
        this.resetHp();
        if (this.level != levelBefore) {
            this.checkEnemyEscapeAfterUpgrade();
        }
    }

    /**广告升级门 */
    upgradePropsAd() {
        let levelBefore = this.level;
        super.upgradeProps();
        this.resetHp();
        if (this.level != levelBefore) {
            this.checkEnemyChoseUpgradeAd();
        }
    }

    /**房门升级后，检测正在攻击当前门的低血量敌人是否需要逃离 */
    private checkEnemyEscapeAfterUpgrade() {
        for (let i = 0; i < enemyMgr.enemyArr.length; i++) {
            let enemyComp = enemyMgr.enemyArr[i];
            if (!enemyComp || !enemyComp.node || !enemyComp.node.isValid || enemyComp.hp <= 0) {
                continue;
            }

            enemyComp.checkDoorUpgradeEscape(this.pos);
        }
    }

    /**广告升级道具，正在攻击当前门的敌人重新选择目标 */
    private checkEnemyChoseUpgradeAd() {
        for (let i = 0; i < enemyMgr.enemyArr.length; i++) {
            let enemyComp = enemyMgr.enemyArr[i];
            if (!enemyComp || !enemyComp.node || !enemyComp.node.isValid || enemyComp.hp <= 0) {
                continue;
            }

            enemyComp.forceChooseTarget(this.pos);
        }
    }
}


