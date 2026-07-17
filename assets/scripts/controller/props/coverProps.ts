import { _decorator, Component, Node, sp, Vec3 } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { gm } from '../../manager/gm';
import { uiMgr } from '../../manager/UIManager';
import { poolMgr } from '../../manager/poolManager';
import { ccTools } from '../../extention/generalTools';
import { spinePath } from '../../manager/pathConfig';
const { ccclass, property } = _decorator;

@ccclass('coverProps')
export class coverProps extends gamePropsBase {
    /** 房间护盾剩余时间 */
    private static shieldTimers: { [roomIdx: number]: number } = {};

    /** 门血量低于该百分比时触发护盾 */
    coverThreshold: number = 0.3;
    /** 护盾持续时长 */
    coverDuration: number = 3;
    /** 光罩spine节点 */
    private lightNode: Node = null;

    /**初始化道具的图片 */
    initPropsImg() {
        super.initPropsImg();
        this.createLightNode();
    }

    /** 初始化专属配置数据 */
    initPropsData() {
        super.initPropsData();
        this.coverThreshold = commonConfig.getValueNumber("coverThreshold") / 100;
        this.coverDuration = commonConfig.getValueNumber("coverDuration");
    }

    /** 创建光罩spine节点 */
    private createLightNode() {
        this.clearLightNode();
        if (!uiMgr.gameItemPrefab || !this.img2?.node) {
            return;
        }

        this.lightNode = poolMgr.getGameNode(uiMgr.gameItemPrefab);
        this.lightNode.name = "coverLight";
        this.lightNode.setScale(new Vec3(0.1, 0.1, 1));
        this.lightNode.setPosition(1, -4, 0);
        this.img2.node.addChild(this.lightNode);

        let skeleton = poolMgr.getGameNodeSkeleton(this.lightNode);
        if (skeleton) {
            this.playLightAttackAnim(skeleton);
        }
    }

    /** 播放光罩attack循环动画 */
    private async playLightAttackAnim(skeleton: sp.Skeleton) {
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.light);
        if (!isLoaded || !skeleton || !skeleton.isValid) {
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /** 清理光罩spine节点 */
    private clearLightNode() {
        if (this.lightNode && this.lightNode.isValid) {
            poolMgr.putGameNode(this.lightNode);
        }

        this.lightNode = null;
    }

    /** 道具开始生效 */
    startProps() {

    }

    /** 检测是否需要根据门血量自动开盾 */
    protected update(dt: number): void {
        if (gm.isGamePause || !this.isPropsActive) {
            return;
        }

        this.tryStartShieldByRoomDoorHp();
    }

    /** 护盾当前是否生效 */
    get isShieldActive() {
        return coverProps.isRoomShieldActive(this.roomIdx);
    }

    /** 尝试阻挡门受到的伤害，必要时先触发护盾 */
    tryBlockDoorDamage(doorHpPercent: number) {
        if (coverProps.isRoomShieldActive(this.roomIdx)) {
            return true;
        }

        if (doorHpPercent > this.coverThreshold) {
            return false;
        }

        this.startShield();
        return this.isShieldActive;
    }

    /** 根据门当前血量尝试开启护盾 */
    tryStartShieldByDoorHp(doorHpPercent: number) {
        if (coverProps.isRoomShieldActive(this.roomIdx) || doorHpPercent > this.coverThreshold) {
            return false;
        }

        this.startShield();
        return this.isShieldActive;
    }

    /** 开启护盾 */
    private startShield() {
        if (this.coverDuration <= 0) {
            return;
        }

        coverProps.shieldTimers[this.roomIdx] = this.coverDuration;
        this.playDisappearAnim();
    }

    /** 检测本房间的门血量，低于阈值时自动开盾 */
    private tryStartShieldByRoomDoorHp() {
        let doorPos = this.gameComp?.roomMap?.[this.roomIdx]?.doorPos;
        if (!doorPos) {
            return;
        }

        let doorComp = this.gameComp?.tileMap?.[doorPos.x]?.[doorPos.y]?.item?.propsComp;
        if (!doorComp) {
            return;
        }

        this.tryStartShieldByDoorHp(doorComp.hpPercent);
    }

    /** 尝试阻挡指定房间门受到的伤害 */
    static tryBlockDoorDamage(gameComp: any, roomIdx: number, doorHpPercent: number) {
        if (coverProps.isRoomShieldActive(roomIdx)) {
            return true;
        }

        let coverComp = coverProps.getRoomCoverComp(gameComp, roomIdx);
        return coverComp ? coverComp.tryBlockDoorDamage(doorHpPercent) : false;
    }

    /** 尝试根据指定房间门血量开启护盾 */
    static tryStartShieldByDoorHp(gameComp: any, roomIdx: number, doorHpPercent: number) {
        let coverComp = coverProps.getRoomCoverComp(gameComp, roomIdx);
        return coverComp ? coverComp.tryStartShieldByDoorHp(doorHpPercent) : false;
    }

    /** 刷新指定房间护盾剩余时间 */
    static updateRoomShieldTimer(roomIdx: number, dt: number) {
        if (roomIdx <= 0 || !coverProps.shieldTimers[roomIdx]) {
            return;
        }

        coverProps.shieldTimers[roomIdx] = Math.max(0, coverProps.shieldTimers[roomIdx] - dt);
    }

    /** 指定房间护盾是否生效 */
    private static isRoomShieldActive(roomIdx: number) {
        return roomIdx > 0 && coverProps.shieldTimers[roomIdx] > 0;
    }

    /** 获取指定房间内正在生效的金钟罩 */
    private static getRoomCoverComp(gameComp: any, roomIdx: number) {
        let roomData = gameComp?.roomMap?.[roomIdx];
        if (!roomData || roomIdx <= 0) {
            return null;
        }

        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = gameComp.tileMap?.[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == "cover" && propComp.isPropsActive) {
                return propComp as coverProps;
            }
        }

        return null;
    }

    /** 道具结束生效 */
    endProps() {
        this.clearLightNode();
        super.endProps();
    }

}
