import { _decorator, Component, Label, sp, Vec2, Vec3 } from 'cc';
import { pData } from '../manager/playerData';
import { ccTools } from '../extention/generalTools';
import { configData, GameEvent, robotCommonConfig } from '../manager/configData';
import type { UIGame } from '../UIPage/UIGame';
import { bedProps } from './props/bedProps';
import { gm } from '../manager/gm';
import { playerMgr } from '../manager/playerManager';
import { uiMgr } from '../manager/UIManager';
import { UIPath } from '../manager/pathConfig';
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
    /**机器人印钞机建造计时 */
    private printerBuildTimer: number = 0;
    /**机器人印钞机建造所需时间 */
    private printerBuildTime: number = 0;
    /**房门受攻击后升级次数 */
    private doorAttackUpgradeCount: number = 0;
    /**房门受攻击后升级冷却 */
    private doorAttackUpgradeCoolDown: number = 0;
    /**房间主动建造炮台升级冷却 */
    private cannonBuildUpgradeCoolDown: number = 0;
    /**后期高伤房门升级是否已使用 */
    private laterHighDamageDoorUpgradeUsed: boolean = false;
    /**当前是否有敌人正在连续攻击房门 */
    private isDoorAttackSessionActive: boolean = false;
    /**当前敌人连续攻击房门时间 */
    private doorAttackSessionElapsedTime: number = 0;

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

    init(comp: UIGame, id: number) {
        this.gameComp = comp;
        this.roleId = id;
        this.state = roleState.normal;
        this.stopRobotUpgrade();
        this.resetDoorAttackUpgradeData();

        //TODO 名称后续加入配置，先临时写死
        if (this.roleId == 0) {
            this.roleNameLab.string = `玩家${this.roleId + 1}`
        } else {
            this.roleNameLab.string = `人机${this.roleId}`
        }
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
    }

    /**寻找房间 */
    suchRoom() {
        if (!this.gameComp || this.roleId == 0 || this.state != roleState.normal) {
            return;
        }

        this.clearTargetBedReservation();
        this.movePath = [];
        this.movePathIdx = 0;

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

    protected update(dt: number): void {
        if (gm.isGamePause) {
            return;
        }

        this.moveByPath(dt);
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
            return;
        }

        let nextTilePos = this.movePath[this.movePathIdx];
        let targetNodePos = ccTools.getPosByTileIndex(nextTilePos);
        let curNodePos = this.node.position;
        let offsetX = targetNodePos.x - curNodePos.x;
        let offsetY = targetNodePos.y - curNodePos.y;
        let distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        let moveDistance = configData.moveSpeed * dt;

        if (distance <= moveDistance || distance <= 0.001) {
            this.node.setPosition(targetNodePos);
            this.currentPos = new Vec2(nextTilePos.x, nextTilePos.y);
            this.movePathIdx++;

            if (this.movePathIdx >= this.movePath.length) {
                this.arriveBed();
            }
            return;
        }

        let moveX = offsetX / distance * moveDistance;
        let moveY = offsetY / distance * moveDistance;
        this.node.setPosition(new Vec3(curNodePos.x + moveX, curNodePos.y + moveY, curNodePos.z));
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

        //床铺占用
        bedComp.isOccupied = true;
        bedComp.showRole(this.skinId);

        //关门
        this.gameComp.closeDoorByRoom(this.roomIdx);

        this.hideRole();
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
        this.printerBuildTimer = 0;
        this.printerBuildTime = 0;
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
        this.printerBuildTimer = 0;
        this.printerBuildTime = 0;
        this.resetDoorAttackUpgradeData();
    }

    /**重置房门受攻击升级数据 */
    private resetDoorAttackUpgradeData() {
        this.doorAttackUpgradeCount = 0;
        this.doorAttackUpgradeCoolDown = 0;
        this.cannonBuildUpgradeCoolDown = 0;
        this.laterHighDamageDoorUpgradeUsed = false;
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

        this.tryBuildOrUpgradeCannonByEnemyAttack(gameStartElapsedTime);
    }

    /**后期高伤是否允许生成炮台 */
    private canBuildCannonByLaterHighDamage() {
        if (!this.isDoorAttackSessionActive) {
            return false;
        }

        return this.doorAttackSessionElapsedTime <= robotCommonConfig.cannonBuildTimedLater;
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

    /**刷新机器人印钞机建造计时 */
    private refreshRobotPrinterBuild(dt: number) {
        let generatorMaxLevel = this.gameComp?.getRoomPropsMaxLevelByType(this.roomIdx, tilePropsType.generator) ?? -1;
        if ((generatorMaxLevel + 1) < robotCommonConfig.printerBuildLevel) {
            this.printerBuildTimer = 0;
            this.printerBuildTime = 0;
            return;
        }

        let printerCount = this.gameComp?.getRoomPropsCountByType(this.roomIdx, tilePropsType.printer) || 0;
        if (printerCount >= robotCommonConfig.printerMax) {
            this.printerBuildTimer = 0;
            this.printerBuildTime = 0;
            return;
        }

        if (this.printerBuildTime <= 0) {
            this.printerBuildTime = this.getRandomInterval(robotCommonConfig.printerBuildInterval);
            this.printerBuildTimer = 0;
            return;
        }

        this.printerBuildTimer += dt;
        if (this.printerBuildTimer < this.printerBuildTime) {
            return;
        }

        this.gameComp?.buildRoomPropsByType(this.roomIdx, tilePropsType.printer, this.getRandomPrinterLevel());
        this.printerBuildTimer = 0;
        this.printerBuildTime = 0;
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

    /**按配置权重随机印钞机建造等级 */
    private getRandomPrinterLevel() {
        let weights = robotCommonConfig.printerBuildWeight || [];
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
}
