import { _decorator, Component, Label, Node, sp, Sprite, Vec2, Vec3 } from 'cc';
import { ccTools } from '../../extention/generalTools';
import { configData, enemyCommonConfig } from '../../manager/configData';
import { pData } from '../../manager/playerData';
import { playerMgr } from '../../manager/playerManager';
import { roleController, roleState } from '../roleController';
import { gamePropsBase } from '../props/gamePropsBase';
import { tilePropsType } from '../tileItemController';
import { UIGame } from '../../UIPage/UIGame';
import { uiMgr } from '../../manager/UIManager';
import { UIPath } from '../../manager/pathConfig';
import { enemyMgr } from '../../manager/enemyManager';
import { bedProps } from '../props/bedProps';
import { enemyConfig } from '../../json/jsonEnemy';
import { gm } from '../../manager/gm';
import { cannonProps } from '../props/cannonProps';
import { iceProps } from '../props/iceProps';
import { cageProps } from '../props/cageProps';
import { thornProps } from '../props/thornProps';
import { netProps } from '../props/netProps';
import { alarmProps } from '../props/alarmProps';
const { ccclass, property } = _decorator;

enum enemyAnim {
    /**攻击 */
    attack = "attack",
    /**移动 */
    move = "move",
}

@ccclass('enemyBaseController')
export class enemyBaseController extends Component {
    /**角色当前游戏内id */
    roleId: number = 0;
    /**游戏脚本 */
    gameComp: UIGame = null;
    /**当前角色所在瓦片位置 */
    currentPos: Vec2 = Vec2.ZERO;
    /**等级 */
    level: number = 0;
    /**最大等级 */
    maxLevel: number = 12;
    /**最大血量 */
    maxHp: number = 0;
    /**当前血量 */
    hp: number = 0;
    /**攻击伤害 */
    attackDamage: number = 0;
    /**当前攻击目标 */
    targetPlayer: roleController = null;
    /**当前空床目标坐标 */
    private targetEmptyBedPos: Vec2 = null;
    /**当前空床目标房间 */
    private targetEmptyBedRoomIdx: number = 0;
    /**当前移动路径可忽略门的房间 */
    private moveIgnoreDoorRoomIdx: number = 0;
    /**离开空房间前持续忽略门的房间 */
    private emptyRoomIgnoreDoorRoomIdx: number = 0;
    /**寻路路径 */
    private movePath: Vec2[] = [];
    /**当前路径索引 */
    private movePathIdx: number = 0;
    /**当前正在攻击的道具坐标 */
    private attackingTilePos: Vec2 = null;
    /**是否正在播放攻击道具动画 */
    private isAttackingProps: boolean = false;
    /**当前连续攻击门期间是否已经触发过震慑 */
    private hasFearCurAttackDoor: boolean = false;
    /**当前攻击门期间是否已经触发过队友炮台处理 */
    private hasHandleTeamCannonCurAttackDoor: boolean = false;
    /**当前攻击的门是否已判定为继续强攻 */
    private isForceAttackingDoor: boolean = false;
    /**当前攻击门秒伤检测阶段 */
    private doorAttackTimeCheckState: "none" | "waiting" | "recording" | "passed" = "none";
    /**当前攻击门秒伤检测计时 */
    private doorAttackTimeCheckTimer: number = 0;
    /**当前攻击门秒伤检测累计伤害 */
    private doorAttackTimeCheckDamage: number = 0;
    /**当前攻击门秒伤检测坐标 */
    private doorAttackTimeCheckTilePos: Vec2 = null;
    /**当前攻击门荆棘反伤计时 */
    private thornDamageTimer: number = 0;
    /**火焰锻造台灼烧剩余时间 */
    private fireBurnTimer: number = 0;
    /**火焰锻造台灼烧伤害计时 */
    private fireBurnDamageTimer: number = 0;
    /**火焰锻造台每秒伤害百分比 */
    private fireBurnDamagePercent: number = 0;
    /**火焰锻造台灼烧刷新后的保留时间 */
    private fireBurnKeepTime: number = 1.2;
    /**是否正在播放攻击角色动画 */
    private isAttackingPlayer: boolean = false;
    /**是否正在返回出生点回血 */
    private isRepairingHp: boolean = false;
    /**当前回血目标出生点 */
    private repairBornPos: Vec2 = null;
    /**回出生点回满后是否需要等待再重新找目标 */
    private needWaitReturnStart: boolean = false;
    /**是否正在出生点等待重新出发 */
    private isWaitingReturnStart: boolean = false;
    /**出生点等待重新出发计时 */
    private returnStartTimer: number = 0;
    /**当前播放的角色动画名称 */
    private curRoleAnimName: string = "";
    /**游戏暂停后是否已清理行为 */
    private hasStopByGamePause: boolean = false;
    /**升级计时 */
    private upgradeTimer: number = 0;
    /**本次升级需要时间 */
    private upgradeTime: number = 0;
    /**最近受到的伤害记录 */
    private damageRecords: { time: number, damage: number }[] = [];
    /**狂怒技能冷却计时 */
    private rageUseTimer: number = 0;
    /**狂怒技能持续计时 */
    private rageTimer: number = 0;
    /**狂怒技能是否可释放 */
    private isRageReady: boolean = false;
    /**是否处于狂怒状态 */
    private isRaging: boolean = false;
    /**是否被铁笼控制 */
    private isCageControlled: boolean = false;
    /**是否被渔网控制 */
    private isNetControlled: boolean = false;

    ///
    ///节点
    ///
    /**角色spine节点 */
    roleAnim: sp.Skeleton = null;
    /**角色名称 */
    roleNameLab: Label = null;
    /**角色等级 */
    levelLab: Label = null;
    /**血量节点 */
    hpNode: Node = null;
    /**血量图片 */
    hpBar: Sprite = null;

    protected onLoad(): void {
        this.roleAnim = this.node.getChildByName("roleAnim").getComponent(sp.Skeleton);
        this.roleNameLab = this.node.getChildByName("roleNameLab").getComponent(Label);
        this.levelLab = this.node.getChildByName("levelLab").getComponent(Label);
        this.hpNode = this.node.getChildByName("hpBg");
        this.hpBar = this.hpNode.getChildByName("hpBar").getComponent(Sprite);
        this.roleAnim.setCompleteListener(this.onRoleAnimComplete.bind(this));
    }

    /**初始化 */
    init(comp: UIGame, id: number) {
        this.level = 0;
        this.damageRecords = [];
        this.isForceAttackingDoor = false;
        this.needWaitReturnStart = false;
        this.isWaitingReturnStart = false;
        this.returnStartTimer = 0;
        this.resetDoorAttackTimeCheck();
        this.initMaxLevel();
        this.resetHp();
        this.refreshLevel();
        this.resetAttackDamage();
        this.resetUpgradeTimer();
        this.resetRageSkill();
        this.clearFireBurn();
        this.stopCageControl();
        this.stopNetControl();

        this.gameComp = comp;
        this.roleId = id;

        //TODO 名称后续加入配置，先临时写死
        this.roleNameLab.string = `猎梦者${this.roleId + 1}`
        this.playRoleAnim(enemyAnim.move, true);
    }

    protected update(dt: number): void {
        if (!this.gameComp) {
            this.stopByGamePause();
            return;
        }

        if (gm.isGamePause) {
            return;
        }

        if (!this.gameComp.isEnemyCanMove) {
            this.stopByGamePause();
            return;
        }

        this.hasStopByGamePause = false;
        this.updateUpgradeTimer(dt);
        this.updateRageSkill(dt);
        if (this.updateReturnStartWait(dt)) {
            return;
        }
        this.checkRepairHpState();
        this.updateDoorAttackTimeCheck(dt);
        this.updateThornDamage(dt);
        this.updateFireBurn(dt);
        if (this.isCageControlled) {
            return;
        }
        if (this.isNetControlled) {
            this.playRoleAnim(enemyAnim.move, true);
            return;
        }
        this.moveByPath(dt);
    }

    /**是否最大等级 */
    get isMaxLevel() {
        return this.level >= this.maxLevel - 1;
    }

    /**生命值百分比 */
    get hpPercent() {
        return this.hp / this.maxHp;
    }

    /**初始化最大等级 */
    initMaxLevel() {
        this.maxLevel = enemyConfig.enemyAllData.length;
    }

    /**重置血量 */
    resetHp() {
        this.maxHp = enemyConfig.getEnemyData(this.level).hp;
        this.hp = this.maxHp;
        this.refreshHp();
    }

    /**重置伤害 */
    resetAttackDamage() {
        //TODO 伤害临时秒杀
        this.attackDamage = enemyConfig.getEnemyData(this.level).attack * 3;
        // this.attackDamage = enemyConfig.getEnemyData(this.level).attack;
    }

    /**刷新等级 */
    refreshLevel() {
        this.levelLab.string = `LV${this.level + 1}`;
    }

    /**刷新血量 */
    refreshHp() {
        this.hpBar.fillRange = this.hpPercent;
    }

    /**升级 */
    upgrade() {
        if (this.isMaxLevel) {
            return;
        }

        this.level++;
        this.refreshLevel();
        this.resetHp();
        this.resetAttackDamage();
        this.resetUpgradeTimer();

        uiMgr.showTips(`猎梦者升级，当前等级${this.level + 1}`);
    }

    /**重置升级计时 */
    private resetUpgradeTimer() {
        this.upgradeTimer = 0;
        this.upgradeTime = this.getRandomUpgradeTime();
    }

    /**重置狂怒技能 */
    private resetRageSkill() {
        this.rageUseTimer = 0;
        this.rageTimer = 0;
        this.isRageReady = false;
        this.isRaging = false;
        this.refreshRoleAnimTimeScale();
    }

    /**刷新狂怒技能状态 */
    private updateRageSkill(dt: number) {
        this.updateRageUseTimer(dt);
        this.updateRageTimer(dt);
    }

    /**刷新狂怒技能冷却 */
    private updateRageUseTimer(dt: number) {
        if (this.isRageReady || enemyCommonConfig.rageUseInterval <= 0) {
            return;
        }

        this.rageUseTimer += dt;
        if (this.rageUseTimer >= enemyCommonConfig.rageUseInterval) {
            this.isRageReady = true;
        }
    }

    /**刷新狂怒技能持续时间 */
    private updateRageTimer(dt: number) {
        if (!this.isRaging) {
            return;
        }

        this.rageTimer += dt;
        if (this.rageTimer < enemyCommonConfig.rageTime) {
            return;
        }

        this.stopRageSkill();
    }

    /**尝试在攻击动画结束后释放狂怒 */
    private tryStartRageSkill() {
        if (!this.isRageReady || this.isRaging || enemyCommonConfig.rageTime <= 0) {
            return false;
        }

        this.isRageReady = false;
        this.rageUseTimer = 0;
        uiMgr.showTips("猎梦者释放狂怒技能");
        if (this.tryStartCageControl()) {
            return true;
        }

        this.isRaging = true;
        this.rageTimer = 0;
        this.refreshRoleAnimTimeScale();
    }

    /**结束狂怒技能 */
    private stopRageSkill() {
        if (!this.isRaging) {
            return;
        }

        this.isRaging = false;
        this.rageTimer = 0;
        this.refreshRoleAnimTimeScale();
    }

    /**刷新角色动画播放速度 */
    private refreshRoleAnimTimeScale() {
        if (!this.roleAnim) {
            return;
        }

        if (this.isCageControlled) {
            this.roleAnim.timeScale = 0;
            return;
        }

        let isAttackAnim = this.curRoleAnimName == enemyAnim.attack;
        let timeScale = isAttackAnim ? 0.5 : 1;
        if (this.isRaging && isAttackAnim) {
            timeScale *= enemyCommonConfig.rageAttackSpeed;
        }
        if (isAttackAnim) {
            timeScale *= this.getIceAttackTimeScale();
        }

        this.roleAnim.timeScale = timeScale;
    }

    /**渔网控制 */
    netControl(time: number) {
        if (time <= 0) {
            return;
        }

        this.isNetControlled = true;
        this.unschedule(this.stopNetControl);
        this.scheduleOnce(this.stopNetControl, time);
    }

    /**刷新火焰锻造台灼烧状态 */
    refreshFireBurn(damagePercent: number) {
        if (damagePercent <= 0 || this.hp <= 0) {
            return;
        }

        if (this.fireBurnTimer <= 0) {
            this.fireBurnDamageTimer = 0;
        }
        this.fireBurnTimer = this.fireBurnKeepTime;
        this.fireBurnDamagePercent = Math.max(this.fireBurnDamagePercent, damagePercent);
    }

    /**获取千年寒冰对当前攻击目标所在房间的攻速影响 */
    private getIceAttackTimeScale() {
        let roomIdx = this.getCurAttackRoomIdx();
        return iceProps.getEnemyAttackTimeScale(this.gameComp, roomIdx);
    }

    /**获取当前攻击目标所在房间 */
    private getCurAttackRoomIdx() {
        if (this.isAttackingProps && this.attackingTilePos) {
            return this.gameComp?.tileMap?.[this.attackingTilePos.x]?.[this.attackingTilePos.y]?.roomIdx || 0;
        }

        if (this.isAttackingPlayer) {
            return this.targetPlayer?.roomIdx || 0;
        }

        return 0;
    }

    /** 攻击房门时受到荆棘反伤 */
    private updateThornDamage(dt: number) {
        if (!this.isAttackingDoor() || this.hp <= 0 || dt <= 0) {
            this.thornDamageTimer = 0;
            return;
        }

        let roomIdx = this.getCurAttackRoomIdx();
        let thornDamage = thornProps.getRoomDamagePercent(this.gameComp, roomIdx);
        if (thornDamage <= 0) {
            this.thornDamageTimer = 0;
            return;
        }

        this.thornDamageTimer += dt;
        if (this.thornDamageTimer < 1) {
            return;
        }

        this.thornDamageTimer = 0;
        this.takeDamage(this.maxHp * thornDamage);
    }

    /**刷新火焰锻造台灼烧伤害 */
    private updateFireBurn(dt: number) {
        if (this.hp <= 0 || dt <= 0 || this.fireBurnTimer <= 0 || this.fireBurnDamagePercent <= 0) {
            this.clearFireBurn();
            return;
        }

        this.fireBurnTimer = Math.max(0, this.fireBurnTimer - dt);
        this.fireBurnDamageTimer += dt;
        while (this.fireBurnDamageTimer >= 1 && this.hp > 0) {
            this.fireBurnDamageTimer -= 1;
            this.takeDamage(this.maxHp * this.fireBurnDamagePercent);
        }

        if (this.fireBurnTimer <= 0) {
            this.clearFireBurn();
        }
    }

    /**清除火焰锻造台灼烧状态 */
    private clearFireBurn() {
        this.fireBurnTimer = 0;
        this.fireBurnDamageTimer = 0;
        this.fireBurnDamagePercent = 0;
    }

    /**刷新升级计时 */
    private updateUpgradeTimer(dt: number) {
        if (this.isMaxLevel || this.upgradeTime <= 0) {
            return;
        }

        this.upgradeTimer += dt;
        if (this.upgradeTimer < this.upgradeTime) {
            return;
        }

        this.upgrade();
    }

    /**获取当前等级的随机升级时间 */
    private getRandomUpgradeTime() {
        if (this.isMaxLevel) {
            return 0;
        }

        let enemyData = enemyConfig.getEnemyData(this.level);
        if (!enemyData) {
            return 0;
        }

        return enemyData.upgradeTimeMin + Math.random() * (enemyData.upgradeTimeMax - enemyData.upgradeTimeMin);
    }

    /**死亡 */
    die() {
        enemyMgr.removeEnemy(this.roleId);
        this.node.destroy();
        if (enemyMgr.enemyArr.length == 0) {
            uiMgr.openPage(UIPath.UISuccess);
        }
    }

    /**受到伤害 */
    takeDamage(damage: number) {
        if (this.hp <= 0) {
            return true;
        }

        let hpPercentBeforeDamage = this.hpPercent;
        this.recordDamage(damage);
        this.hp -= damage;
        this.refreshHp();
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
            return true;
        }

        if (this.tryTriggerAttackRoomAlarm()) {
            return false;
        }

        if (this.tryHandleDoorAttackHpThreshold(hpPercentBeforeDamage)) {
            return false;
        }

        this.checkRepairHpState();
        return false;
    }

    /**记录受到的伤害 */
    private recordDamage(damage: number) {
        if (damage <= 0) {
            return;
        }

        this.damageRecords.push({ time: Date.now() / 1000, damage: damage });
        this.clearExpiredDamageRecords(2);
    }

    /**获取最近一段时间内受到的伤害 */
    private getRecentDamage(time: number = 1) {
        this.clearExpiredDamageRecords(time);
        let result = 0;
        for (let i = 0; i < this.damageRecords.length; i++) {
            result += this.damageRecords[i].damage;
        }

        return result;
    }

    /**清理过期伤害记录 */
    private clearExpiredDamageRecords(time: number) {
        let minTime = Date.now() / 1000 - time;
        this.damageRecords = this.damageRecords.filter(record => record.time >= minTime);
    }

    /**处理攻击门时血量跨过检测阈值 */
    private tryHandleDoorAttackHpThreshold(hpPercentBeforeDamage: number) {
        if (hpPercentBeforeDamage <= enemyCommonConfig.enemyHpAttackPercent || this.hpPercent > enemyCommonConfig.enemyHpAttackPercent) {
            return false;
        }

        return this.checkDoorAttackEscape();
    }

    /**房门升级后，主动检测正在攻击该门的低血量敌人是否需要逃离 */
    checkDoorUpgradeEscape(doorPos: Vec2) {
        if (this.hpPercent > enemyCommonConfig.enemyHpAttackPercent || !this.isTileSame(this.attackingTilePos, doorPos)) {
            return false;
        }

        return this.checkDoorAttackEscape();
    }

    /**敌人强制离开门重新选择目标 */
    forceChooseTarget(propsPos: Vec2) {
        if (!this.isTileSame(this.attackingTilePos, propsPos)) {
            return;
        }

        this.leaveCurrentDoorAndChooseTarget();
    }

    /**敌人强制离开当前攻击房间，重新选择其他房间目标 */
    forceChooseTargetExcludeRoom(excludeRoomIdx: number) {
        if (excludeRoomIdx <= 0 || this.getCurAttackRoomIdx() != excludeRoomIdx) {
            return;
        }

        this.clearTarget();
        this.emptyRoomIgnoreDoorRoomIdx = 0;
        this.clearMovePath();
        this.playRoleAnim(enemyAnim.move, true);
        this.chooseTargetAndFindPath(excludeRoomIdx);
    }

    /**尝试触发当前攻击房间内的警示铃 */
    private tryTriggerAttackRoomAlarm() {
        if (!this.isAttackingProps) {
            return false;
        }

        let attackRoomIdx = this.getCurAttackRoomIdx();
        if (attackRoomIdx <= 0) {
            return false;
        }

        return alarmProps.tryTriggerRoomAlarm(this.gameComp, attackRoomIdx, this);
    }

    /**检测攻击门时是否需要逃离 */
    private checkDoorAttackEscape() {
        if (!this.isAttackingDoor()) {
            return false;
        }

        let attackRoomIdx = this.getCurAttackRoomIdx();
        let doorComp = this.getTilePropComp(this.attackingTilePos);
        if (!doorComp) {
            return false;
        }

        if (doorComp.hpPercent > enemyCommonConfig.doorHpAttackPercent) {
            this.tryTriggerRoomNet(attackRoomIdx);
            this.startRepairHp();
            return true;
        }

        let enemyDamageSpeed = this.getRecentDamage(2);
        let doorDamageSpeed = doorComp.getRecentDamage(2);
        //敌人受到的伤害大于门受到的伤害则逃离
        if (enemyDamageSpeed > doorDamageSpeed) {
            this.tryTriggerRoomNet(attackRoomIdx);
            this.startRepairHp();
            return true;
        }

        this.isForceAttackingDoor = true;
        return true;
    }

    /**随机选择一个可到达的玩家，并移动到该玩家身边 */
    chooseTargetAndFindPath(excludeRoomIdx: number = 0) {
        if (gm.isGamePause) {
            return;
        }

        if (!this.gameComp?.isEnemyCanMove) {
            this.stopByGamePause();
            return;
        }

        if (this.isRepairingHp) {
            return;
        }

        this.syncCurrentPosByNode();
        this.stopAttackPlayer();

        let candidates = this.getTargetCandidates(excludeRoomIdx);

        if (candidates.length == 0) {
            this.clearTarget();
            this.clearMovePath();
            return;
        }

        for (let i = 0; i < candidates.length; i++) {
            let candidate = candidates[i];
            if (!this.isCandidateValid(candidate)) {
                continue;
            }

            let ignoreDoorRoomIdx = this.getAvailableIgnoreDoorRoomIdx(candidate.ignoreDoorRoomIdx || 0);
            let path = this.findPath(candidate.targetPos, ignoreDoorRoomIdx);
            if (path.length == 0 && !this.isTileSame(this.currentPos, candidate.targetPos)) {
                continue;
            }

            this.setTargetCandidate(candidate, ignoreDoorRoomIdx);
            this.movePath = path;
            this.movePathIdx = 0;
            if (path.length == 0) {
                this.tryHandleArriveTarget();
            } else {
                this.playRoleAnim(enemyAnim.move, true);
            }
            return;
        }

        this.clearTarget();
        this.clearMovePath();
    }

    /**获取敌人目标候选，包含角色和空房间床 */
    private getTargetCandidates(excludeRoomIdx: number = 0): enemyTargetCandidate[] {
        let result: enemyTargetCandidate[] = [];
        let playerComp = playerMgr.playerComp;
        if (this.isRoleTargetValid(playerComp) && !this.isRoleInExcludedRoom(playerComp, excludeRoomIdx)) {
            result.push({
                type: "player",
                targetPos: new Vec2(playerComp.currentPos.x, playerComp.currentPos.y),
                playerComp: playerComp,
            });
        }

        //TODO 暂时只让抓玩家一个人
        return result;

        let robotArr = this.gameComp?.robotArr || [];
        for (let i = 0; i < robotArr.length; i++) {
            let robotComp = robotArr[i];
            if (this.isRoleTargetValid(robotComp) && !this.isRoleInExcludedRoom(robotComp, excludeRoomIdx)) {
                result.push({
                    type: "player",
                    targetPos: new Vec2(robotComp.currentPos.x, robotComp.currentPos.y),
                    playerComp: robotComp,
                });
            }
        }

        let emptyBedCandidates = this.getEmptyBedCandidates(excludeRoomIdx);
        for (let i = 0; i < emptyBedCandidates.length; i++) {
            result.push(emptyBedCandidates[i]);
        }

        ccTools.shuffleArray(result);
        return result;
    }

    /**获取空房间床候选 */
    private getEmptyBedCandidates(excludeRoomIdx: number = 0): enemyTargetCandidate[] {
        let result: enemyTargetCandidate[] = [];
        let roomMap = this.gameComp.roomMap || {};
        let roomKeys = Object.keys(roomMap);
        for (let i = 0; i < roomKeys.length; i++) {
            let roomIdx = Number(roomKeys[i]);
            if (roomIdx == excludeRoomIdx) {
                continue;
            }

            let roomData = roomMap[roomKeys[i]];
            let bedPos: Vec2 = roomData?.bedPos;
            if (!bedPos || !this.isRoomEmpty(roomIdx)) {
                continue;
            }

            if (!this.isEmptyBedTargetValid(bedPos)) {
                continue;
            }

            result.push({
                type: "emptyBed",
                targetPos: new Vec2(bedPos.x, bedPos.y),
                ignoreDoorRoomIdx: roomIdx,
            });
        }

        return result;
    }

    /**房间是否没有在床上的角色 */
    private isRoomEmpty(roomIdx: number) {
        let playerComp = playerMgr.playerComp;
        if (this.isRoleSleepingInRoom(playerComp, roomIdx)) {
            return false;
        }

        let robotArr = this.gameComp?.robotArr || [];
        for (let i = 0; i < robotArr.length; i++) {
            let robotComp = robotArr[i];
            if (this.isRoleSleepingInRoom(robotComp, roomIdx)) {
                return false;
            }
        }

        return true;
    }

    /**设置当前目标 */
    private setTargetCandidate(candidate: enemyTargetCandidate, moveIgnoreDoorRoomIdx: number) {
        this.moveIgnoreDoorRoomIdx = moveIgnoreDoorRoomIdx;
        if (candidate.type == "player") {
            this.targetPlayer = candidate.playerComp;
            this.targetEmptyBedPos = null;
            this.targetEmptyBedRoomIdx = 0;
        } else {
            this.targetPlayer = null;
            this.targetEmptyBedPos = new Vec2(candidate.targetPos.x, candidate.targetPos.y);
            this.targetEmptyBedRoomIdx = candidate.ignoreDoorRoomIdx || 0;
        }
    }

    /**清理当前目标 */
    private clearTarget() {
        this.targetPlayer = null;
        this.targetEmptyBedPos = null;
        this.targetEmptyBedRoomIdx = 0;
        this.moveIgnoreDoorRoomIdx = 0;
    }

    /**目标候选是否仍然有效 */
    private isCandidateValid(candidate: enemyTargetCandidate) {
        if (!candidate) {
            return false;
        }

        if (candidate.type == "player") {
            return this.isRoleTargetValid(candidate.playerComp);
        }

        return this.isEmptyBedTargetValid(candidate.targetPos);
    }

    /**角色目标是否有效 */
    private isRoleTargetValid(roleComp: roleController) {
        return !!roleComp
            && !!roleComp.node
            && roleComp.node.isValid
            && roleComp.state != roleState.dead
            && !!roleComp.currentPos;
    }

    /**角色是否正在指定房间的床上 */
    private isRoleSleepingInRoom(roleComp: roleController, roomIdx: number) {
        return this.isRoleTargetValid(roleComp)
            && roleComp.state == roleState.bed
            && roleComp.roomIdx == roomIdx;
    }

    /**角色是否在本次需要排除的房间 */
    private isRoleInExcludedRoom(roleComp: roleController, excludeRoomIdx: number) {
        return excludeRoomIdx > 0 && roleComp?.roomIdx == excludeRoomIdx;
    }

    /**空床目标是否有效 */
    private isEmptyBedTargetValid(bedPos: Vec2) {
        if (!bedPos) {
            return false;
        }

        let tileData = this.gameComp?.tileMap?.[bedPos.x]?.[bedPos.y];
        let tileItem = tileData?.item;
        if (!tileItem || tileItem.tileType != tilePropsType.bed || !tileItem.propsItem || !tileItem.propsItem.isValid) {
            return false;
        }

        let bedComp = tileItem.propsComp as bedProps;
        return !!bedComp && !bedComp.isOccupied && !bedComp.isRobotOccupied;
    }

    /**获取本次寻路可忽略门的房间 */
    private getAvailableIgnoreDoorRoomIdx(candidateRoomIdx: number) {
        if (candidateRoomIdx > 0) {
            return candidateRoomIdx;
        }

        if (this.emptyRoomIgnoreDoorRoomIdx <= 0) {
            return 0;
        }

        if (this.isInRoomOrDoor(this.currentPos, this.emptyRoomIgnoreDoorRoomIdx)) {
            return this.emptyRoomIgnoreDoorRoomIdx;
        }

        this.emptyRoomIgnoreDoorRoomIdx = 0;
        return 0;
    }

    /**BFS寻路，返回值不包含起点，包含终点 */
    private findPath(targetPos: Vec2, ignoreDoorRoomIdx: number = 0): Vec2[] {
        if (!pData.mapSize || pData.mapSize.width <= 0 || pData.mapSize.height <= 0) {
            return [];
        }

        let startPos = new Vec2(this.currentPos.x, this.currentPos.y);
        if (!this.canEnemyWalk(startPos, ignoreDoorRoomIdx) || !this.canEnemyWalk(targetPos, ignoreDoorRoomIdx)) {
            return [];
        }

        if (startPos.x == targetPos.x && startPos.y == targetPos.y) {
            return [];
        }

        let queue: Vec2[] = [startPos];
        let visited: boolean[][] = Array.from(
            { length: pData.mapSize.width },
            () => Array.from({ length: pData.mapSize.height }, () => false)
        );
        let parent: (Vec2 | null)[][] = Array.from(
            { length: pData.mapSize.width },
            () => Array.from({ length: pData.mapSize.height }, () => null)
        );
        let dirs = [
            new Vec2(1, 0),
            new Vec2(-1, 0),
            new Vec2(0, 1),
            new Vec2(0, -1),
        ];
        let head = 0;
        visited[startPos.x][startPos.y] = true;

        while (head < queue.length) {
            let curPos = queue[head++];
            if (curPos.x == targetPos.x && curPos.y == targetPos.y) {
                return this.buildPath(parent, startPos, targetPos);
            }

            for (let i = 0; i < dirs.length; i++) {
                let nextPos = new Vec2(curPos.x + dirs[i].x, curPos.y + dirs[i].y);
                if (!this.canEnemyWalk(nextPos, ignoreDoorRoomIdx) || visited[nextPos.x][nextPos.y]) {
                    continue;
                }

                visited[nextPos.x][nextPos.y] = true;
                parent[nextPos.x][nextPos.y] = curPos;
                queue.push(nextPos);
            }
        }

        return [];
    }

    /**还原路径 */
    private buildPath(parent: (Vec2 | null)[][], startPos: Vec2, targetPos: Vec2): Vec2[] {
        let path: Vec2[] = [];
        let curPos = new Vec2(targetPos.x, targetPos.y);

        while (curPos.x != startPos.x || curPos.y != startPos.y) {
            path.unshift(new Vec2(curPos.x, curPos.y));
            let prePos = parent[curPos.x][curPos.y];
            if (!prePos) {
                return [];
            }
            curPos = prePos;
        }

        return path;
    }

    /**敌人寻路可通行判断：只拦墙，门和道具暂时不拦 */
    private canEnemyWalk(tilePos: Vec2, ignoreDoorRoomIdx: number = 0) {
        if (tilePos.x < 0 || tilePos.y < 0 || tilePos.x >= pData.mapSize.width || tilePos.y >= pData.mapSize.height) {
            return false;
        }

        let tileData = this.gameComp.tileMap[tilePos.x]?.[tilePos.y];
        if (!tileData) {
            return false;
        }

        if (this.isIgnoredRoomDoor(tilePos, ignoreDoorRoomIdx) || this.isEmptyRoomDoor(tilePos)) {
            return true;
        }

        return tileData.block != 1 || !!tileData.item;
    }

    /**是否为空房间目标需要忽略的门 */
    private isIgnoredRoomDoor(tilePos: Vec2, roomIdx: number) {
        if (roomIdx <= 0) {
            return false;
        }

        let roomData = this.gameComp.roomMap[roomIdx];
        let doorPos: Vec2 = roomData?.doorPos;
        return !!doorPos && doorPos.x == tilePos.x && doorPos.y == tilePos.y;
    }

    /**是否是空房间的门 */
    private isEmptyRoomDoor(tilePos: Vec2) {
        let roomMap = this.gameComp.roomMap || {};
        let roomKeys = Object.keys(roomMap);
        for (let i = 0; i < roomKeys.length; i++) {
            let roomIdx = Number(roomKeys[i]);
            if (this.isIgnoredRoomDoor(tilePos, roomIdx)) {
                return this.isRoomEmpty(roomIdx);
            }
        }

        return false;
    }

    /**指定坐标是否在房间内或房间门上 */
    private isInRoomOrDoor(tilePos: Vec2, roomIdx: number) {
        if (roomIdx <= 0 || !tilePos) {
            return false;
        }

        let tileRoomIdx = this.gameComp.tileMap[tilePos.x]?.[tilePos.y]?.roomIdx || 0;
        return tileRoomIdx == roomIdx || this.isIgnoredRoomDoor(tilePos, roomIdx);
    }

    /**离开空房间后清理忽略门状态 */
    private refreshEmptyRoomIgnoreDoorState() {
        if (this.emptyRoomIgnoreDoorRoomIdx <= 0) {
            return;
        }

        if (!this.isInRoomOrDoor(this.currentPos, this.emptyRoomIgnoreDoorRoomIdx)) {
            this.emptyRoomIgnoreDoorRoomIdx = 0;
        }
    }

    /**按路径移动，下一格有道具时停在当前格攻击道具 */
    private moveByPath(dt: number) {
        if (this.isAttackingPlayer) {
            return;
        }

        if (this.movePathIdx >= this.movePath.length) {
            if (this.isRepairingHp) {
                this.repairHp(dt);
                return;
            }

            this.tryHandleArriveTarget();
            return;
        }

        let nextTilePos = this.movePath[this.movePathIdx];
        if (this.isRepairingHp) {
            this.stopAttackProps();
        } else if (this.isEmptyRoomDoor(nextTilePos)) {
            this.stopAttackProps();
        } else if (this.isTargetIgnoredDoorTile(nextTilePos)) {
            this.stopAttackProps();
        } else if (this.isTargetEmptyBedTile(nextTilePos)) {
            this.stopAttackProps();
        } else if (this.isTargetPlayerTile(nextTilePos)) {
            this.stopAttackProps();
        } else if (this.tryAttackNextTileProps(nextTilePos)) {
            return;
        }

        this.stopAttackProps();
        this.playRoleAnim(enemyAnim.move, true);

        let targetNodePos = ccTools.getPosByTileIndex(nextTilePos);
        let curNodePos = this.node.position;
        let offsetX = targetNodePos.x - curNodePos.x;
        let offsetY = targetNodePos.y - curNodePos.y;
        let distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        let moveDistance = configData.enemyMoveSpeed * dt;

        if (distance <= moveDistance || distance <= 0.001) {
            this.node.setPosition(targetNodePos);
            this.currentPos = new Vec2(nextTilePos.x, nextTilePos.y);
            this.refreshEmptyRoomIgnoreDoorState();
            this.movePathIdx++;

            if (this.movePathIdx >= this.movePath.length) {
                if (this.isRepairingHp) {
                    this.repairHp(dt);
                    return;
                }

                this.tryHandleArriveTarget();
            }
            return;
        }

        let moveRatio = moveDistance / distance;
        let moveX = offsetX * moveRatio;
        let moveY = offsetY * moveRatio;
        this.node.setPosition(new Vec3(curNodePos.x + moveX, curNodePos.y + moveY, curNodePos.z));
    }

    /**如果下一格有门、床、道具等，则停下攻击 */
    private tryAttackNextTileProps(nextTilePos: Vec2) {
        let propComp = this.getTilePropComp(nextTilePos);
        if (!propComp) {
            this.stopAttackProps();
            return false;
        }

        if (!this.attackingTilePos || this.attackingTilePos.x != nextTilePos.x || this.attackingTilePos.y != nextTilePos.y) {
            this.attackingTilePos = new Vec2(nextTilePos.x, nextTilePos.y);
            this.hasFearCurAttackDoor = false;
            this.hasHandleTeamCannonCurAttackDoor = false;
            this.isForceAttackingDoor = false;
            this.resetDoorAttackTimeCheck();
            this.thornDamageTimer = 0;
            if (propComp.propsType == tilePropsType.door) {
                this.gameComp?.onDoorAttackStartedByEnemy(nextTilePos);
            }
            this.startAttackProps();
        }

        return true;
    }

    /**开始播放攻击道具动画 */
    private startAttackProps() {
        this.isAttackingProps = true;
        this.playRoleAnim(enemyAnim.attack, true);
        this.refreshRoleAnimTimeScale();
    }

    /**停止攻击道具状态 */
    private stopAttackProps() {
        if (!this.isAttackingProps && !this.attackingTilePos) {
            return;
        }

        this.stopCageControl();
        this.isAttackingProps = false;
        this.attackingTilePos = null;
        this.hasFearCurAttackDoor = false;
        this.hasHandleTeamCannonCurAttackDoor = false;
        this.isForceAttackingDoor = false;
        this.resetDoorAttackTimeCheck();
        this.thornDamageTimer = 0;
    }

    /**开始攻击目标角色 */
    private startAttackPlayer() {
        this.clearMovePath();
        this.isAttackingPlayer = true;
        this.playRoleAnim(enemyAnim.attack, true);
        this.refreshRoleAnimTimeScale();
    }

    /**停止攻击角色状态 */
    private stopAttackPlayer() {
        this.stopCageControl();
        this.isAttackingPlayer = false;
    }

    /**检测是否需要回出生点回血 */
    private checkRepairHpState() {
        if (!this.gameComp?.isEnemyCanMove || this.isRepairingHp || this.hp <= 0 || this.hp > this.maxHp * enemyCommonConfig.enemyEscapeHpPercent) {
            return;
        }

        if (this.isAttackingDoor()) {
            return;
        }

        this.startRepairHp();
    }

    /**是否正在攻击门 */
    private isAttackingDoor() {
        if (!this.isAttackingProps || !this.attackingTilePos) {
            return false;
        }

        let propComp = this.getTilePropComp(this.attackingTilePos);
        return propComp?.propsType == tilePropsType.door;
    }

    /**刷新高血量攻击门秒伤循环检测 */
    private updateDoorAttackTimeCheck(dt: number) {
        if (!this.isAttackingDoor()) {
            this.resetDoorAttackTimeCheck();
            return;
        }

        if (this.hpPercent <= enemyCommonConfig.enemyHpAttackPercent || this.isForceAttackingDoor) {
            return;
        }

        let tilePos = this.attackingTilePos;
        let doorComp = this.getTilePropComp(tilePos);
        if (!doorComp) {
            this.resetDoorAttackTimeCheck();
            return;
        }

        if (!this.isTileSame(this.doorAttackTimeCheckTilePos, tilePos)) {
            this.startDoorAttackTimeCheck(tilePos);
        }

        if (this.doorAttackTimeCheckState == "passed") {
            return;
        }

        if (this.doorAttackTimeCheckState == "waiting") {
            this.doorAttackTimeCheckTimer += dt;
            if (this.doorAttackTimeCheckTimer >= enemyCommonConfig.doorAttackTimeThreshold) {
                this.doorAttackTimeCheckState = "recording";
                this.doorAttackTimeCheckTimer = 0;
                this.doorAttackTimeCheckDamage = 0;
            }
            return;
        }

        if (this.doorAttackTimeCheckState != "recording") {
            return;
        }

        this.doorAttackTimeCheckTimer += dt;
        if (this.doorAttackTimeCheckTimer < enemyCommonConfig.doorAttackTimeDamage) {
            return;
        }

        this.checkDoorAttackTimeDamage(doorComp);
    }

    /**开始高血量攻击门秒伤检测 */
    private startDoorAttackTimeCheck(tilePos: Vec2) {
        this.doorAttackTimeCheckTilePos = new Vec2(tilePos.x, tilePos.y);
        this.doorAttackTimeCheckTimer = 0;
        this.doorAttackTimeCheckDamage = 0;

        if (enemyCommonConfig.doorAttackTimeThreshold <= 0) {
            this.doorAttackTimeCheckState = "recording";
            return;
        }

        this.doorAttackTimeCheckState = "waiting";
    }

    /**记录高血量攻击门当前检测窗口内造成的伤害 */
    private recordDoorAttackTimeDamage(damage: number) {
        if (this.doorAttackTimeCheckState != "recording" || this.hpPercent <= enemyCommonConfig.enemyHpAttackPercent || damage <= 0) {
            return;
        }

        this.doorAttackTimeCheckDamage += damage;
    }

    /**检测高血量攻击门当前窗口秒伤是否达到阈值 */
    private checkDoorAttackTimeDamage(doorComp: gamePropsBase) {
        if (enemyCommonConfig.doorAttackTimeDamage <= 0 || doorComp.maxHp <= 0) {
            this.doorAttackTimeCheckState = "passed";
            return;
        }

        let damageSpeed = this.doorAttackTimeCheckDamage / enemyCommonConfig.doorAttackTimeDamage;
        let damagePercent = damageSpeed / doorComp.maxHp;
        if (damagePercent >= enemyCommonConfig.doorAttackTimeDamagePercent) {
            this.doorAttackTimeCheckTimer = 0;
            this.doorAttackTimeCheckDamage = 0;
            return;
        }

        this.leaveCurrentDoorAndChooseTarget();
    }

    /**离开当前门并重新寻找其他目标 */
    private leaveCurrentDoorAndChooseTarget() {
        let attackRoomIdx = this.getCurAttackRoomIdx();
        this.tryTriggerRoomNet(attackRoomIdx);

        if (this.shouldReturnBornWhenForceLeave()) {
            this.startRepairHp(true);
            return;
        }

        this.clearTarget();
        this.emptyRoomIgnoreDoorRoomIdx = 0;
        this.clearMovePath();
        this.playRoleAnim(enemyAnim.move, true);
        this.chooseTargetAndFindPath();
    }

    /**强制离开时，如果只剩当前正在攻击的目标，则回出生点等待后再重新寻找 */
    private shouldReturnBornWhenForceLeave() {
        let candidates = this.getTargetCandidates();
        if (candidates.length != 1) {
            return false;
        }

        return this.isCurrentTargetCandidate(candidates[0]);
    }

    /**候选目标是否为当前目标 */
    private isCurrentTargetCandidate(candidate: enemyTargetCandidate) {
        if (!candidate) {
            return false;
        }

        if (candidate.type == "player") {
            return !!this.targetPlayer && candidate.playerComp == this.targetPlayer;
        }

        return this.isTileSame(candidate.targetPos, this.targetEmptyBedPos);
    }

    /**重置高血量攻击门秒伤检测 */
    private resetDoorAttackTimeCheck() {
        this.doorAttackTimeCheckState = "none";
        this.doorAttackTimeCheckTimer = 0;
        this.doorAttackTimeCheckDamage = 0;
        this.doorAttackTimeCheckTilePos = null;
    }

    /**开始回出生点回血 */
    private startRepairHp(waitReturnStart: boolean = false) {
        let bornPos = this.getNearestBornPos();
        if (!bornPos) {
            return;
        }

        this.syncCurrentPosByNode();
        this.isRepairingHp = true;
        this.repairBornPos = bornPos;
        this.needWaitReturnStart = waitReturnStart;
        this.isWaitingReturnStart = false;
        this.returnStartTimer = 0;
        this.clearTarget();
        this.emptyRoomIgnoreDoorRoomIdx = 0;
        this.stopAttackPlayer();
        this.stopAttackProps();
        this.movePath = this.findPath(bornPos);
        this.movePathIdx = 0;

        if (this.movePath.length == 0 && !this.isTileSame(this.currentPos, bornPos)) {
            this.isRepairingHp = false;
            this.repairBornPos = null;
            this.needWaitReturnStart = false;
            this.chooseTargetAndFindPath();
            return;
        }

        this.playRoleAnim(enemyAnim.move, true);
    }

    /**获取最近的出生点 */
    private getNearestBornPos(): Vec2 {
        let bornPosArr = enemyMgr.enemyBornPosArr || [];
        if (bornPosArr.length == 0) {
            return null;
        }

        let nearestPos: Vec2 = null;
        let minDistanceSqr = Number.MAX_VALUE;
        for (let i = 0; i < bornPosArr.length; i++) {
            let bornPos = bornPosArr[i];
            let offsetX = bornPos.x - this.currentPos.x;
            let offsetY = bornPos.y - this.currentPos.y;
            let distanceSqr = offsetX * offsetX + offsetY * offsetY;
            if (distanceSqr < minDistanceSqr) {
                minDistanceSqr = distanceSqr;
                nearestPos = bornPos;
            }
        }

        return nearestPos ? new Vec2(nearestPos.x, nearestPos.y) : null;
    }

    /**出生点回血 */
    private repairHp(dt: number) {
        if (!this.isRepairingHp) {
            return;
        }

        this.playRoleAnim(enemyAnim.move, true);
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * enemyCommonConfig.enemyHpRepairSpeed / 100 * dt);
        this.refreshHp();

        if (this.hp < this.maxHp) {
            return;
        }

        this.isRepairingHp = false;
        this.repairBornPos = null;
        this.clearMovePath();
        if (this.needWaitReturnStart) {
            this.needWaitReturnStart = false;
            this.isWaitingReturnStart = true;
            this.returnStartTimer = 0;
            return;
        }

        this.chooseTargetAndFindPath();
    }

    /**刷新出生点等待重新出发状态 */
    private updateReturnStartWait(dt: number) {
        if (!this.isWaitingReturnStart) {
            return false;
        }

        if (enemyCommonConfig.returnStartTime <= 0) {
            this.finishReturnStartWait();
            return true;
        }

        this.playRoleAnim(enemyAnim.move, true);
        this.returnStartTimer += dt;
        if (this.returnStartTimer >= enemyCommonConfig.returnStartTime) {
            this.finishReturnStartWait();
        }

        return true;
    }

    /**结束出生点等待并重新寻找目标 */
    private finishReturnStartWait() {
        this.isWaitingReturnStart = false;
        this.returnStartTimer = 0;
        this.chooseTargetAndFindPath();
    }

    /**游戏暂停时停止当前行为 */
    private stopByGamePause() {
        if (this.hasStopByGamePause) {
            return;
        }

        this.hasStopByGamePause = true;
        this.clearTarget();
        this.emptyRoomIgnoreDoorRoomIdx = 0;
        this.isRepairingHp = false;
        this.repairBornPos = null;
        this.needWaitReturnStart = false;
        this.isWaitingReturnStart = false;
        this.returnStartTimer = 0;
        this.clearMovePath();
        this.stopAttackPlayer();
        this.resetRageSkill();
        this.stopNetControl();
    }

    /**尝试处理到达当前目标 */
    private tryHandleArriveTarget() {
        if (this.targetEmptyBedPos) {
            if (!this.isEmptyBedTargetValid(this.targetEmptyBedPos)) {
                this.clearTarget();
                this.clearMovePath();
                this.chooseTargetAndFindPath();
                return;
            }

            if (this.isTileSame(this.currentPos, this.targetEmptyBedPos)) {
                this.destroyTargetEmptyBed();
                this.emptyRoomIgnoreDoorRoomIdx = this.targetEmptyBedRoomIdx;
                this.clearTarget();
                this.clearMovePath();
                this.chooseTargetAndFindPath();
                return;
            }

            this.chooseTargetAndFindPath();
            return;
        }

        this.tryAttackTargetPlayer();
    }

    /**破坏当前目标空床 */
    private destroyTargetEmptyBed() {
        if (!this.targetEmptyBedPos) {
            return;
        }

        let tileData = this.gameComp.tileMap[this.targetEmptyBedPos.x]?.[this.targetEmptyBedPos.y];
        let tileItem = tileData?.item;
        let bedComp = tileItem?.propsComp as bedProps;
        if (!tileData || !tileItem || tileItem.tileType != tilePropsType.bed || !bedComp) {
            return;
        }

        let roomIdx = tileData.roomIdx || tileItem.roomIdx;
        bedComp.removeProps();
        tileItem.tileType = tilePropsType.none;
        tileData.block = 0;
        this.gameComp?.grayRoomAfterBedDestroyed(roomIdx);
    }

    /**尝试攻击当前目标角色 */
    private tryAttackTargetPlayer() {
        if (!this.isTargetPlayerValid()) {
            this.clearTarget();
            this.chooseTargetAndFindPath();
            return;
        }

        if (!this.isTileSame(this.currentPos, this.targetPlayer.currentPos)) {
            this.chooseTargetAndFindPath();
            return;
        }

        this.startAttackPlayer();
    }

    /**角色动画完成回调 */
    private onRoleAnimComplete(trackEntry: any) {
        if (gm.isGamePause) {
            return;
        }

        let animName = trackEntry?.animation?.name;
        if (this.isAttackingPlayer && animName == enemyAnim.attack) {
            this.tryStartRageSkill();
            this.killTargetPlayer();
            return;
        }

        if (!this.isAttackingProps || animName != enemyAnim.attack || !this.attackingTilePos) {
            return;
        }

        if (this.tryStartRageSkill()) {
            return;
        }

        let tilePos = new Vec2(this.attackingTilePos.x, this.attackingTilePos.y);
        let propComp = this.getTilePropComp(tilePos);
        if (!propComp) {
            this.stopAttackProps();
            this.playRoleAnim(enemyAnim.move, true);
            return;
        }

        this.attackProps(propComp, tilePos);
    }

    /**击杀当前目标角色 */
    private killTargetPlayer() {
        let targetPlayer = this.targetPlayer;
        if (this.isTargetPlayerValid()) {
            let isMainPlayer = targetPlayer.roleId == playerMgr.playerComp?.roleId;
            this.clearBedPropsByRole(targetPlayer);
            targetPlayer.state = roleState.dead;
            for (let i = 0; i < targetPlayer.node.children.length; i++) {
                targetPlayer.node.children[i].active = false;
            }

            if (isMainPlayer) {
                this.stopAttackPlayer();
                this.clearTarget();
                this.clearMovePath();
                return;
            }
        }

        this.stopAttackPlayer();
        this.clearTarget();
        this.playRoleAnim(enemyAnim.move, true);
        this.chooseTargetAndFindPath();
    }

    /**清除角色所在房间的床道具 */
    private clearBedPropsByRole(roleComp: roleController) {
        if (!roleComp || roleComp.roomIdx <= 0) {
            return;
        }

        let roomData = this.gameComp.roomMap[roleComp.roomIdx];
        let bedPos: Vec2 = roomData?.bedPos;
        if (!bedPos) {
            return;
        }

        let tileData = this.gameComp.tileMap[bedPos.x]?.[bedPos.y];
        let tileItem = tileData?.item;
        let bedComp = tileItem?.propsComp as bedProps;
        if (!tileItem || tileItem.tileType != tilePropsType.bed || !bedComp) {
            return;
        }

        let roomIdx = roleComp.roomIdx;
        bedComp.removeProps();
        tileItem.tileType = tilePropsType.none;
        tileData.block = 0;
        this.gameComp?.grayRoomAfterBedDestroyed(roomIdx);
    }

    /**播放角色动画 */
    private playRoleAnim(animName: string, loop: boolean) {
        if (!this.roleAnim || this.curRoleAnimName == animName) {
            return;
        }

        this.curRoleAnimName = animName;
        this.roleAnim.setAnimation(0, animName, loop);
        this.refreshRoleAnimTimeScale();
    }

    /**尝试在释放技能时触发铁笼控制 */
    private tryStartCageControl() {
        if (this.isCageControlled || !this.isAttackingDoor()) {
            return false;
        }

        let tilePos = this.attackingTilePos;
        let roomIdx = this.gameComp?.tileMap?.[tilePos.x]?.[tilePos.y]?.roomIdx || 0;
        if (!cageProps.checkControlEnemy(this.gameComp, roomIdx, this)) {
            return false;
        }

        this.isCageControlled = true;
        this.refreshRoleAnimTimeScale();
        this.scheduleOnce(this.stopCageControl, cageProps.getControlDuration());
        return true;
    }

    /**结束铁笼控制 */
    private stopCageControl() {
        if (!this.isCageControlled) {
            return;
        }

        this.unschedule(this.stopCageControl);
        this.isCageControlled = false;
        this.refreshRoleAnimTimeScale();
    }

    /**结束渔网控制 */
    private stopNetControl() {
        if (!this.isNetControlled) {
            return;
        }

        this.unschedule(this.stopNetControl);
        this.isNetControlled = false;
    }

    /**触发当前攻击房间内的渔网 */
    private tryTriggerRoomNet(roomIdx: number) {
        return netProps.tryTriggerRoomNet(this.gameComp, roomIdx, this);
    }

    /**攻击道具 */
    private attackProps(propComp: gamePropsBase, tilePos: Vec2) {
        let isAttackDoor = propComp.propsType == tilePropsType.door;
        let hpBeforeDamage = propComp.hp;
        if (isAttackDoor && !this.hasHandleTeamCannonCurAttackDoor) {
            this.hasHandleTeamCannonCurAttackDoor = true;
            this.gameComp?.handleTeamCannonByEnemyFirstDoorAttack(tilePos, this.currentPos);
        }

        let isDestroyed = propComp.takeDamage(this.attackDamage);
        let actualDamage = Math.max(0, hpBeforeDamage - propComp.hp);
        let actualDamagePercent = propComp.getDamagePercent(actualDamage);
        if (isAttackDoor) {
            if (actualDamage > 0) {
                this.recordDoorAttackTimeDamage(actualDamage);
                this.gameComp?.onDoorAttackedByEnemy(tilePos, actualDamagePercent);
            }
        }
        this.tryReleaseFearSkill(propComp, tilePos, isAttackDoor);
        if (isDestroyed) {
            if (propComp.propsType == tilePropsType.bed) {
                let roomIdx = this.gameComp?.tileMap?.[tilePos.x]?.[tilePos.y]?.roomIdx || 0;
                this.gameComp?.grayRoomAfterBedDestroyed(roomIdx);
            }

            this.clearDestroyedProps(tilePos);

            if (isAttackDoor && this.hpPercent < enemyCommonConfig.goalHpThresholdPercent) {
                this.startRepairHp();
                return;
            }

            if (this.movePathIdx >= this.movePath.length - 1) {
                this.clearMovePath();
                this.chooseTargetAndFindPath();
            }
        }
    }

    private tryReleaseFearSkill(propComp: gamePropsBase, tilePos: Vec2, isAttackDoor: boolean) {
        if (this.hasFearCurAttackDoor || !isAttackDoor) {
            return;
        }

        if (propComp.hpPercent > enemyCommonConfig.doorEscapeHpPercent || this.hpPercent < enemyCommonConfig.selfEscapeHpPercent) {
            return;
        }

        uiMgr.showTips("猎梦者释放震慑技能");
        if (this.tryStartCageControl()) {
            this.hasFearCurAttackDoor = true;
            return;
        }

        this.hasFearCurAttackDoor = true;
        this.fearCannonsAround(tilePos);
    }

    /**震慑门周围的炮台 */
    private fearCannonsAround(centerPos: Vec2) {
        if (!this.gameComp?.tileMap || enemyCommonConfig.fearRange <= 0 || enemyCommonConfig.fearTime <= 0) {
            return;
        }

        let rangeSqr = enemyCommonConfig.fearRange * enemyCommonConfig.fearRange;
        for (let x = 0; x < this.gameComp.tileMap.length; x++) {
            let tileColumn = this.gameComp.tileMap[x];
            if (!tileColumn) {
                continue;
            }

            for (let y = 0; y < tileColumn.length; y++) {
                let tileItem = tileColumn[y]?.item;
                if (!tileItem || tileItem.tileType != tilePropsType.cannon) {
                    continue;
                }

                let offsetX = x - centerPos.x;
                let offsetY = y - centerPos.y;
                if (offsetX * offsetX + offsetY * offsetY > rangeSqr) {
                    continue;
                }

                let cannonComp = tileItem.propsComp as cannonProps;
                cannonComp?.fear(enemyCommonConfig.fearTime);
            }
        }
    }

    /**获取指定瓦片上的道具脚本 */
    private getTilePropComp(tilePos: Vec2): gamePropsBase {
        let tileData = this.gameComp.tileMap[tilePos.x]?.[tilePos.y];
        let tileItem = tileData?.item;
        if (!tileItem || tileItem.tileType == tilePropsType.none || !tileItem.propsItem) {
            return null;
        }

        return tileItem.propsComp;
    }

    /**道具被摧毁后，清理瓦片上的道具状态，后续可继续沿路径移动 */
    private clearDestroyedProps(tilePos: Vec2) {
        let tileData = this.gameComp.tileMap[tilePos.x]?.[tilePos.y];
        let tileItem = tileData?.item;
        if (!tileItem) {
            return;
        }

        tileItem.propsItem = null;
        tileItem.tileType = tilePropsType.none;
        tileData.block = 0;
        this.stopAttackProps();
        this.playRoleAnim(enemyAnim.move, true);
    }

    /**根据节点位置同步当前瓦片坐标 */
    private syncCurrentPosByNode() {
        this.currentPos = ccTools.getTileIndexByNodePos(this.node.position);
    }

    /**目标角色是否有效 */
    private isTargetPlayerValid() {
        return this.isRoleTargetValid(this.targetPlayer);
    }

    /**指定瓦片是否是目标角色所在瓦片 */
    private isTargetPlayerTile(tilePos: Vec2) {
        return this.isTargetPlayerValid() && this.isTileSame(tilePos, this.targetPlayer.currentPos);
    }

    /**指定瓦片是否是目标空床所在瓦片 */
    private isTargetEmptyBedTile(tilePos: Vec2) {
        return this.isEmptyBedTargetValid(this.targetEmptyBedPos) && this.isTileSame(tilePos, this.targetEmptyBedPos);
    }

    /**指定瓦片是否是空床目标可忽略的门 */
    private isTargetIgnoredDoorTile(tilePos: Vec2) {
        return this.moveIgnoreDoorRoomIdx > 0 && this.isIgnoredRoomDoor(tilePos, this.moveIgnoreDoorRoomIdx);
    }

    /**两个瓦片坐标是否相同 */
    private isTileSame(posA: Vec2, posB: Vec2) {
        return posA && posB && posA.x == posB.x && posA.y == posB.y;
    }

    /**清空移动路径 */
    private clearMovePath() {
        this.movePath = [];
        this.movePathIdx = 0;
        this.stopAttackProps();
    }
}

interface enemyTargetCandidate {
    /**目标类型 */
    type: "player" | "emptyBed";
    /**目标坐标 */
    targetPos: Vec2;
    /**角色目标 */
    playerComp?: roleController;
    /**寻路时忽略该房间的门 */
    ignoreDoorRoomIdx?: number;
}
