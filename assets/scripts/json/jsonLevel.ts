import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
const { ccclass, property } = _decorator;

@ccclass('jsonLevel')
export class jsonLevel extends jsonBase {
    /** 表格名称 */
    tableName: string = "levelTable";
    protected jsonPath: string = "json/levelTable";
    protected tableUrl1: string = "";
    protected tableUrl2: string = "";

    get tableData() : JsonLevelData[]{
        return this.data;
    }

    /**根据已通关关卡数获取等级索引和等级内关卡序号 */
    getLevelIndex(level: number): [number, number] {
        if (!this.data?.length) {
            return [-1, -1];
        }

        let remainingLevel = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
        for (let i = 0; i < this.tableData.length; i++) {
            if (i == this.tableData.length - 1) {
                return [i, remainingLevel + 1];
            }
            let quantity = this.tableData[i].quantity;
            if (remainingLevel < quantity) {
                return [i, remainingLevel + 1];
            }
            remainingLevel -= quantity;
        }

        return [-1, -1];
    }

    /**根据已通关关卡数获取关卡配置 */
    getLevelData(level: number): JsonLevelData {
        let levelIndex = this.getLevelIndex(level);
        return this.tableData?.[levelIndex[0]] || null;
    }

    /**根据关卡表索引生成Boss全等级数据 */
    getBossAllData(levelTableIndex: number): JsonBossData[] {
        let levelData = this.tableData?.[levelTableIndex];
        if (!levelData) {
            return [];
        }

        let bossAllData: JsonBossData[] = [];
        let levelMax = Number.isFinite(levelData.levelMax) ? Math.max(0, Math.floor(levelData.levelMax)) : 0;
        for (let bossLevel = 0; bossLevel < levelMax; bossLevel++) {
            let previousBossData = bossAllData[bossLevel - 1];
            bossAllData.push({
                level: bossLevel + 1,
                hp: previousBossData ? previousBossData.hp * levelData.healthMultiplier : levelData.hp,
                attack: previousBossData ? previousBossData.attack * levelData.attackMultiplier : levelData.attack,
                upgradeTimeMin: previousBossData
                    ? previousBossData.upgradeTimeMin + bossLevel * levelData.timeMinMultiplier
                    : levelData.upgradeTimeMin,
                upgradeTimeMax: previousBossData
                    ? previousBossData.upgradeTimeMax + bossLevel * levelData.timeMaxMultiplier
                    : levelData.upgradeTimeMax,
            });
        }
        return bossAllData.map(data => ({
            level: data.level,
            hp: Math.round(data.hp),
            attack: Math.round(data.attack),
            upgradeTimeMin: Math.round(data.upgradeTimeMin),
            upgradeTimeMax: Math.round(data.upgradeTimeMax),
        }));
    }

    /**根据等级索引和等级内关卡序号获取关卡名称 */
    getLevelName(levelIndex: [number, number]): string {
        let levelData = this.tableData?.[levelIndex?.[0]];
        if (!levelData || levelIndex[1] < 1) {
            return "";
        }
        return `${levelData.name}-${levelIndex[1]}`;
    }
}
export let levelConfig = new jsonLevel();

export interface JsonLevelData {
    /**关卡名称 */
    name: string;
    /**等级最大值 */
    levelMax: number;
    /**关卡数量 */
    quantity: number;
    /**boss血量（1级） */
    hp: number;
    /**boss攻击力（1级） */
    attack: number;
    /**升级最小时间 */
    upgradeTimeMin: number;
    /**升级最大时间 */
    upgradeTimeMax: number;
    /**升级血量倍率 */
    healthMultiplier: number;
    /**升级攻击力倍率 */
    attackMultiplier: number;
    /**升级最小时间倍率 */
    timeMinMultiplier: number;
    /**升级最大时间倍率 */
    timeMaxMultiplier: number;
    /**人机难度选择 */
    AIdifficulty: string;
}

export interface JsonBossData {
    /**等级 */
    level: number;
    /**血量 */
    hp: number;
    /**攻击力 */
    attack: number;
    /**升级最小时间 */
    upgradeTimeMin: number;
    /**升级最大时间 */
    upgradeTimeMax: number;
}
