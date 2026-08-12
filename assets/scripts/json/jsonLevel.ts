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

interface JsonLevelData {
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
    /**人机难度选择 */
    AIdifficulty: string;
}
