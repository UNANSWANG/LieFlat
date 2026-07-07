import { _decorator, Component, Node } from 'cc';
import { gamePropsBase } from './gamePropsBase';
import { commonConfig } from '../../json/jsonCommon';
import { gm } from '../../manager/gm';
const { ccclass, property } = _decorator;

@ccclass('coverProps')
export class coverProps extends gamePropsBase {
    /** 门血量低于该百分比时触发护盾 */
    coverThreshold: number = 0.3;
    /** 护盾持续时长 */
    coverDuration: number = 3;
    /** 护盾结束后的冷却时间 */
    coverCoolDown: number = 30;
    /** 当前护盾剩余时间 */
    private shieldTimer: number = 0;
    /** 当前冷却剩余时间 */
    private coolDownTimer: number = 0;

    /** 初始化专属配置数据 */
    initPropsData() {
        super.initPropsData();
        this.coverThreshold = commonConfig.getValueNumber("coverThreshold") / 100;
        this.coverDuration = commonConfig.getValueNumber("coverDuration");
        this.coverCoolDown = commonConfig.getValueNumber("coverCoolDown");
    }

    /** 道具开始生效 */
    startProps() {

    }

    /** 刷新护盾、冷却，并检测是否需要根据门血量自动开盾 */
    protected update(dt: number): void {
        if (gm.isGamePause || !this.isPropsActive) {
            return;
        }

        this.updateShieldTimer(dt);
        this.updateCoolDownTimer(dt);
        this.tryStartShieldByRoomDoorHp();
    }

    /** 护盾当前是否生效 */
    get isShieldActive() {
        return this.shieldTimer > 0;
    }

    /** 尝试阻挡门受到的伤害，必要时先触发护盾 */
    tryBlockDoorDamage(doorHpPercent: number) {
        if (this.isShieldActive) {
            return true;
        }

        if (this.coolDownTimer > 0 || doorHpPercent > this.coverThreshold) {
            return false;
        }

        this.startShield();
        return this.isShieldActive;
    }

    /** 根据门当前血量尝试开启护盾 */
    tryStartShieldByDoorHp(doorHpPercent: number) {
        if (this.isShieldActive || this.coolDownTimer > 0 || doorHpPercent > this.coverThreshold) {
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

        this.shieldTimer = this.coverDuration;
    }

    /** 刷新护盾剩余时间，护盾结束时进入冷却 */
    private updateShieldTimer(dt: number) {
        if (this.shieldTimer <= 0) {
            return;
        }

        this.shieldTimer = Math.max(0, this.shieldTimer - dt);
        if (this.shieldTimer <= 0) {
            this.coolDownTimer = this.coverCoolDown;
        }
    }

    /** 刷新冷却剩余时间 */
    private updateCoolDownTimer(dt: number) {
        if (this.coolDownTimer <= 0 || this.isShieldActive) {
            return;
        }

        this.coolDownTimer = Math.max(0, this.coolDownTimer - dt);
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
        let coverComp = coverProps.getRoomCoverComp(gameComp, roomIdx);
        return coverComp ? coverComp.tryBlockDoorDamage(doorHpPercent) : false;
    }

    /** 尝试根据指定房间门血量开启护盾 */
    static tryStartShieldByDoorHp(gameComp: any, roomIdx: number, doorHpPercent: number) {
        let coverComp = coverProps.getRoomCoverComp(gameComp, roomIdx);
        return coverComp ? coverComp.tryStartShieldByDoorHp(doorHpPercent) : false;
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
        super.endProps();
        this.shieldTimer = 0;
        this.coolDownTimer = 0;
    }

}
