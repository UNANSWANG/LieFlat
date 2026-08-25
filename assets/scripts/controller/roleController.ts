import { _decorator, Component, Label, Node, sp, tween, Tween, UIOpacity, UITransform, Vec2, Vec3 } from 'cc';
import { pData } from '../manager/playerData';
import { ccTools } from '../extention/generalTools';
import { configData, GameEvent, robotCommonConfig } from '../manager/configData';
import type { UIGame } from '../UIPage/UIGame';
import { bedProps } from './props/bedProps';
import { gm } from '../manager/gm';
import { playerMgr } from '../manager/playerManager';
import { uiMgr } from '../manager/UIManager';
import { spinePath, UIPath } from '../manager/pathConfig';
import { robotUpgradeConfig } from '../json/jsonRobotUpgrade';
import { tilePropsType } from './tileItemController';
import { poolMgr } from '../manager/poolManager';
import { cannonBuildConfig } from '../json/jsonCannonBuild';
import type { JsonCannonBuildData } from '../json/jsonCannonBuild';
import { robotDifficultyConfig } from '../json/jsonRobotDifficulty';
import type { JsonRobotDifficultyData } from '../json/jsonRobotDifficulty';
import { veinBuildConfig } from '../json/jsonVeinBuild';
const { ccclass, property } = _decorator;

export enum roleState {
    /**正常 */
    normal = 0,
    /**床上 */
    bed = 1,
    /**死亡 */
    dead = 2,
}

export enum roleAnimName {
    /**静止 */
    idle = "idle",
    /**移动 */
    move = "move",
}

@ccclass('roleController')
export class roleController extends Component {
    /**角色当前游戏内id */
    roleId: number = 0;
    /**角色皮肤id */
    skinId: number = 0;
    /**当前角色所在瓦片位置 */
    currentPos: Vec2 = new Vec2();
    /**角色所在房间号-1：未进入房间，其他值：房间索引 */
    roomIdx: number = -1;
    /**游戏脚本 */
    gameComp: UIGame = null;
    /**机器人寻路路径 */
    private movePath: Vec2[] = [];
    /**当前路径索引 */
    private movePathIdx: number = 0;
    /**机器人目标位置 */
    private targetPos: Vec2 = new Vec2();
    /**移动计算复用坐标 */
    private tempTargetNodePos: Vec3 = new Vec3();
    /**机器人当前是否已经预定床位 */
    private hasTargetBed: boolean = false;
    /**机器人当前是否已经预定随机道具 */
    private hasTargetRandomProps: boolean = false;
    /**机器人当前携带的随机道具数据 */
    private carriedRandomPropsData: robotCarriedRandomPropsData = null;
    /**机器人上床后的升级配置索引 */
    private robotUpgradeIdx: number = 0;
    /**机器人当前升级计时 */
    private robotUpgradeTimer: number = 0;
    /**机器人当前升级所需时间 */
    private robotUpgradeTime: number = 0;
    /**机器人是否正在按配置升级房间道具 */
    private isRobotUpgrading: boolean = false;
    /**机器人发电机建造计时 */
    private generatorBuildTimer: number = 0;
    /**机器人发电机建造所需时间 */
    private generatorBuildTime: number = 0;
    /**机器人发电机升级计时 */
    private generatorUpgradeTimer: number = 0;
    /**机器人发电机升级所需时间 */
    private generatorUpgradeTime: number = 0;
    /**房门受攻击后升级次数 */
    private doorAttackUpgradeCount: number = 0;
    /**房门受攻击后升级冷却 */
    private doorAttackUpgradeCoolDown: number = 0;
    /**后期高伤房门升级是否已使用 */
    private laterHighDamageDoorUpgradeUsed: boolean = false;
    /**当前是否有敌人正在连续攻击房门 */
    private isDoorAttackSessionActive: boolean = false;
    /**敌人攻击房门时使用的机器人配置模式 */
    private readonly doorAttackConfigMode: number = 1;
    /**敌人未攻击房门时使用的机器人配置模式 */
    private readonly doorIdleConfigMode: number = 2;
    /**机器人难度类型 */
    private robotDifficultyType: number = -1;
    /**机器人在各模式难度类型数组中的配置索引 */
    private robotDifficultyDataIdxMap: { [mode: number]: number } = {};
    /**当前等待判定的炮台建造配置 */
    private pendingCannonBuildData: JsonCannonBuildData = null;
    /**炮台行为判定计时 */
    private cannonBuildDecisionTimer: number = 0;
    /**机器人其他道具建造计时 */
    private robotPropsBuildTimer: number = 0;
    /**本局建造道具次数 */
    private gamePropsBuildCountMap: { [key: string]: number } = {};
    /**当前播放的角色动画名称 */
    private curRoleAnimName: string = "";
    /**是否正在播放主角死亡消失动画 */
    private isPlayingDeathDisappear: boolean = false;
    /**击杀当前角色的敌人皮肤 */
    private killerEnemySkinId = 0;
    /**主角死亡时的本局经过时间 */
    private failSurvivalTime = 0;
    /**当前限制角色移动的来源 */
    private moveLockOwners: Set<object> = new Set();

    /**角色状态 */
    private _state: roleState = roleState.normal;
    public get state(): roleState {
        return this._state;
    }
    public set state(value: roleState) {
        if (value == roleState.dead && this._state != roleState.dead && this.roleId == playerMgr.playerComp?.roleId) {
            ccTools.vibrate(2);
            this.failSurvivalTime = this.gameComp?.getGameStartElapsedTime() || 0;
            if (this._state == roleState.bed) {
                this.openFailPageImmediately();
            } else {
                this.playMainPlayerDeathDisappear();
            }
        }
        if (value != roleState.bed) {
            this.stopRobotUpgrade();
        }
        this._state = value;
    }

    /**角色当前是否被限制移动 */
    get isMoveLocked() {
        return this.moveLockOwners.size > 0;
    }

    /**增加移动限制，同一来源不会重复增加 */
    addMoveLock(owner: object) {
        if (!owner) {
            return;
        }

        this.moveLockOwners.add(owner);
        this.playRoleAnim(roleAnimName.idle, true);
    }

    /**移除指定来源的移动限制 */
    removeMoveLock(owner: object) {
        if (!owner) {
            return;
        }

        this.moveLockOwners.delete(owner);
    }

    /**主角立即死亡并弹失败 */
    private openFailPageImmediately() {
        this.isPlayingDeathDisappear = false;
        if (this.gameComp) {
            this.gameComp.isRoleDisappearPlaying = false;
        }
        this.openFailPage();
    }

    /**播放主角死亡消失动画，结束后再弹失败 */
    private playMainPlayerDeathDisappear() {
        if (this.isPlayingDeathDisappear) {
            return;
        }

        this.isPlayingDeathDisappear = true;
        if (this.gameComp) {
            this.gameComp.isRoleDisappearPlaying = true;
        }

        this.showRole();
        let animNode = this.roleAnim?.node || this.node.getChildByName("roleAnim");
        if (!animNode) {
            this.openFailPage();
            return;
        }

        let opacity = animNode.getComponent(UIOpacity) || animNode.addComponent(UIOpacity);
        Tween.stopAllByTarget(animNode);
        Tween.stopAllByTarget(opacity);
        opacity.opacity = 255;

        let duration = Math.max(0, configData.roleDisappearTime);
        tween(opacity)
            .to(duration, { opacity: 0 })
            .call(() => {
                if (this.gameComp) {
                    this.gameComp.isRoleDisappearPlaying = false;
                }
                this.openFailPage();
            })
            .start();
    }

    /**记录击杀当前角色的敌人皮肤 */
    setKillerEnemySkinId(skinId: number) {
        if (Number.isInteger(skinId) && skinId >= 0) {
            this.killerEnemySkinId = skinId;
        }
    }

    /**打开失败界面 */
    private openFailPage() {
        uiMgr.openPage(UIPath.UIFail, {
            enemySkinId: this.killerEnemySkinId,
            survivalTime: this.failSurvivalTime,
        });
    }

    ///
    ///节点
    ///
    /**角色spine节点 */
    roleAnim: sp.Skeleton = null;
    /**角色名称 */
    roleNameLab: Label = null;

    protected onLoad(): void {
        this.roleAnim = this.node.getChildByName("roleAnim").getComponent(sp.Skeleton);
        this.roleNameLab = this.node.getChildByName("roleNameLab").getComponent(Label);
    }

    init(comp: UIGame, id: number, skinId: number, nickname = "", difficultyType: number = -1) {
        this.moveLockOwners.clear();
        this.gameComp = comp;
        this.roleId = id;
        this.skinId = skinId;
        this.killerEnemySkinId = 0;
        this.failSurvivalTime = 0;
        this.state = roleState.normal;
        this.stopRobotUpgrade();
        this.resetDoorAttackUpgradeData();
        this.initRobotDifficulty(difficultyType);
        this.gamePropsBuildCountMap = {};
        this.clearTargetBedReservation();
        this.clearTargetRandomPropsReservation();
        this.clearCarriedRandomProps();
        this.movePath = [];
        this.movePathIdx = 0;
        this.refreshRoleSpine();

        if (this.roleId == 0) {
            this.roleNameLab.string = `你`
        } else {
            this.roleNameLab.string = nickname || `人机${this.roleId}`
        }
    }

    /**根据皮肤id刷新角色spine */
    private async refreshRoleSpine() {
        if (this.roleAnim) {
            this.roleAnim.skeletonData = null;
        }

        let isLoaded = await ccTools.loadSpine(this.roleAnim, spinePath.role + this.skinId);
        if (!isLoaded) {
            return;
        }

        this.curRoleAnimName = "";
        this.playRoleAnim(roleAnimName.idle, true);
    }

    /**累计本角色本局建造道具次数 */
    addGamePropsBuildCount(propsType: tilePropsType) {
        if (!propsType) {
            return;
        }

        this.gamePropsBuildCountMap[propsType] = (this.gamePropsBuildCountMap[propsType] || 0) + 1;
    }

    /**获取本角色本局指定类型道具建造次数 */
    getGamePropsBuildCountByType(propsType: string) {
        if (!propsType) {
            return 0;
        }

        return this.gamePropsBuildCountMap[propsType] || 0;
    }

    /**隐藏角色 */
    hideRole() {
        this.state = roleState.bed;
        for (let i = 0; i < this.node.children.length; i++) {
            this.node.children[i].active = false;
        }
    }

    /**显示角色 */
    showRole() {
        for (let i = 0; i < this.node.children.length; i++) {
            this.node.children[i].active = true;
        }
        this.playRoleAnim(roleAnimName.idle, true);
    }

    /**播放角色动画 */
    playRoleAnim(animName: string, loop: boolean = true) {
        if (!this.roleAnim || !this.roleAnim.skeletonData || this.curRoleAnimName == animName) {
            return;
        }

        this.curRoleAnimName = animName;
        this.roleAnim.setAnimation(0, animName, loop);
    }

    /**寻找房间 */
    suchRoom() {
        if (!this.gameComp || this.roleId == 0 || this.state != roleState.normal) {
            return;
        }

        this.clearTargetBedReservation();
        this.clearTargetRandomPropsReservation();
        this.movePath = [];
        this.movePathIdx = 0;

        if (!this.carriedRandomPropsData && this.trySuchRandomProps()) {
            return;
        }

        this.suchBed();
    }

    /**寻找可抢夺的随机道具 */
    private trySuchRandomProps() {
        let candidates = this.gameComp.getUsableRandomPickPropsCandidates();
        ccTools.shuffleArray(candidates);

        for (let i = 0; i < candidates.length; i++) {
            let candidate = candidates[i];
            let path = this.findPathToBed(candidate.propsPos);
            if (path.length == 0) {
                continue;
            }

            if (!this.gameComp.reserveRandomPickProps(candidate.propsPos, this.roleId)) {
                continue;
            }

            this.hasTargetRandomProps = true;
            this.targetPos.set(candidate.propsPos.x, candidate.propsPos.y);
            this.movePath = path;
            this.movePathIdx = 0;
            return true;
        }

        return false;
    }

    /**寻找房间床位 */
    private suchBed() {
        let candidates = this.getUsableBedCandidates();
        ccTools.shuffleArray(candidates);

        for (let i = 0; i < candidates.length; i++) {
            let candidate = candidates[i];
            let path = this.findPathToBed(candidate.bedPos);
            if (path.length == 0) {
                continue;
            }

            candidate.bedComp.isRobotOccupied = true;
            this.hasTargetBed = true;
            this.targetPos.set(candidate.bedPos.x, candidate.bedPos.y);
            this.movePath = path;
            this.movePathIdx = 0;
            return;
        }
    }

    /**如果当前预定的是指定房间，则重新寻找房间 */
    refreshTargetRoomByOccupiedRoom(roomIdx: number) {
        if (this.roleId == 0 || this.state != roleState.normal || !this.hasTargetBed || roomIdx <= 0) {
            return;
        }

        let targetRoomIdx = this.getTargetRoomIdx();
        if (targetRoomIdx != roomIdx) {
            return;
        }

        this.suchRoom();
    }

    /**获取机器人当前预定床位所在房间 */
    private getTargetRoomIdx() {
        if (!this.hasTargetBed) {
            return 0;
        }

        return this.gameComp?.tileMap?.[this.targetPos.x]?.[this.targetPos.y]?.roomIdx || 0;
    }

    /**清理机器人当前预定床位 */
    private clearTargetBedReservation() {
        if (!this.hasTargetBed) {
            return;
        }

        let tileData = this.gameComp?.tileMap?.[this.targetPos.x]?.[this.targetPos.y];
        let bedComp = tileData?.item?.propsComp as any as bedProps;
        if (bedComp && !bedComp.isOccupied) {
            bedComp.isRobotOccupied = false;
        }

        this.hasTargetBed = false;
    }

    /**清理机器人当前预定随机道具 */
    private clearTargetRandomPropsReservation() {
        if (!this.hasTargetRandomProps) {
            return;
        }

        this.gameComp?.clearRandomPickPropsReservation(this.targetPos, this.roleId);
        this.hasTargetRandomProps = false;
    }

    /**如果当前预定的随机道具已被拾取，则重新判断 */
    refreshTargetRandomPropsByPicked(tilePos: Vec2) {
        if (this.roleId == 0 || this.state != roleState.normal || !this.hasTargetRandomProps || !tilePos) {
            return;
        }

        if (this.targetPos.x != tilePos.x || this.targetPos.y != tilePos.y) {
            return;
        }

        this.hasTargetRandomProps = false;
        this.suchRoom();
    }

    protected update(dt: number): void {
        if (gm.isGamePause) {
            return;
        }

        if (this.roleId != 0 && this.state == roleState.normal && !this.isMoveLocked) {
            this.moveByPath(dt);
        }
        this.refreshRobotUpgrade(dt);
        this.refreshDoorAttackUpgradeCoolDown(dt);
        this.refreshCannonBuildDecision(dt);
        this.refreshRobotPropsBuild(dt);
    }

    /**获取未被玩家或机器人占用的床 */
    private getUsableBedCandidates(): { bedPos: Vec2, bedComp: bedProps }[] {
        let result: { bedPos: Vec2, bedComp: bedProps }[] = [];
        let roomMap = this.gameComp.roomMap || {};
        let roomKeys = Object.keys(roomMap);

        for (let i = 0; i < roomKeys.length; i++) {
            let roomIdx = Number(roomKeys[i]);
            if (this.gameComp.isGuideRoom(roomIdx)) {
                continue;
            }

            let roomData = roomMap[roomIdx];
            let bedPos: Vec2 = roomData?.bedPos;
            if (!bedPos) {
                continue;
            }

            let tileData = this.gameComp.tileMap[bedPos.x]?.[bedPos.y];
            let bedComp = tileData?.item?.propsComp as any as bedProps;
            if (!bedComp || bedComp.isOccupied || bedComp.isRobotOccupied) {
                continue;
            }

            result.push({ bedPos: new Vec2(bedPos.x, bedPos.y), bedComp: bedComp });
        }

        return result;
    }

    /**按当前地图实际宽高寻路到床，机器人忽略门，目标床本身允许进入 */
    private findPathToBed(targetPos: Vec2): Vec2[] {
        let width = Math.floor(pData.mapSize?.width || 0);
        let height = Math.floor(pData.mapSize?.height || 0);
        if (width <= 0 || height <= 0) {
            return [];
        }

        let startPos = this.currentPos;
        if (startPos.x == targetPos.x && startPos.y == targetPos.y) {
            return [new Vec2(targetPos.x, targetPos.y)];
        }

        return ccTools.findGridPath(
            width,
            height,
            startPos,
            targetPos,
            (x, y) => this.canRobotWalk(x, y, targetPos),
        );
    }

    /**机器人可通行判断：门可通过，其他障碍不可通过，目标床可进入 */
    private canRobotWalk(tileX: number, tileY: number, targetPos: Vec2) {
        if (tileX < 0 || tileY < 0 || tileX >= pData.mapSize.width || tileY >= pData.mapSize.height) {
            return false;
        }

        if (tileX == targetPos.x && tileY == targetPos.y) {
            return true;
        }

        let tileData = this.gameComp.tileMap[tileX]?.[tileY];
        if (!tileData) {
            return false;
        }

        if (tileData.item?.tileType == "door") {
            return true;
        }

        return tileData.block != 1;
    }

    /**按路径移动机器人 */
    private moveByPath(dt: number) {
        if (this.movePathIdx >= this.movePath.length) {
            if (this.state == roleState.normal) {
                this.playRoleAnim(roleAnimName.idle, true);
            }
            return;
        }

        this.playRoleAnim(roleAnimName.move, true);
        let nextTilePos = this.movePath[this.movePathIdx];
        let targetNodePos = ccTools.getPosByTileIndex(nextTilePos, this.tempTargetNodePos);
        let curNodePos = this.node.position;
        let offsetX = targetNodePos.x - curNodePos.x;
        let offsetY = targetNodePos.y - curNodePos.y;
        let distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        let moveDistance = configData.moveSpeed * dt;
        this.refreshRoleAnimDirection(offsetX);

        if (distance <= moveDistance || distance <= 0.001) {
            this.node.setPosition(targetNodePos);
            this.currentPos.set(nextTilePos.x, nextTilePos.y);
            this.movePathIdx++;

            if (this.movePathIdx >= this.movePath.length) {
                if (this.hasTargetRandomProps) {
                    this.arriveRandomProps();
                } else if (this.hasTargetBed) {
                    this.arriveBed();
                } else {
                    this.movePath = [];
                    this.movePathIdx = 0;
                }
            }
            return;
        }

        let moveX = offsetX / distance * moveDistance;
        let moveY = offsetY / distance * moveDistance;
        this.node.setPosition(curNodePos.x + moveX, curNodePos.y + moveY, curNodePos.z);
    }

    /**根据水平移动方向刷新角色动画朝向 */
    private refreshRoleAnimDirection(offsetX: number) {
        let roleAnimNode = this.roleAnim?.node;
        if (!roleAnimNode || Math.abs(offsetX) <= 0.001) {
            return;
        }

        roleAnimNode.setScale(offsetX < 0 ? -1 : 1, 1, 1);
    }

    /**到达随机道具 */
    private arriveRandomProps() {
        let propsData = this.gameComp.robotPickupRandomProps(this.targetPos, this.roleId, this.node);
        this.movePath = [];
        this.movePathIdx = 0;
        this.hasTargetRandomProps = false;

        if (!propsData) {
            this.suchRoom();
            return;
        }

        this.currentPos.set(this.targetPos);
        this.carriedRandomPropsData = propsData;
        this.attachCarriedRandomProps();
        this.suchRoom();
    }

    /**到达床铺 */
    private arriveBed() {
        let tileData = this.gameComp.tileMap[this.targetPos.x]?.[this.targetPos.y];
        let bedComp = tileData.item.propsComp as any as bedProps;
        //如果当前床铺被人占用，重新寻找床位
        if (bedComp.isOccupied) {
            this.suchRoom();
            return;
        }

        this.currentPos.set(this.targetPos);
        this.movePath = [];
        this.movePathIdx = 0;
        this.hasTargetBed = false;
        this.roomIdx = tileData.roomIdx;

        if (this.carriedRandomPropsData && this.gameComp.placeRobotRandomPropsInRoom(this.roomIdx, this.carriedRandomPropsData, this)) {
            this.clearCarriedRandomProps();
        }

        //床铺占用
        bedComp.isOccupied = true;
        bedComp.showRole(this.skinId);

        //关门
        this.gameComp.closeDoorByRoom(this.roomIdx);

        this.hideRole();
        this.gameComp?.refreshDoorMachineEffect(this.roomIdx);
        this.startRobotUpgrade();

        gm.Event.emit(GameEvent.refreshPlayerPos);
    }

    /**开始机器人上床后的常规升级曲线 */
    private startRobotUpgrade() {
        if (this.roleId == 0 || this.roomIdx <= 0) {
            return;
        }

        this.robotUpgradeIdx = 0;
        this.robotUpgradeTimer = 0;
        this.robotUpgradeTime = 0;
        this.generatorBuildTimer = 0;
        this.generatorBuildTime = 0;
        this.generatorUpgradeTimer = 0;
        this.generatorUpgradeTime = 0;
        this.isRobotUpgrading = true;
        this.resetDoorAttackUpgradeData();
        this.setNextRobotUpgradeTime();
        this.startNextCannonBuildDecision(true);
    }

    /**停止机器人升级曲线 */
    private stopRobotUpgrade() {
        this.robotUpgradeIdx = 0;
        this.robotUpgradeTimer = 0;
        this.robotUpgradeTime = 0;
        this.isRobotUpgrading = false;
        this.generatorBuildTimer = 0;
        this.generatorBuildTime = 0;
        this.generatorUpgradeTimer = 0;
        this.generatorUpgradeTime = 0;
        this.resetDoorAttackUpgradeData();
    }

    /**重置房门受攻击升级数据 */
    private resetDoorAttackUpgradeData() {
        this.doorAttackUpgradeCount = 0;
        this.doorAttackUpgradeCoolDown = 0;
        this.laterHighDamageDoorUpgradeUsed = false;
        this.isDoorAttackSessionActive = false;
        this.robotPropsBuildTimer = 0;
        this.cancelCannonBuildDecision();
    }

    /**刷新房门受攻击升级冷却 */
    private refreshDoorAttackUpgradeCoolDown(dt: number) {
        if (this.doorAttackUpgradeCoolDown <= 0) {
            return;
        }

        this.doorAttackUpgradeCoolDown = Math.max(0, this.doorAttackUpgradeCoolDown - dt);
    }

    /**门受到敌人攻击时尝试升级房门 */
    tryUpgradeDoorByEnemyAttack() {
        if (this.roleId == 0 || this.roomIdx <= 0 || this.state != roleState.bed) {
            return;
        }

        if (this.doorAttackUpgradeCount >= robotCommonConfig.enemyUpgradeDoorMax) {
            return;
        }

        if (this.doorAttackUpgradeCoolDown > 0) {
            return;
        }

        if (!this.gameComp?.upgradeRoomPropsByType(this.roomIdx, tilePropsType.door)) {
            return;
        }

        this.doorAttackUpgradeCount++;
        this.doorAttackUpgradeCoolDown = robotCommonConfig.enemyAttackTimeUpgrade;
    }

    /**敌人开始攻击房门 */
    onDoorAttackStart() {
        if (this.roleId == 0 || this.roomIdx <= 0 || this.state != roleState.bed) {
            return;
        }

        this.isDoorAttackSessionActive = true;
        this.robotPropsBuildTimer = 0;
        this.startNextCannonBuildDecision(true);
    }

    /**按当前炮台数量开始下一轮行为判定 */
    private startNextCannonBuildDecision(executeImmediately: boolean = false) {
        if (this.roleId == 0 || this.roomIdx <= 0 || this.state != roleState.bed) {
            this.cancelCannonBuildDecision();
            return;
        }

        let mode = this.getCannonBuildConfigMode();
        let cannonCount = this.gameComp?.getRoomPropsCountByType(this.roomIdx, tilePropsType.cannon) || 0;
        this.pendingCannonBuildData = cannonBuildConfig.getDataByCannonCount(cannonCount, mode);
        this.cannonBuildDecisionTimer = 0;
        if (executeImmediately && this.pendingCannonBuildData && (Number(this.pendingCannonBuildData.time) || 0) <= 0) {
            this.executeCannonBuildDecision();
        }
    }

    /**敌人停止攻击当前房门 */
    onDoorAttackEnd() {
        this.isDoorAttackSessionActive = false;
        this.robotPropsBuildTimer = 0;
        this.startNextCannonBuildDecision(true);
    }

    /**后期门受到敌人高伤攻击时保留原有的一次房门升级 */
    tryHandleDoorAttackLater(damagePercent: number) {
        if (this.roleId == 0 || this.roomIdx <= 0 || this.state != roleState.bed
            || damagePercent <= robotCommonConfig.doorHpAttackPercent || this.laterHighDamageDoorUpgradeUsed) {
            return;
        }

        this.laterHighDamageDoorUpgradeUsed = true;
        this.gameComp?.upgradeRoomPropsByType(this.roomIdx, tilePropsType.door);
    }

    /**刷新炮台行为的延迟判定 */
    private refreshCannonBuildDecision(dt: number) {
        if (!this.pendingCannonBuildData) {
            return;
        }

        if (this.roleId == 0 || this.roomIdx <= 0 || this.state != roleState.bed) {
            this.cancelCannonBuildDecision();
            return;
        }

        this.cannonBuildDecisionTimer += dt;
        if (this.cannonBuildDecisionTimer >= Math.max(0, Number(this.pendingCannonBuildData.time) || 0)) {
            this.executeCannonBuildDecision();
        }
    }

    /**根据难度权重执行炮台行为，完成后按最新数量开始下一轮判定 */
    private executeCannonBuildDecision() {
        let buildData = this.pendingCannonBuildData;
        this.cancelCannonBuildDecision();
        console.warn
        if (!buildData) {
            return;
        }

        let difficultyData = this.getRobotDifficultyData(this.getCannonBuildConfigMode());
        let idx = Math.floor(Number(buildData.idx));
        let weights = this.parseProbabilityWeights(difficultyData?.[`probability${idx}`]);
        // console.warn("-------->执行炮台行为判定:\n",weights);
        switch (ccTools.getWeightedRandomIndex(weights)) {
            case 0:
                this.gameComp?.buildRobotCannon(this.roomIdx);
                break;
            case 1:
                this.gameComp?.upgradeRobotCannon(this.roomIdx);
                break;
            case 3:
                this.gameComp?.sellRobotCannon(this.roomIdx);
                break;
        }

        this.startNextCannonBuildDecision();
    }

    /**初始化并记录本局机器人难度配置位置 */
    private initRobotDifficulty(forcedDifficultyType: number = -1) {
        this.robotDifficultyType = -1;
        this.robotDifficultyDataIdxMap = {};
        if (this.roleId == 0) {
            return;
        }

        if (pData.AIdifficultyTypes.length <= 0) {
            return;
        }

        this.robotDifficultyType = pData.AIdifficultyTypes.indexOf(forcedDifficultyType) >= 0
            ? forcedDifficultyType
            : pData.AIdifficultyTypes[Math.floor(Math.random() * pData.AIdifficultyTypes.length)];
        let modes = [this.doorAttackConfigMode, this.doorIdleConfigMode];
        for (let i = 0; i < modes.length; i++) {
            let mode = modes[i];
            let typeDataArr = robotDifficultyConfig.getDataByModeAndType(mode, this.robotDifficultyType);
            if (typeDataArr.length > 0) {
                this.robotDifficultyDataIdxMap[mode] = Math.floor(Math.random() * typeDataArr.length);
            }
        }
    }

    /**获取机器人初始化时选中的难度配置 */
    private getRobotDifficultyData(mode: number): JsonRobotDifficultyData {
        let dataIdx = this.robotDifficultyDataIdxMap[mode];
        if (this.robotDifficultyType <= 0 || dataIdx === undefined) {
            return null;
        }
        return robotDifficultyConfig.getDataByModeAndType(
            mode,
            this.robotDifficultyType,
        )[dataIdx] || null;
    }

    /**根据房门受击状态获取当前炮台建造配置模式 */
    private getCannonBuildConfigMode(): number {
        return this.isDoorAttackSessionActive ? this.doorAttackConfigMode : this.doorIdleConfigMode;
    }

    /**解析表中的行为权重数组 */
    private parseProbabilityWeights(value: string | number[]): number[] {
        if (Array.isArray(value)) {
            return value;
        }

        if (typeof value != "string") {
            return [];
        }

        try {
            let weights = JSON.parse(value);
            return Array.isArray(weights) ? weights : [];
        } catch (error) {
            console.warn("机器人行为权重配置无效:", value);
            return [];
        }
    }

    /**取消本次尚未执行的炮台行为判定 */
    private cancelCannonBuildDecision() {
        this.pendingCannonBuildData = null;
        this.cannonBuildDecisionTimer = 0;
    }

    /**根据房门是否正在受攻击，按对应间隔尝试建造其他道具 */
    private refreshRobotPropsBuild(dt: number) {
        if (this.roleId == 0 || this.roomIdx <= 0 || this.state != roleState.bed) {
            return;
        }

        let generatorCount = this.gameComp?.getRoomPropsCountByType(this.roomIdx, tilePropsType.generator) || 0;
        if (generatorCount <= 0) {
            this.robotPropsBuildTimer = 0;
            return;
        }

        let interval = Math.max(0, Number(this.isDoorAttackSessionActive
            ? robotCommonConfig.enemyAttackPropsInterval
            : robotCommonConfig.enemyNotAttackPropsInterval) || 0);
        this.robotPropsBuildTimer += dt;
        if (this.robotPropsBuildTimer < interval) {
            return;
        }

        this.robotPropsBuildTimer = interval > 0 ? this.robotPropsBuildTimer % interval : 0;
        let weights = this.isDoorAttackSessionActive
            ? robotCommonConfig.enemyAttackPropsWeight
            : robotCommonConfig.enemyNotAttackPropsWeight;
        this.executeRobotPropsBuild(weights);
    }

    /**按公共配置权重执行一次其他道具建造判定 */
    private executeRobotPropsBuild(weights: number[]) {
        let behaviorIdx = ccTools.getWeightedRandomIndex(weights);
        if (behaviorIdx == 0) {
            this.executeRobotVeinBuild();
            return;
        }

        if (behaviorIdx >= 1 && behaviorIdx <= 3) {
            this.gameComp?.buildRobotRandomPropsByBuildType(this.roomIdx, behaviorIdx + 2);
        }
    }

    /**根据当前矿脉数量配置决定建造一级矿脉或升级现有矿脉 */
    private executeRobotVeinBuild() {
        let veinCount = this.gameComp?.getRoomPropsCountByType(this.roomIdx, tilePropsType.vein) || 0;
        let buildData = veinBuildConfig.getDataByVeinCount(veinCount);
        if (!buildData) {
            return;
        }

        let behaviorIdx = ccTools.getWeightedRandomIndex(this.parseProbabilityWeights(buildData.probability));
        if (behaviorIdx == 0) {
            this.gameComp?.buildRobotVein(this.roomIdx);
        } else if (behaviorIdx == 1) {
            this.gameComp?.upgradeRobotVein(this.roomIdx);
        }
    }

    /**刷新机器人升级计时 */
    private refreshRobotUpgrade(dt: number) {
        if (!this.isRobotUpgrading || this.roleId == 0 || this.state != roleState.bed) {
            return;
        }

        this.refreshRobotNormalUpgrade(dt);
        this.refreshRobotGeneratorBuild(dt);
        this.refreshRobotGeneratorUpgrade(dt);
    }

    /**刷新机器人常规升级计时 */
    private refreshRobotNormalUpgrade(dt: number) {
        if (this.robotUpgradeTime <= 0) {
            return;
        }

        this.robotUpgradeTimer += dt;
        if (this.robotUpgradeTimer < this.robotUpgradeTime) {
            return;
        }

        let upgradeData = robotUpgradeConfig.getData(this.robotUpgradeIdx);
        if (upgradeData) {
            this.gameComp?.upgradeRoomPropsByType(this.roomIdx, upgradeData.propsType);
        }

        this.robotUpgradeIdx++;
        this.setNextRobotUpgradeTime();
    }

    /**刷新机器人发电机建造计时 */
    private refreshRobotGeneratorBuild(dt: number) {
        if (this.robotUpgradeIdx < robotCommonConfig.generatorBuildLevel) {
            return;
        }

        let generatorCount = this.gameComp?.getRoomPropsCountByType(this.roomIdx, tilePropsType.generator) || 0;
        if (generatorCount >= robotCommonConfig.generatorMax) {
            this.generatorBuildTimer = 0;
            this.generatorBuildTime = 0;
            return;
        }

        if (this.generatorBuildTime <= 0) {
            this.generatorBuildTime = this.getRandomInterval(robotCommonConfig.generatorBuildInterval);
            this.generatorBuildTimer = 0;
            return;
        }

        this.generatorBuildTimer += dt;
        if (this.generatorBuildTimer < this.generatorBuildTime) {
            return;
        }

        this.gameComp?.buildRoomPropsByType(this.roomIdx, tilePropsType.generator);
        this.generatorBuildTimer = 0;
        this.generatorBuildTime = 0;
    }

    /**刷新机器人发电机升级计时 */
    private refreshRobotGeneratorUpgrade(dt: number) {
        if (this.robotUpgradeIdx < robotCommonConfig.generatorBuildLevel) {
            return;
        }

        let bedLevel = this.gameComp?.getRoomBedLevel(this.roomIdx) ?? -1;
        if ((bedLevel + 1) < robotCommonConfig.generatorBuildBedLevel) {
            this.generatorUpgradeTimer = 0;
            this.generatorUpgradeTime = 0;
            return;
        }

        let generatorMinLevel = this.gameComp?.getRoomPropsMinLevelByType(this.roomIdx, tilePropsType.generator) ?? -1;
        if (generatorMinLevel < 0 || generatorMinLevel >= robotCommonConfig.generatorMaxLevel) {
            this.generatorUpgradeTimer = 0;
            this.generatorUpgradeTime = 0;
            return;
        }

        if (this.generatorUpgradeTime <= 0) {
            this.generatorUpgradeTime = this.getRandomInterval(robotCommonConfig.generatorUpgradeInterval);
            this.generatorUpgradeTimer = 0;
            return;
        }

        this.generatorUpgradeTimer += dt;
        if (this.generatorUpgradeTimer < this.generatorUpgradeTime) {
            return;
        }

        this.gameComp?.upgradeRoomPropsByType(this.roomIdx, tilePropsType.generator, robotCommonConfig.generatorMaxLevel);
        this.generatorUpgradeTimer = 0;
        this.generatorUpgradeTime = 0;
    }

    /**设置下一次机器人升级所需时间 */
    private setNextRobotUpgradeTime() {
        if (this.robotUpgradeIdx >= robotUpgradeConfig.dataLength) {
            this.robotUpgradeTimer = 0;
            this.robotUpgradeTime = 0;
            return;
        }

        let upgradeData = robotUpgradeConfig.getData(this.robotUpgradeIdx);
        if (!upgradeData) {
            this.robotUpgradeTimer = 0;
            this.robotUpgradeTime = 0;
            return;
        }

        let timeMin = Number(upgradeData.timeMin) || 0;
        let timeMax = Number(upgradeData.timeMax) || timeMin;
        if (timeMax < timeMin) {
            let temp = timeMin;
            timeMin = timeMax;
            timeMax = temp;
        }

        this.robotUpgradeTimer = 0;
        this.robotUpgradeTime = timeMin + Math.random() * (timeMax - timeMin);
    }

    /**获取区间随机时间 */
    private getRandomInterval(interval: number[]) {
        let timeMin = Number(interval?.[0]) || 0;
        let timeMax = Number(interval?.[1]) || timeMin;
        if (timeMax < timeMin) {
            let temp = timeMin;
            timeMin = timeMax;
            timeMax = temp;
        }

        return timeMin + Math.random() * (timeMax - timeMin);
    }

    /**刷新人机身上携带道具的位置和缩放 */
    private attachCarriedRandomProps() {
        let carriedData = this.carriedRandomPropsData;
        if (!carriedData?.propsNode) {
            return;
        }

        carriedData.propsNode.setPosition(this.getCarriedPropsLocalPos());
        carriedData.propsNode.setScale(new Vec3(0.7, 0.7, 1));
    }

    /**获取携带道具相对人机节点的位置 */
    private getCarriedPropsLocalPos() {
        let roleAnimTrans = this.node.getChildByName("roleAnim")?.getComponent(UITransform);
        if (!roleAnimTrans) {
            return new Vec3(0, 0, 0);
        }

        return new Vec3(0, roleAnimTrans.height / 2, 0);
    }

    /**清理人机当前携带的随机道具节点 */
    private clearCarriedRandomProps() {
        if (!this.carriedRandomPropsData) {
            return;
        }

        let carriedData = this.carriedRandomPropsData;
        carriedData.propsComp?.clearData();
        if (carriedData.propsComp) {
            carriedData.propsComp.enabled = false;
        }
        if (carriedData.propsNode) {
            // 机器人携带的道具同样按类型回池，避免反复销毁和添加脚本
            poolMgr.putPropsNode(carriedData.propsNode, carriedData.propsType);
        }
        this.carriedRandomPropsData = null;
    }
}

interface robotCarriedRandomPropsData {
    propsType: tilePropsType;
    level: number;
    isSpecialSellProps: boolean;
    propsNode: Node;
    propsComp: any;
}
