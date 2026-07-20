import { _decorator, Component, Node, tween, Tween, UITransform, Vec2, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { configData } from '../../manager/configData';
import { propsConfig } from '../../json/jsonProps';
import { tilePropsType } from '../tileItemController';
import { gm } from '../../manager/gm';
import { enemyMgr } from '../../manager/enemyManager';
import { machineProps } from './machineProps';
import { coverProps } from './coverProps';
import { uiMgr } from '../../manager/UIManager';
import { poolMgr } from '../../manager/poolManager';
import { ccTools } from '../../extention/generalTools';
import { imgPath } from '../../manager/pathConfig';
const { ccclass, property } = _decorator;

@ccclass('doorProps')
export class doorProps extends gamePropsBase {
    rootPos: Vec3 = null;

    /**门是否关闭 */
    isClose: boolean = false;
    /**使用修复按钮后的剩余加速修复时间 */
    private repairAddTime: number = 0;
    /**维修台修复效果节点 */
    private machineRepairEffectNode: Node = null;
    /**维修台修复效果是否正在播放 */
    private isMachineRepairEffectPlaying: boolean = false;
    /**维修台修复效果左右摇晃角度 */
    private machineRepairEffectSwingAngle: number = 8;
    /**维修台修复效果单次摇晃时长 */
    private machineRepairEffectSwingDuration: number = 0.2;
    /**房门血条剩余显示时间 */
    private doorHpShowTimer: number = 0;

    /**道具开始生效 */
    startProps() {

    }

    /**道具结束生效 */
    endProps() {
        super.endProps();
        this.repairAddTime = 0;
        this.doorHpShowTimer = 0;
        Tween.stopAllByTarget(this.img1.node);
        this.clearMachineRepairEffect();
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

        coverProps.updateRoomShieldTimer(this.roomIdx, dt);
        this.repairDoor(dt);
        this.updateDoorHpShowTimer(dt);
    }

    /**开启加速修复 */
    startRepairAdd(time: number) {
        this.repairAddTime = Math.max(this.repairAddTime, time);
    }

    /**门自然修复 */
    private repairDoor(dt: number) {
        if (this.maxHp <= 0 || this.hp >= this.maxHp) {
            this.refreshMachineRepairEffectVisible(false);
            this.updateRepairAddTime(dt);
            return;
        }

        let repairSpeed = configData.doorRepairSpeed;
        let hasRepairAddSpeed = false;
        if (this.repairAddTime > 0) {
            repairSpeed += configData.doorRepairSpeedAdd;
            hasRepairAddSpeed = true;
        }
        let machineRepairSpeedAdd = machineProps.getDoorRepairSpeedAdd(this.gameComp, this.roomIdx);
        repairSpeed += machineRepairSpeedAdd;
        hasRepairAddSpeed = hasRepairAddSpeed || machineRepairSpeedAdd > 0;
        this.refreshMachineRepairEffectVisible(hasRepairAddSpeed);

        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * repairSpeed / 100 * dt);
        this.hpBar.fillRange = this.hp / this.maxHp;

        this.updateRepairAddTime(dt);
    }

    /**刷新房门血条显示剩余时间 */
    private updateDoorHpShowTimer(dt: number) {
        if (this.doorHpShowTimer <= 0) {
            return;
        }

        this.doorHpShowTimer = Math.max(0, this.doorHpShowTimer - dt);
        if (this.doorHpShowTimer <= 0) {
            this.hpNode.active = false;
        }
    }

    /**刷新加速修复剩余时间 */
    private updateRepairAddTime(dt: number) {
        if (this.repairAddTime <= 0) {
            return;
        }

        this.repairAddTime = Math.max(0, this.repairAddTime - dt);
    }

    /**刷新维修台修复效果节点 */
    refreshMachineRepairEffect() {
        if (!this.effectNode || !uiMgr.gameSpriteItemPrefab || !this.hasMachineRepairEffectSource()) {
            this.clearMachineRepairEffect();
            return;
        }

        if (this.machineRepairEffectNode && this.machineRepairEffectNode.isValid && this.machineRepairEffectNode.parent == this.effectNode) {
            return;
        }

        this.clearMachineRepairEffect();
        this.machineRepairEffectNode = poolMgr.getGameSpriteNode(uiMgr.gameSpriteItemPrefab);
        this.machineRepairEffectNode.name = "machineRepairEffect";
        this.machineRepairEffectNode.active = false;
        this.machineRepairEffectNode.setScale(new Vec3(0.7, 0.7, 1));
        this.effectNode.addChild(this.machineRepairEffectNode);

        let trans = this.machineRepairEffectNode.getComponent(UITransform);
        trans?.setAnchorPoint(0.15, 0.25);

        let img = poolMgr.getGameNodeSprite(this.machineRepairEffectNode);
        if (img) {
            ccTools.loadImg(img, imgPath.gamePprops + tilePropsType.machine);
        }
    }

    /**是否存在可以显示门修复效果的加速来源 */
    private hasMachineRepairEffectSource() {
        return this.repairAddTime > 0 || machineProps.getDoorRepairSpeedAdd(this.gameComp, this.roomIdx) > 0;
    }

    /**刷新维修台修复效果显示状态 */
    private refreshMachineRepairEffectVisible(isVisible: boolean) {
        this.refreshMachineRepairEffect();
        if (!this.machineRepairEffectNode || !this.machineRepairEffectNode.isValid) {
            return;
        }

        this.machineRepairEffectNode.active = isVisible;
        if (isVisible) {
            this.playMachineRepairEffectAnim();
        } else {
            this.stopMachineRepairEffectAnim();
        }
    }

    /**播放维修台修复效果左右摇晃动画 */
    private playMachineRepairEffectAnim() {
        if (!this.machineRepairEffectNode || this.isMachineRepairEffectPlaying) {
            return;
        }

        this.isMachineRepairEffectPlaying = true;
        Tween.stopAllByTarget(this.machineRepairEffectNode);
        tween(this.machineRepairEffectNode)
            .set({ angle: 0 })
            .to(this.machineRepairEffectSwingDuration, { angle: -this.machineRepairEffectSwingAngle })
            .to(this.machineRepairEffectSwingDuration * 2, { angle: this.machineRepairEffectSwingAngle })
            .to(this.machineRepairEffectSwingDuration, { angle: 0 })
            .union()
            .repeatForever()
            .start();
    }

    /**停止维修台修复效果动画并恢复状态 */
    private stopMachineRepairEffectAnim() {
        if (!this.machineRepairEffectNode) {
            this.isMachineRepairEffectPlaying = false;
            return;
        }

        Tween.stopAllByTarget(this.machineRepairEffectNode);
        this.machineRepairEffectNode.angle = 0;
        this.isMachineRepairEffectPlaying = false;
    }

    /**清理维修台修复效果节点 */
    private clearMachineRepairEffect() {
        this.stopMachineRepairEffectAnim();
        if (this.machineRepairEffectNode && this.machineRepairEffectNode.isValid) {
            poolMgr.putGameSpriteNode(this.machineRepairEffectNode);
        }

        this.machineRepairEffectNode = null;
    }

    /**刷新指定房间的门维修台效果 */
    static refreshRoomMachineRepairEffect(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        let doorPos = roomData?.doorPos;
        if (!doorPos) {
            return;
        }

        let doorComp = gameComp?.tileMap?.[doorPos.x]?.[doorPos.y]?.item?.propsComp as doorProps;
        doorComp?.refreshMachineRepairEffect();
    }

    /**重置血量 */
    resetHp(isKeepHpShowTimer: boolean = false) {
        this.maxHp = this.propsDatas[this.level].hp;
        this.hp = this.maxHp;
        this.hpBar.fillRange = 1;
        this.hpNode.active = false;
        if (!isKeepHpShowTimer) {
            this.doorHpShowTimer = 0;
        }
    }

    /**初始化血量 */
    initMaxHp() {
        this.resetHp();
    }

    /**受到伤害 */
    takeDamage(damage: number) {
        if (coverProps.tryBlockDoorDamage(this.gameComp, this.roomIdx, this.hpPercent)) {
            return false;
        }

        let isDestroyed = super.takeDamage(damage);
        if (!isDestroyed) {
            this.doorHpShowTimer = configData.doorHpShowTime;
            this.hpNode.active = true;
        }
        if (!isDestroyed) {
            coverProps.tryStartShieldByDoorHp(this.gameComp, this.roomIdx, this.hpPercent);
        }

        return isDestroyed;
    }

    /**升级道具 */
    upgradeProps(): void {
        let levelBefore = this.level;
        let doorHpShowTimerBefore = this.doorHpShowTimer;
        super.upgradeProps();
        this.resetHp(true);
        this.doorHpShowTimer = doorHpShowTimerBefore;
        this.hpNode.active = this.doorHpShowTimer > 0;
        if (this.level != levelBefore) {
            this.checkEnemyEscapeAfterUpgrade();
        }
    }

    /**广告升级门 */
    upgradePropsAd() {
        let levelBefore = this.level;
        let doorHpShowTimerBefore = this.doorHpShowTimer;
        super.upgradeProps();
        this.resetHp(true);
        this.doorHpShowTimer = doorHpShowTimerBefore;
        this.hpNode.active = this.doorHpShowTimer > 0;
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
