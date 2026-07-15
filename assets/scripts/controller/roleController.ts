import { _decorator, Component, Label, Node, sp, UITransform, Vec2, Vec3 } from 'cc';
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
    currentPos: Vec2 = Vec2.ZERO;
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
    /**机器人矿脉建造计时 */
    private veinBuildTimer: number = 0;
    /**机器人矿脉建造所需时间 */
    private veinBuildTime: number = 0;
    /**房门受攻击后升级次数 */
    private doorAttackUpgradeCount: number = 0;
    /**房门受攻击后升级冷却 */
    private doorAttackUpgradeCoolDown: number = 0;
    /**房间主动建造炮台升级冷却 */
    private cannonBuildUpgradeCoolDown: number = 0;
    /**后期高伤房门升级是否已使用 */
    private laterHighDamageDoorUpgradeUsed: boolean = false;
    /**后期高伤机床建造是否已触发 */
    private laterHighDamageMachineBuildUsed: boolean = false;
    /**后期高伤寒冰建造是否已触发 */
    private laterHighDamageIceBuildUsed: boolean = false;
    /**当前是否有敌人正在连续攻击房门 */
    private isDoorAttackSessionActive: boolean = false;
    /**当前敌人连续攻击房门时间 */
    private doorAttackSessionElapsedTime: number = 0;
    /**本局建造道具次数 */
    private gamePropsBuildCountMap: { [key: string]: number } = {};
    /**当前播放的角色动画名称 */
    private curRoleAnimName: string = "";

    /**角色状态 */
    private _state: roleState = roleState.normal;
    public get state(): roleState {
        return this._state;
    }
    public set state(value: roleState) {
        if (value == roleState.dead && this.roleId == playerMgr.playerComp.roleId) {
            //玩家死亡
            uiMgr.openPage(UIPath.UIFail);
        }
        if (value != roleState.bed) {
            this.stopRobotUpgrade();
        }
        this._state = value;
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

    init(comp: UIGame, id: number, skinId: number) {
        this.gameComp = comp;
        this.roleId = id;
        this.skinId = skinId;
        this.state = roleState.normal;
        this.stopRobotUpgrade();
        this.resetDoorAttackUpgradeData();
        this.gamePropsBuildCountMap = {};
        this.clearTargetBedReservation();
        this.clearTargetRandomPropsReservation();
        this.clearCarriedRandomProps();
        this.movePath = [];
        this.movePathIdx = 0;
        this.refreshRoleSpine();

        //TODO 名称后续加入配置，先临时写死
        if (this.roleId == 0) {
            this.roleNameLab.string = `玩家${this.roleId + 1}`
        } else {
            this.roleNameLab.string = `人机${this.roleId}`
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

        if (this.roleId != 0) {
            this.moveByPath(dt);
        }
        this.refreshRobotUpgrade(dt);
        this.refreshDoorAttackUpgradeCoolDown(dt);
        this.refreshCannonBuildUpgradeCoolDown(dt);
        this.refreshDoorAttackSessionTime(dt);
    }

    /**获取未被玩家或机器人占用的床 */
    private getUsableBedCandidates(): { bedPos: Vec2, bedComp: bedProps }[] {
        let result: { bedPos: Vec2, bedComp: bedProps }[] = [];
        let roomMap = this.gameComp.roomMap || {};
        let roomKeys = Object.keys(roomMap);

        for (let i = 0; i < roomKeys.length; i++) {
            let roomData = roomMap[roomKeys[i]];
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

    /**寻路到床，机器人忽略门，目标床本身允许进入 */
    private findPathToBed(targetPos: Vec2): Vec2[] {
        if (!pData.mapSize || pData.mapSize.width <= 0 || pData.mapSize.height <= 0) {
            return [];
        }

        let startPos = new Vec2(this.currentPos.x, this.currentPos.y);
        if (startPos.x == targetPos.x && startPos.y == targetPos.y) {
            return [new Vec2(targetPos.x, targetPos.y)];
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
                if (!this.canRobotWalk(nextPos, targetPos) || visited[nextPos.x][nextPos.y]) {
                    continue;
                }

                visited[nextPos.x][nextPos.y] = true;
                parent[nextPos.x][nextPos.y] = curPos;
                queue.push(nextPos);
            }
        }

        return [];
    }

    /**还原路径，返回值不包含起点，包含终点 */
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

    /**机器人可通行判断：门可通过，其他障碍不可通过，目标床可进入 */
    private canRobotWalk(tilePos: Vec2, targetPos: Vec2) {
        if (tilePos.x < 0 || tilePos.y < 0 || tilePos.x >= pData.mapSize.width || tilePos.y >= pData.mapSize.height) {
            return false;
        }

        if (tilePos.x == targetPos.x && tilePos.y == targetPos.y) {
            return true;
        }

        let tileData = this.gameComp.tileMap[tilePos.x]?.[tilePos.y];
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
        let targetNodePos = ccTools.getPosByTileIndex(nextTilePos);
        let curNodePos = this.node.position;
        let offsetX = targetNodePos.x - curNodePos.x;
        let offsetY = targetNodePos.y - curNodePos.y;
        let distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        let moveDistance = configData.moveSpeed * dt;
        this.refreshRoleAnimDirection(offsetX);

        if (distance <= moveDistance || distance <= 0.001) {
            this.node.setPosition(targetNodePos);
            this.currentPos = new Vec2(nextTilePos.x, nextTilePos.y);
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
        this.node.setPosition(new Vec3(curNodePos.x + moveX, curNodePos.y + moveY, curNodePos.z));
    }

    /**根据水平移动方向刷新角色动画朝向 */
    private refreshRoleAnimDirection(offsetX: number) {
        let roleAnimNode = this.roleAnim?.node;
        if (!roleAnimNode || Math.abs(offsetX) <= 0.001) {
            return;
        }

        roleAnimNode.setScale(new Vec3(offsetX < 0 ? -1 : 1, 1, 1));
    }

    /**到达随机道具 */
    private arriveRandomProps() {
        let propsData = this.gameComp.robotPickupRandomProps(this.targetPos, this.roleId);
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
        this.veinBuildTimer = 0;
        this.veinBuildTime = 0;
        this.isRobotUpgrading = true;
        this.resetDoorAttackUpgradeData();
        this.setNextRobotUpgradeTime();
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
        this.veinBuildTimer = 0;
        this.veinBuildTime = 0;
        this.resetDoorAttackUpgradeData();
    }

    /**重置房门受攻击升级数据 */
    private resetDoorAttackUpgradeData() {
        this.doorAttackUpgradeCount = 0;
        this.doorAttackUpgradeCoolDown = 0;
        this.cannonBuildUpgradeCoolDown = 0;
        this.laterHighDamageDoorUpgradeUsed = false;
        this.laterHighDamageMachineBuildUsed = false;
        this.laterHighDamageIceBuildUsed = false;
        this.isDoorAttackSessionActive = false;
        this.doorAttackSessionElapsedTime = 0;
    }

    /**刷新房门受攻击升级冷却 */
    private refreshDoorAttackUpgradeCoolDown(dt: number) {
        if (this.doorAttackUpgradeCoolDown <= 0) {
            return;
        }

        this.doorAttackUpgradeCoolDown = Math.max(0, this.doorAttackUpgradeCoolDown - dt);
    }

    /**刷新房间主动建造炮台升级冷却 */
    private refreshCannonBuildUpgradeCoolDown(dt: number) {
        if (this.cannonBuildUpgradeCoolDown <= 0) {
            return;
        }

        this.cannonBuildUpgradeCoolDown = Math.max(0, this.cannonBuildUpgradeCoolDown - dt);
    }

    /**刷新当前敌人连续攻击房门时间 */
    private refreshDoorAttackSessionTime(dt: number) {
        if (!this.isDoorAttackSessionActive) {
            return;
        }

        this.doorAttackSessionElapsedTime += dt;
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
        this.isDoorAttackSessionActive = true;
        this.doorAttackSessionElapsedTime = 0;
    }

    /**后期门受到敌人攻击 */
    tryHandleDoorAttackLater(damagePercent: number, gameStartElapsedTime: number) {
        if (damagePercent > robotCommonConfig.doorHpAttackPercent) {
            this.tryHandleLaterHighDamageDoorAttack(gameStartElapsedTime);
            return;
        }

        if (damagePercent < robotCommonConfig.doorHpAttackPercent) {
            this.tryBuildOrUpgradeCannonByEnemyAttack(gameStartElapsedTime);
        }
    }

    /**门受到敌人低伤攻击时尝试建造或升级炮台 */
    private tryBuildOrUpgradeCannonByEnemyAttack(gameStartElapsedTime: number) {
        if (this.roleId == 0 || this.roomIdx <= 0 || this.state != roleState.bed) {
            return;
        }

        let result = this.gameComp?.buildOrUpgradeCannonByDoor(this.roomIdx, this.cannonBuildUpgradeCoolDown <= 0) || 0;
        if (result != 2) {
            return;
        }

        this.cannonBuildUpgradeCoolDown = this.getCannonBuildUpgradeCoolDown(gameStartElapsedTime);
    }

    /**后期门受到敌人高伤攻击 */
    private tryHandleLaterHighDamageDoorAttack(gameStartElapsedTime: number) {
        if (this.roleId == 0 || this.roomIdx <= 0 || this.state != roleState.bed) {
            return;
        }

        if (!this.laterHighDamageDoorUpgradeUsed) {
            this.laterHighDamageDoorUpgradeUsed = true;
            this.gameComp?.upgradeRoomPropsByType(this.roomIdx, tilePropsType.door);
            return;
        }

        if (!this.canBuildCannonByLaterHighDamage()) {
            return;
        }

        this.tryBuildLaterHighDamageProps(gameStartElapsedTime);
        this.tryBuildOrUpgradeCannonByEnemyAttack(gameStartElapsedTime);
    }

    /**后期高伤时间窗内尝试补充防守道具 */
    private tryBuildLaterHighDamageProps(gameStartElapsedTime: number) {
        if (!this.laterHighDamageMachineBuildUsed && gameStartElapsedTime >= robotCommonConfig.machineBuildTimeThreshold) {
            this.laterHighDamageMachineBuildUsed = true;
            this.gameComp?.buildRoomPropsByTypeIfAbsent(this.roomIdx, tilePropsType.machine);
        }

        if (!this.laterHighDamageIceBuildUsed && gameStartElapsedTime >= robotCommonConfig.iceBuildTimeThreshold) {
            this.laterHighDamageIceBuildUsed = true;
            this.gameComp?.buildRoomPropsByTypeIfAbsent(this.roomIdx, tilePropsType.ice);
        }
    }

    /**后期高伤是否允许生成炮台 */
    private canBuildCannonByLaterHighDamage() {
        if (!this.isDoorAttackSessionActive) {
            return false;
        }

        return this.doorAttackSessionElapsedTime <= robotCommonConfig.propsBuildTimedLater;
    }

    /**获取当前时间段炮台主动升级冷却 */
    private getCannonBuildUpgradeCoolDown(gameStartElapsedTime: number) {
        if (gameStartElapsedTime > robotCommonConfig.cannonBuildTimeThresholdLater) {
            return robotCommonConfig.cannonBuildUpgradeCoolDownLater;
        }

        return robotCommonConfig.cannonBuildUpgradeCoolDown;
    }

    /**刷新机器人升级计时 */
    private refreshRobotUpgrade(dt: number) {
        if (!this.isRobotUpgrading || this.roleId == 0 || this.state != roleState.bed) {
            return;
        }

        this.refreshRobotNormalUpgrade(dt);
        this.refreshRobotGeneratorBuild(dt);
        this.refreshRobotGeneratorUpgrade(dt);
        this.refreshRobotPrinterBuild(dt);
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

    /**刷新机器人矿脉建造计时 */
    private refreshRobotPrinterBuild(dt: number) {
        let generatorMaxLevel = this.gameComp?.getRoomPropsMaxLevelByType(this.roomIdx, tilePropsType.generator) ?? -1;
        if ((generatorMaxLevel + 1) < robotCommonConfig.veinBuildLevel) {
            this.veinBuildTimer = 0;
            this.veinBuildTime = 0;
            return;
        }

        let veinCount = this.gameComp?.getRoomPropsCountByType(this.roomIdx, tilePropsType.vein) || 0;
        if (veinCount >= robotCommonConfig.veinMax) {
            this.veinBuildTimer = 0;
            this.veinBuildTime = 0;
            return;
        }

        if (this.veinBuildTime <= 0) {
            this.veinBuildTime = this.getRandomInterval(robotCommonConfig.veinBuildInterval);
            this.veinBuildTimer = 0;
            return;
        }

        this.veinBuildTimer += dt;
        if (this.veinBuildTimer < this.veinBuildTime) {
            return;
        }

        this.gameComp?.buildRoomPropsByType(this.roomIdx, tilePropsType.vein, this.getRandomVeinLevel());
        this.veinBuildTimer = 0;
        this.veinBuildTime = 0;
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

    /**按配置权重随机矿脉建造等级 */
    private getRandomVeinLevel() {
        let weights = robotCommonConfig.veinBuildWeight || [];
        let totalWeight = 0;
        for (let i = 0; i < weights.length; i++) {
            totalWeight += Math.max(0, Number(weights[i]) || 0);
        }

        if (totalWeight <= 0) {
            return 0;
        }

        let randomValue = Math.random() * totalWeight;
        for (let i = 0; i < weights.length; i++) {
            randomValue -= Math.max(0, Number(weights[i]) || 0);
            if (randomValue <= 0) {
                return i;
            }
        }

        return 0;
    }

    /**把拾取到的随机道具挂到人机身上 */
    private attachCarriedRandomProps() {
        let carriedData = this.carriedRandomPropsData;
        if (!carriedData?.propsNode) {
            return;
        }

        this.node.addChild(carriedData.propsNode);
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
            carriedData.propsComp.destroy();
        }
        carriedData.propsNode?.removeFromParent();
        carriedData.propsNode?.destroy();
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
