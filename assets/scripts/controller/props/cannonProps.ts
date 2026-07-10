import { _decorator, instantiate, UITransform, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { ccTools } from '../../extention/generalTools';
import { imgPath } from '../../manager/pathConfig';
import { enemyMgr } from '../../manager/enemyManager';
import { configData } from '../../manager/configData';
import { poolMgr } from '../../manager/poolManager';
import { uiMgr } from '../../manager/UIManager';
import { bulletController } from '../bulletController';
import { enemyBaseController } from '../enemy/enemyBaseController';
import { gm } from '../../manager/gm';
import { printerProps } from './printerProps';
import { telescopeProps } from './telescopeProps';
import { bearingProps } from './bearingProps';
import { fireProps } from './fireProps';
const { ccclass, property } = _decorator;

@ccclass('cannonProps')
export class cannonProps extends gamePropsBase {
    /**攻击力 */
    attack: number = 0;
    /**攻击距离 */
    attackRange: number = 0;
    /**当前攻击目标 */
    private targetEnemy: enemyBaseController = null;
    /**攻击计时 */
    private attackTimer: number = 0;
    /**临时世界坐标 */
    private tempWorldPos: Vec3 = new Vec3();
    /**临时本地坐标 */
    private tempLocalPos: Vec3 = new Vec3();
    /**子弹出生点距离炮口中心的偏移 */
    private bulletStartOffset: number = 45;
    /**炮台开始攻击前的延迟 */
    private attackStartDelay: number = 0;
    /**震慑剩余时间 */
    private fearTimer: number = 0;

    /**道具开始生效 */
    startProps() {
        this.attackStartDelay = 2;
    }

    // /**道具结束生效 */
    // endProps() {
    //     super.endProps();
    //     this.targetEnemy = null;
    //     this.attack = 0;
    //     this.attackRange = 0;
    //     this.attackTimer = 0;
    //     this.attackStartDelay = 0;
    //     this.fearTimer = 0;
    // }

    protected onDisable(): void {
        super.onDisable();
        this.targetEnemy = null;
        this.attackTimer = 0;
        this.attackStartDelay = 0;
        this.fearTimer = 0;
    }

    protected update(dt: number): void {
        if (gm.isGamePause || !this.isPropsActive) {
            return;
        }

        if (this.refreshFearTimer(dt)) {
            return;
        }

        if (!this.tileItemComp || this.attack <= 0 || this.attackRange <= 0) {
            this.refreshAttackStartDelay(dt);
            return;
        }

        this.targetEnemy = this.getAttackTarget();
        if (!this.targetEnemy) {
            this.attackTimer = this.getCurrentAttackInterval();
            return;
        }

        this.lookAtTarget(this.targetEnemy);

        this.attackTimer += dt;
        if (this.attackTimer < this.getCurrentAttackInterval()) {
            return;
        }

        this.attackTimer = 0;
        this.shoot(this.targetEnemy);
    }

    /**刷新开始攻击延迟 */
    private refreshAttackStartDelay(dt: number) {
        if (gm.isGamePause || this.attackStartDelay <= 0) {
            return;
        }

        this.attackStartDelay = Math.max(0, this.attackStartDelay - dt);
        if (this.attackStartDelay <= 0) {
            this.refreshAttack();
            this.attackTimer = this.getCurrentAttackInterval();
        }
    }

    /**升级道具 */
    upgradeProps() {
        super.upgradeProps();
        this.refreshAttack();
    }

    /**刷新攻击距离和攻击力 */
    refreshAttack() {
        let propsData = this.propsDatas[this.level];
        this.attack = propsData.attack;
        this.attackRange = propsData.attackRange;
    }

    /**获取攻击范围内最近的敌人 */
    private getAttackTarget() {
        let target: enemyBaseController = null;
        let minDistanceSqr = Number.MAX_VALUE;
        let range = this.getCurrentAttackRange() * configData.tileSize;
        let rangeSqr = range * range;
        let selfWorldPos = this.node.worldPosition;

        for (let i = 0; i < enemyMgr.enemyArr.length; i++) {
            let enemyComp = enemyMgr.enemyArr[i];
            if (!enemyComp || !enemyComp.node || !enemyComp.node.isValid || enemyComp.hp <= 0) {
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
            target = enemyComp;
        }

        return target;
    }

    /** 获取当前实际攻击距离 */
    private getCurrentAttackRange() {
        return this.attackRange * telescopeProps.getRoomRangeMultiplier(this.gameComp, this.roomIdx);
    }

    /** 获取当前实际攻击间隔 */
    private getCurrentAttackInterval() {
        return configData.cannonAttackFreq / bearingProps.getRoomAttackSpeedMultiplier(this.gameComp, this.roomIdx);
    }

    /**炮台图片朝向目标 */
    private lookAtTarget(target: enemyBaseController) {
        let selfWorldPos = this.img2.node.worldPosition;
        let targetWorldPos = target.node.worldPosition;
        let offsetX = targetWorldPos.x - selfWorldPos.x;
        let offsetY = targetWorldPos.y - selfWorldPos.y;
        if (offsetX == 0 && offsetY == 0) {
            return;
        }

        let angle = Math.atan2(offsetY, offsetX) * 180 / Math.PI;
        this.img2.node.angle = angle - 90;
    }

    /**发射子弹 */
    private shoot(target: enemyBaseController) {
        this.playScaleDownAnim(this.img2.node);
        let bulletNode = poolMgr.bulletPool.get();
        if (!bulletNode) {
            bulletNode = instantiate(uiMgr.bulletPrefab);
        }

        bulletNode.active = false;
        this.gameComp.gameUINode.addChild(bulletNode);

        this.getBulletStartWorldPos(this.tempWorldPos);
        let parentTransform = bulletNode.parent?.getComponent(UITransform);
        if (parentTransform) {
            parentTransform.convertToNodeSpaceAR(this.tempWorldPos, this.tempLocalPos);
        } else {
            this.tempLocalPos.set(this.tempWorldPos);
        }
        bulletNode.setPosition(this.tempLocalPos);

        let bulletComp = bulletNode.getComponent(bulletController);
        if (!bulletComp) {
            bulletComp = bulletNode.addComponent(bulletController);
        }
        bulletComp.init(target, this.attack, this.level, fireProps.getRoomDamagePercent(this.gameComp, this.roomIdx));
        bulletNode.active = true;

        this.produceCoinByHand();
    }

    /** 印钞机使炮台攻击时产出金币 */
    private produceCoinByHand() {
        printerProps.produceCoinByCannonLevel(this.gameComp, this.roomIdx, this.level);
    }

    /**受到震慑，暂停攻击 */
    fear(time: number) {
        if (time <= 0) {
            return;
        }

        this.fearTimer = Math.max(this.fearTimer, time);
        this.targetEnemy = null;
    }

    /**刷新震慑计时，返回当前是否仍被震慑 */
    private refreshFearTimer(dt: number) {
        if (this.fearTimer <= 0) {
            return false;
        }

        this.fearTimer = Math.max(0, this.fearTimer - dt);
        this.targetEnemy = null;
        return this.fearTimer > 0;
    }

    /**获取炮口前方的子弹出生世界坐标 */
    private getBulletStartWorldPos(out: Vec3) {
        this.img2.node.getWorldPosition(out);

        let angle = (this.img2.node.angle + 90) * Math.PI / 180;
        out.x += Math.cos(angle) * this.bulletStartOffset;
        out.y += Math.sin(angle) * this.bulletStartOffset;
    }

    /**初始化道具的图片(可重写，默认固定只有一个图片) */
    initPropsImg() {
        super.initPropsImg();
        ccTools.loadImg(this.img2, imgPath.weaponSkin + this.level);
        // this.img2.node.position = new Vec3(0, 10, 0);
    }
}
